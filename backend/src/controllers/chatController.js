import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import {
  isValidObjectId,
  validateDirectChatInput,
  validateGroupChatInput,
} from '../utils/validators.js';
import { supabaseService } from '../services/supabaseService.js';
import { supabaseAdmin } from '../config/supabase.js';

const isUsingSupabase = () => mongoose.connection.readyState !== 1 && Boolean(supabaseAdmin);

/**
 * Access an existing 1-on-1 direct conversation or create a new one.
 * Route: POST /api/chats
 */
export const accessOrCreateChat = async (req, res, next) => {
  try {
    // If request specifies isGroup=true, delegate to group creation
    if (req.body.isGroup === true || req.body.isGroupChat === true) {
      return createGroupChat(req, res, next);
    }

    // 1. Validate direct chat input
    const validation = validateDirectChatInput(req.body, req.user._id);
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validation.error,
      });
    }

    const targetUserId = validation.targetUserId;

    if (isUsingSupabase()) {
      const chat = await supabaseService.createOrGetDirectChat(req.user._id, targetUserId);
      return res.status(200).json(chat);
    }

    // 2. Verify target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Target user does not exist',
      });
    }

    // 3. Search for existing 1-on-1 conversation
    let existingChat = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, targetUserId], $size: 2 },
    })
      .populate('participants', 'name email avatar about department status lastSeen role')
      .populate('lastMessage.sender', 'name email avatar');

    if (existingChat) {
      const chatObj = existingChat.toObject({ virtuals: true });
      chatObj.pinned = (existingChat.pinnedBy || []).some(
        (p) => p.toString() === req.user._id.toString()
      );
      chatObj.isMuted = (existingChat.mutedBy || []).some(
        (m) => m.toString() === req.user._id.toString()
      );
      chatObj.isArchived = (existingChat.archivedBy || []).some(
        (a) => a.toString() === req.user._id.toString()
      );
      return res.status(200).json(chatObj);
    }

    // 4. Create new 1-on-1 conversation
    const newChat = await Conversation.create({
      isGroup: false,
      participants: [req.user._id, targetUserId],
    });

    const populatedChat = await Conversation.findById(newChat._id).populate(
      'participants',
      'name email avatar about department status lastSeen role'
    );

    const chatObj = populatedChat.toObject({ virtuals: true });
    chatObj.pinned = false;
    chatObj.isMuted = false;
    chatObj.isArchived = false;
    chatObj.unreadCount = 0;

    return res.status(201).json(chatObj);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new group conversation.
 * Route: POST /api/chats/group
 */
export const createGroupChat = async (req, res, next) => {
  try {
    // 1. Validate group chat input
    const validation = validateGroupChatInput(req.body, req.user._id);
    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validation.error,
      });
    }

    const { name, participants, avatar } = validation;

    if (isUsingSupabase()) {
      const group = await supabaseService.createGroupChat(req.user._id, { name, avatar, participants });
      return res.status(201).json(group);
    }

    // 2. Verify all participants exist in database
    const usersCount = await User.countDocuments({ _id: { $in: participants } });
    if (usersCount !== participants.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more specified participants do not exist',
      });
    }

    // 3. Create group conversation
    const groupChat = await Conversation.create({
      isGroup: true,
      name,
      avatar: avatar || '',
      participants,
      admin: req.user._id,
    });

    const populatedGroup = await Conversation.findById(groupChat._id)
      .populate('participants', 'name email avatar about department status lastSeen role')
      .populate('admin', 'name email avatar');

    const chatObj = populatedGroup.toObject({ virtuals: true });
    chatObj.pinned = false;
    chatObj.isMuted = false;
    chatObj.isArchived = false;
    chatObj.unreadCount = 0;

    return res.status(201).json(chatObj);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve all conversations for the authenticated user.
 * Supports filters (all, unread, favorites), search, and view (chats vs archived).
 * Route: GET /api/chats
 */
export const getUserConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { filter = 'all', search = '', view = 'chats' } = req.query;

    if (isUsingSupabase()) {
      const convs = await supabaseService.getUserConversations(currentUserId, { filter, search, view });
      return res.status(200).json(convs);
    }

    // Base query: conversations where the current user is a participant
    const query = { participants: currentUserId };

    // View filter: active chats vs archived
    if (view === 'archived') {
      query.archivedBy = currentUserId;
    } else {
      query.archivedBy = { $ne: currentUserId };
    }

    // Fetch conversations sorted by lastMessage or updatedAt descending
    const conversations = await Conversation.find(query)
      .populate('participants', 'name email avatar about department status lastSeen role')
      .populate('lastMessage.sender', 'name email avatar')
      .populate('admin', 'name email avatar')
      .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 });

    if (conversations.length === 0) {
      return res.status(200).json([]);
    }

    // Batch compute unread message count for current user
    const conversationIds = conversations.map((c) => c._id);
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          sender: { $ne: currentUserId },
          readBy: { $ne: currentUserId },
        },
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = new Map(unreadAgg.map((u) => [u._id.toString(), u.count]));

    // Map conversation documents with computed user-specific flags
    let result = conversations.map((c) => {
      const obj = c.toObject({ virtuals: true });
      const idStr = c._id.toString();
      obj.unreadCount = unreadMap.get(idStr) || 0;
      obj.pinned = (c.pinnedBy || []).some((p) => p.toString() === currentUserId.toString());
      obj.isMuted = (c.mutedBy || []).some((m) => m.toString() === currentUserId.toString());
      obj.isArchived = (c.archivedBy || []).some((a) => a.toString() === currentUserId.toString());
      return obj;
    });

    // Apply category filter
    if (filter === 'unread') {
      result = result.filter((c) => c.unreadCount > 0);
    }

    // Apply search filter
    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const msgMatch = c.lastMessage?.text?.toLowerCase().includes(q);
        const participantMatch = c.participants?.some(
          (p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
        );
        return nameMatch || msgMatch || participantMatch;
      });
    }

    // Sort: Pinned first, then latest activity descending
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = new Date(a.lastMessage?.timestamp || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessage?.timestamp || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve a single conversation by ID.
 * Route: GET /api/chats/:id
 */
export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format: Must be a valid 24-character hexadecimal ObjectId',
      });
    }

    if (isUsingSupabase()) {
      const conv = await supabaseService.getConversationById(id, req.user._id);
      if (!conv) {
        return res.status(404).json({
          status: 'error',
          message: 'Conversation not found',
        });
      }
      return res.status(200).json(conv);
    }

    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email avatar about department status lastSeen role')
      .populate('lastMessage.sender', 'name email avatar')
      .populate('admin', 'name email avatar');

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    // Security check: User must be an authorized participant
    const isParticipant = conversation.participants.some(
      (p) => (p._id || p).toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Access forbidden: You are not a participant in this conversation',
      });
    }

    // Compute unread count
    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    });

    const obj = conversation.toObject({ virtuals: true });
    obj.unreadCount = unreadCount;
    obj.pinned = (conversation.pinnedBy || []).some(
      (p) => p.toString() === req.user._id.toString()
    );
    obj.isMuted = (conversation.mutedBy || []).some(
      (m) => m.toString() === req.user._id.toString()
    );
    obj.isArchived = (conversation.archivedBy || []).some(
      (a) => a.toString() === req.user._id.toString()
    );

    return res.status(200).json(obj);
  } catch (err) {
    next(err);
  }
};

/**
 * Update conversation metadata and user preferences (pin, mute, archive, rename group).
 * Route: PATCH /api/chats/:id
 */
export const updateConversation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format: Must be a valid 24-character hexadecimal ObjectId',
      });
    }

    if (isUsingSupabase()) {
      const updated = await supabaseService.updateConversationFlags(id, req.user._id, {
        pinned: req.body.pinned !== undefined ? req.body.pinned : req.body.isPinned,
        isMuted: req.body.isMuted,
        isArchived: req.body.isArchived,
        name: req.body.name,
        avatar: req.body.avatar,
      });
      if (!updated) {
        return res.status(404).json({
          status: 'error',
          message: 'Conversation not found',
        });
      }
      return res.status(200).json(updated);
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    const currentUserIdStr = req.user._id.toString();
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserIdStr
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Access forbidden: You are not a participant in this conversation',
      });
    }

    const { pinned, muted, archived, name, chatName, avatar } = req.body;

    // 1. Toggle Pin
    if (typeof pinned === 'boolean') {
      if (pinned) {
        if (!conversation.pinnedBy.some((p) => p.toString() === currentUserIdStr)) {
          conversation.pinnedBy.push(req.user._id);
        }
      } else {
        conversation.pinnedBy = conversation.pinnedBy.filter(
          (p) => p.toString() !== currentUserIdStr
        );
      }
    }

    // 2. Toggle Mute
    if (typeof muted === 'boolean') {
      if (muted) {
        if (!conversation.mutedBy.some((m) => m.toString() === currentUserIdStr)) {
          conversation.mutedBy.push(req.user._id);
        }
      } else {
        conversation.mutedBy = conversation.mutedBy.filter(
          (m) => m.toString() !== currentUserIdStr
        );
      }
    }

    // 3. Toggle Archive
    if (typeof archived === 'boolean') {
      if (archived) {
        if (!conversation.archivedBy.some((a) => a.toString() === currentUserIdStr)) {
          conversation.archivedBy.push(req.user._id);
        }
      } else {
        conversation.archivedBy = conversation.archivedBy.filter(
          (a) => a.toString() !== currentUserIdStr
        );
      }
    }

    // 4. Update group name/avatar (Group chats only)
    const newName = typeof name === 'string' ? name : typeof chatName === 'string' ? chatName : null;
    if (newName !== null) {
      if (!conversation.isGroup) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot rename a 1-on-1 direct conversation',
        });
      }
      if (newName.trim().length < 2 || newName.trim().length > 60) {
        return res.status(400).json({
          status: 'error',
          message: 'Group title must be between 2 and 60 characters',
        });
      }
      conversation.name = newName.trim();
    }

    if (typeof avatar === 'string' && conversation.isGroup) {
      conversation.avatar = avatar.trim();
    }

    await conversation.save();

    const updated = await Conversation.findById(id)
      .populate('participants', 'name email avatar about department status lastSeen role')
      .populate('lastMessage.sender', 'name email avatar')
      .populate('admin', 'name email avatar');

    const obj = updated.toObject({ virtuals: true });
    obj.pinned = (updated.pinnedBy || []).some((p) => p.toString() === currentUserIdStr);
    obj.isMuted = (updated.mutedBy || []).some((m) => m.toString() === currentUserIdStr);
    obj.isArchived = (updated.archivedBy || []).some((a) => a.toString() === currentUserIdStr);

    return res.status(200).json(obj);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a conversation or leave a group.
 * Route: DELETE /api/chats/:id
 */
export const deleteOrLeaveConversation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format: Must be a valid 24-character hexadecimal ObjectId',
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    const currentUserIdStr = req.user._id.toString();
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserIdStr
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Access forbidden: You are not a participant in this conversation',
      });
    }

    if (conversation.isGroup) {
      const isAdmin = conversation.admin?.toString() === currentUserIdStr;

      if (isAdmin) {
        // Group Admin deletes the group completely
        await Message.deleteMany({ conversationId: id });
        await Conversation.findByIdAndDelete(id);
        return res.status(200).json({
          status: 'success',
          message: 'Group conversation and message history deleted successfully',
        });
      } else {
        // Regular participant leaves the group
        conversation.participants = conversation.participants.filter(
          (p) => p.toString() !== currentUserIdStr
        );
        await conversation.save();
        return res.status(200).json({
          status: 'success',
          message: 'Successfully left the group conversation',
        });
      }
    } else {
      // 1-on-1 direct conversation: Delete conversation and its messages
      await Message.deleteMany({ conversationId: id });
      await Conversation.findByIdAndDelete(id);
      return res.status(200).json({
        status: 'success',
        message: 'Direct conversation and message history deleted successfully',
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Add or remove participant from a group conversation.
 * Route: PATCH /api/chats/:id/participants
 */
export const updateGroupParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body; // action: 'add' | 'remove'

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format',
      });
    }

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid participant userId is required',
      });
    }

    if (action !== 'add' && action !== 'remove') {
      return res.status(400).json({
        status: 'error',
        message: "Action must be either 'add' or 'remove'",
      });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot modify participants of a 1-on-1 direct conversation',
      });
    }

    const currentUserIdStr = req.user._id.toString();
    const isAdmin = conversation.admin?.toString() === currentUserIdStr;

    if (!isAdmin && action === 'add') {
      return res.status(403).json({
        status: 'error',
        message: 'Only the group admin can add participants',
      });
    }

    if (action === 'add') {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User to add does not exist',
        });
      }

      if (conversation.participants.some((p) => p.toString() === userId.toString())) {
        return res.status(400).json({
          status: 'error',
          message: 'User is already a participant of this group',
        });
      }

      conversation.participants.push(userId);
    } else if (action === 'remove') {
      if (!isAdmin && userId.toString() !== currentUserIdStr) {
        return res.status(403).json({
          status: 'error',
          message: 'Only the group admin can remove other participants',
        });
      }

      conversation.participants = conversation.participants.filter(
        (p) => p.toString() !== userId.toString()
      );
    }

    await conversation.save();

    const updated = await Conversation.findById(id)
      .populate('participants', 'name email avatar about department status lastSeen role')
      .populate('admin', 'name email avatar');

    return res.status(200).json(updated.toObject({ virtuals: true }));
  } catch (err) {
    next(err);
  }
};
