import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { isValidObjectId } from '../utils/validators.js';

/**
 * Enterprise Message Service.
 * Centralizes all core message business logic for reuse between
 * HTTP REST controllers and future Socket.IO real-time event handlers.
 */
class MessageService {
  /**
   * Persist a new message to the database and update conversation metadata.
   *
   * @param {Object} params
   * @param {string} params.conversationId - MongoDB ObjectId of the conversation
   * @param {string} params.senderId - MongoDB ObjectId of the authenticated sender
   * @param {string} [params.text=''] - Message text content
   * @param {Array} [params.attachments=[]] - Attached media files
   * @param {string} [params.clientMessageId=null] - Optimistic UI message ID
   * @returns {Promise<Object>} Populated message document
   */
  async sendMessage({
    conversationId,
    senderId,
    text = '',
    attachments = [],
    clientMessageId = null,
  }) {
    // 1. Validate ID format
    if (!isValidObjectId(conversationId)) {
      const err = new Error('Invalid conversation ID format');
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate content presence and length
    const trimmedText = typeof text === 'string' ? text.trim() : '';
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    if (trimmedText.length === 0 && safeAttachments.length === 0) {
      const err = new Error('Message cannot be empty: provide text or at least one attachment');
      err.statusCode = 400;
      throw err;
    }

    if (trimmedText.length > 2000) {
      const err = new Error('Message text cannot exceed 2000 characters');
      err.statusCode = 400;
      throw err;
    }

    // 3. Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    // 4. Verify sender is a participant
    const senderIdStr = senderId.toString();
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderIdStr
    );

    if (!isParticipant) {
      const err = new Error(
        'Access forbidden: You cannot send messages to a conversation you are not part of'
      );
      err.statusCode = 403;
      throw err;
    }

    // 5. Create Message in MongoDB
    const message = await Message.create({
      conversationId,
      sender: senderId,
      text: trimmedText,
      attachments: safeAttachments,
      clientMessageId: clientMessageId ? clientMessageId.toString().substring(0, 100) : null,
      status: 'sent',
      readBy: [senderId],
    });

    // 6. Update Conversation latest-message information
    const snippet = trimmedText || (safeAttachments.length > 0 ? '📎 Attachment' : '');
    conversation.lastMessage = {
      text: snippet,
      sender: senderId,
      timestamp: message.createdAt,
      status: 'sent',
    };
    await conversation.save();

    // 7. Populate sender details and return
    return await Message.findById(message._id).populate(
      'sender',
      'name email avatar about department status role'
    );
  }

  /**
   * Retrieve messages for a conversation with cursor-based pagination in chronological order.
   *
   * @param {Object} params
   * @param {string} params.conversationId - MongoDB ObjectId of the conversation
   * @param {string} params.userId - Authenticated user's ID
   * @param {number} [params.limit=50] - Number of messages to return (max 100)
   * @param {string} [params.before=null] - Cursor (Date string or ObjectId) to fetch older history
   * @returns {Promise<{ messages: Array, pagination: Object }>}
   */
  async getMessages({ conversationId, userId, limit = 50, before = null }) {
    // 1. Validate ID format
    if (!isValidObjectId(conversationId)) {
      const err = new Error('Invalid conversation ID format');
      err.statusCode = 400;
      throw err;
    }

    // 2. Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    const userIdStr = userId.toString();
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userIdStr
    );

    if (!isParticipant) {
      const err = new Error(
        'Access forbidden: You are not a participant in this conversation'
      );
      err.statusCode = 403;
      throw err;
    }

    // 3. Build query and cursor constraints
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const query = { conversationId };

    let cursorDate = null;
    if (before) {
      if (isValidObjectId(before)) {
        const cursorMsg = await Message.findById(before);
        if (cursorMsg) cursorDate = cursorMsg.createdAt;
      } else {
        const parsed = new Date(before);
        if (!isNaN(parsed.getTime())) cursorDate = parsed;
      }
    }

    let messages = [];

    if (cursorDate) {
      // Paginating older messages: query before cursor
      query.createdAt = { $lt: cursorDate };
    }

    // Always fetch latest window descending for current cursor scope, then reverse for chronological order
    const raw = await Message.find(query)
      .populate('sender', 'name email avatar about department status role')
      .sort({ createdAt: -1 })
      .limit(safeLimit);

    messages = raw.reverse();

    // 4. Determine cursor for subsequent pagination
    const oldestMessage = messages.length > 0 ? messages[0] : null;
    let hasMore = false;
    let nextCursor = null;

    if (oldestMessage) {
      const olderCount = await Message.countDocuments({
        conversationId,
        createdAt: { $lt: oldestMessage.createdAt },
      });
      hasMore = olderCount > 0;
      nextCursor = oldestMessage.createdAt.toISOString();
    }

    // 5. Automatically mark incoming unread messages as read
    const unreadMessageIds = messages
      .filter(
        (m) =>
          m.sender &&
          (m.sender._id || m.sender).toString() !== userIdStr &&
          !(m.readBy || []).some((r) => r.toString() === userIdStr)
      )
      .map((m) => m._id);

    if (unreadMessageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessageIds } },
        {
          $addToSet: { readBy: userId },
          $set: { status: 'read' },
        }
      );

      // Reconcile status in memory
      messages.forEach((m) => {
        if (unreadMessageIds.includes(m._id)) {
          if (!m.readBy) m.readBy = [];
          m.readBy.push(userId);
          m.status = 'read';
        }
      });

      if (
        conversation.lastMessage &&
        conversation.lastMessage.sender?.toString() !== userIdStr
      ) {
        conversation.lastMessage.status = 'read';
        await conversation.save();
      }
    }

    return {
      messages,
      pagination: {
        limit: safeLimit,
        nextCursor,
        hasMore,
      },
    };
  }

  /**
   * Edit an existing message. Verifies ownership before editing.
   *
   * @param {Object} params
   * @param {string} params.messageId - MongoDB ObjectId of message to edit
   * @param {string} params.userId - Authenticated user's ID
   * @param {string} params.text - New text content
   * @returns {Promise<Object>} Updated message
   */
  async editMessage({ messageId, userId, text }) {
    if (!isValidObjectId(messageId)) {
      const err = new Error('Invalid message ID format');
      err.statusCode = 400;
      throw err;
    }

    const trimmedText = typeof text === 'string' ? text.trim() : '';
    if (trimmedText.length === 0) {
      const err = new Error('Message text cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    if (trimmedText.length > 2000) {
      const err = new Error('Message text cannot exceed 2000 characters');
      err.statusCode = 400;
      throw err;
    }

    const message = await Message.findById(messageId);
    if (!message) {
      const err = new Error('Message not found');
      err.statusCode = 404;
      throw err;
    }

    if (message.isDeleted) {
      const err = new Error('Cannot edit a deleted message');
      err.statusCode = 400;
      throw err;
    }

    // Ownership verification
    if (message.sender.toString() !== userId.toString()) {
      const err = new Error('Access forbidden: You can only edit your own messages');
      err.statusCode = 403;
      throw err;
    }

    // Update message content and audit timestamps
    message.text = trimmedText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Reconcile conversation lastMessage if this was the latest message
    const conversation = await Conversation.findById(message.conversationId);
    if (
      conversation &&
      conversation.lastMessage?.timestamp?.getTime() === message.createdAt.getTime()
    ) {
      conversation.lastMessage.text = trimmedText;
      await conversation.save();
    }

    return await Message.findById(messageId).populate(
      'sender',
      'name email avatar about department status role'
    );
  }

  /**
   * Delete a message according to defined message deletion policy.
   *
   * Policy:
   * 1. Only the original sender or conversation group admin can delete a message.
   * 2. Soft-delete (default): The message content is masked as "This message was deleted",
   *    attachments are wiped, and isDeleted is set to true to preserve conversation thread context.
   * 3. Hard-delete: The message document is completely purged from MongoDB.
   *
   * @param {Object} params
   * @param {string} params.messageId - MongoDB ObjectId of message to delete
   * @param {string} params.userId - Authenticated user's ID
   * @param {'soft'|'hard'} [params.mode='soft'] - Deletion policy mode
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMessage({ messageId, userId, mode = 'soft' }) {
    if (!isValidObjectId(messageId)) {
      const err = new Error('Invalid message ID format');
      err.statusCode = 400;
      throw err;
    }

    const message = await Message.findById(messageId);
    if (!message) {
      const err = new Error('Message not found');
      err.statusCode = 404;
      throw err;
    }

    const conversation = await Conversation.findById(message.conversationId);
    const userIdStr = userId.toString();
    const isSender = message.sender.toString() === userIdStr;
    const isGroupAdmin = conversation?.admin?.toString() === userIdStr;

    // Ownership & permission guard
    if (!isSender && !isGroupAdmin) {
      const err = new Error('Access forbidden: You can only delete messages sent by yourself');
      err.statusCode = 403;
      throw err;
    }

    if (mode === 'hard') {
      // Hard delete: remove document from database
      await Message.findByIdAndDelete(messageId);

      // Reconcile latest message if necessary
      if (
        conversation &&
        conversation.lastMessage?.timestamp?.getTime() === message.createdAt.getTime()
      ) {
        const prev = await Message.findOne({
          conversationId: conversation._id,
          isDeleted: false,
        }).sort({ createdAt: -1 });

        conversation.lastMessage = prev
          ? {
              text: prev.text || (prev.attachments?.length > 0 ? '📎 Attachment' : ''),
              sender: prev.sender,
              timestamp: prev.createdAt,
              status: prev.status,
            }
          : {
              text: '',
              sender: null,
              timestamp: conversation.createdAt,
              status: 'sent',
            };
        await conversation.save();
      }

      return {
        messageId,
        isDeleted: true,
        mode: 'hard',
      };
    } else {
      // Soft delete: tombstone preservation
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = userId;
      message.text = 'This message was deleted';
      message.attachments = [];
      await message.save();

      // Reconcile conversation lastMessage
      if (
        conversation &&
        conversation.lastMessage?.timestamp?.getTime() === message.createdAt.getTime()
      ) {
        conversation.lastMessage.text = 'This message was deleted';
        await conversation.save();
      }

      return {
        messageId,
        isDeleted: true,
        mode: 'soft',
        message,
      };
    }
  }

  /**
   * Mark all unread messages in a conversation as read by the user.
   *
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.userId
   * @returns {Promise<number>} Number of messages marked read
   */
  async markMessagesAsRead({ conversationId, userId }) {
    if (!isValidObjectId(conversationId)) {
      const err = new Error('Invalid conversation ID format');
      err.statusCode = 400;
      throw err;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    const userIdStr = userId.toString();
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userIdStr
    );

    if (!isParticipant) {
      const err = new Error(
        'Access forbidden: You are not a participant in this conversation'
      );
      err.statusCode = 403;
      throw err;
    }

    const result = await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
        $set: { status: 'read' },
      }
    );

    if (
      conversation.lastMessage &&
      conversation.lastMessage.sender?.toString() !== userIdStr
    ) {
      conversation.lastMessage.status = 'read';
      await conversation.save();
    }

    return result.modifiedCount;
  }
}

export const messageService = new MessageService();
export default messageService;
