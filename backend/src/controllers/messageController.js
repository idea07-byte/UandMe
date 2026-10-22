import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { isValidObjectId, validateSendMessageInput } from '../utils/validators.js';

/**
 * Retrieve messages for a conversation.
 * Route: GET /api/messages/:chatId OR GET /api/chats/:id/messages
 */
export const getMessages = async (req, res, next) => {
  try {
    const chatId = req.params.chatId || req.params.id;

    if (!isValidObjectId(chatId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format: Must be a valid 24-character hexadecimal ObjectId',
      });
    }

    // 1. Verify conversation exists
    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    // 2. Security Check: Requester must be a participant
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

    // 3. Pagination query params
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const before = req.query.before;

    const messageQuery = { conversationId: chatId };

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        messageQuery.createdAt = { $lt: beforeDate };
      }
    }

    // 4. Fetch messages sorted chronologically
    const messages = await Message.find(messageQuery)
      .populate('sender', 'name email avatar about department status role')
      .sort({ createdAt: 1 })
      .limit(limit);

    // 5. Automatically mark incoming unread messages as read by current user
    const unreadMessageIds = messages
      .filter(
        (m) =>
          m.sender &&
          (m.sender._id || m.sender).toString() !== currentUserIdStr &&
          !(m.readBy || []).some((r) => r.toString() === currentUserIdStr)
      )
      .map((m) => m._id);

    if (unreadMessageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessageIds } },
        {
          $addToSet: { readBy: req.user._id },
          $set: { status: 'read' },
        }
      );

      // Update in-memory message status for this response
      messages.forEach((m) => {
        if (unreadMessageIds.includes(m._id)) {
          if (!m.readBy) m.readBy = [];
          m.readBy.push(req.user._id);
          m.status = 'read';
        }
      });

      // Update conversation's lastMessage status if applicable
      if (
        conversation.lastMessage &&
        conversation.lastMessage.sender?.toString() !== currentUserIdStr
      ) {
        conversation.lastMessage.status = 'read';
        await conversation.save();
      }
    }

    return res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
};

/**
 * Send a new message in a conversation.
 * Route: POST /api/messages OR POST /api/chats/:id/messages
 */
export const sendMessage = async (req, res, next) => {
  try {
    const rawChatId = req.body.chatId || req.body.conversationId || req.params.id;

    // 1. Validate payload
    const validation = validateSendMessageInput({
      ...req.body,
      chatId: rawChatId,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: validation.error,
      });
    }

    const { chatId, text, attachments, clientMessageId } = validation;

    // 2. Verify conversation exists
    const conversation = await Conversation.findById(chatId);
    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found',
      });
    }

    // 3. Security Check: Requester must be a participant
    const currentUserIdStr = req.user._id.toString();
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === currentUserIdStr
    );

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'Access forbidden: You cannot send messages to a conversation you are not part of',
      });
    }

    // 4. Create and persist message
    const message = await Message.create({
      conversationId: chatId,
      sender: req.user._id,
      text,
      attachments,
      clientMessageId: clientMessageId || null,
      status: 'sent',
      readBy: [req.user._id],
    });

    // 5. Update Conversation lastMessage snippet and timestamp
    const snippet = text || (attachments.length > 0 ? '📎 Attachment' : '');
    conversation.lastMessage = {
      text: snippet,
      sender: req.user._id,
      timestamp: message.createdAt,
      status: 'sent',
    };
    await conversation.save();

    // 6. Return populated message
    const populated = await Message.findById(message._id).populate(
      'sender',
      'name email avatar about department status role'
    );

    return res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * Mark messages in a conversation as read.
 * Route: PATCH /api/messages/:chatId/read OR POST /api/messages/read
 */
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const chatId =
      req.params.chatId || req.params.id || req.body.chatId || req.body.conversationId;

    if (!isValidObjectId(chatId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid conversation ID format: Must be a valid 24-character hexadecimal ObjectId',
      });
    }

    const conversation = await Conversation.findById(chatId);
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

    // Mark unread messages sent by others as read
    const updateResult = await Message.updateMany(
      {
        conversationId: chatId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
        $set: { status: 'read' },
      }
    );

    // Update conversation lastMessage status
    if (
      conversation.lastMessage &&
      conversation.lastMessage.sender?.toString() !== currentUserIdStr
    ) {
      conversation.lastMessage.status = 'read';
      await conversation.save();
    }

    return res.status(200).json({
      status: 'success',
      message: 'Messages marked as read successfully',
      updatedCount: updateResult.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a specific message.
 * Route: DELETE /api/messages/:id
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid message ID format: Must be a valid 24-character hexadecimal ObjectId',
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found',
      });
    }

    // Fetch parent conversation to verify permissions
    const conversation = await Conversation.findById(message.conversationId);
    const currentUserIdStr = req.user._id.toString();
    const isSender = message.sender.toString() === currentUserIdStr;
    const isGroupAdmin = conversation?.admin?.toString() === currentUserIdStr;

    if (!isSender && !isGroupAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access forbidden: You can only delete messages sent by yourself',
      });
    }

    await Message.findByIdAndDelete(id);

    // If this was the lastMessage, reconcile conversation lastMessage with previous message
    if (
      conversation &&
      conversation.lastMessage?.timestamp?.getTime() === message.createdAt.getTime()
    ) {
      const prevMessage = await Message.findOne({ conversationId: conversation._id }).sort({
        createdAt: -1,
      });

      if (prevMessage) {
        conversation.lastMessage = {
          text:
            prevMessage.text ||
            (prevMessage.attachments?.length > 0 ? '📎 Attachment' : ''),
          sender: prevMessage.sender,
          timestamp: prevMessage.createdAt,
          status: prevMessage.status,
        };
      } else {
        conversation.lastMessage = {
          text: '',
          sender: null,
          timestamp: conversation.createdAt,
          status: 'sent',
        };
      }
      await conversation.save();
    }

    return res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
