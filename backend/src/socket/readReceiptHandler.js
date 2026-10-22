import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { isValidObjectId } from '../utils/validators.js';
import { createSocketError, createSocketSuccess } from './conversationHandler.js';

/**
 * Register Read Receipt Handlers.
 *
 * Implements authoritative read receipts for PulseChat:
 * - 'message:read' (aliased to 'mark_read')
 *
 * Requirements:
 * 1. Track which participants have read a message (updates readBy array and status).
 * 2. Authorize all read-status updates (rejects non-participants).
 * 3. Emit updated read status to all other participants in the conversation room.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerReadReceiptHandlers = (io, socket) => {
  /**
   * Handle 'message:read' / 'mark_read' event
   */
  const handleMessageRead = async (payload, callback) => {
    try {
      if (!payload || typeof payload !== 'object') {
        const err = createSocketError(
          'Payload must be a valid JSON object containing conversationId',
          'INVALID_PAYLOAD'
        );
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      const conversationId = payload.conversationId || payload.chatId || payload.id;
      if (!conversationId || !isValidObjectId(conversationId)) {
        const err = createSocketError(
          'Invalid conversation ID format: Must be a valid 24-character hexadecimal ObjectId',
          'INVALID_CONVERSATION_ID'
        );
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      // 1. Verify conversation exists and user is a participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        const err = createSocketError(
          'Conversation room not found',
          'CONVERSATION_NOT_FOUND',
          { conversationId }
        );
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === socket.userId
      );

      if (!isParticipant) {
        const err = createSocketError(
          'Access forbidden: You cannot update read receipts for a conversation you are not part of',
          'FORBIDDEN_READ_RECEIPT',
          { conversationId }
        );
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      // 2. Identify target messages to mark as read
      const query = {
        conversationId,
        sender: { $ne: socket.userId }, // A user reading their own message does not trigger a read receipt
        readBy: { $ne: socket.userId }, // Only update if not already marked read by this user
      };

      let specificMessageIds = [];
      if (payload.messageId && isValidObjectId(payload.messageId)) {
        specificMessageIds = [payload.messageId];
        query._id = payload.messageId;
      } else if (Array.isArray(payload.messageIds) && payload.messageIds.length > 0) {
        const validIds = payload.messageIds.filter(isValidObjectId);
        if (validIds.length > 0) {
          specificMessageIds = validIds;
          query._id = { $in: validIds };
        }
      }

      // 3. Update messages in MongoDB
      const updateResult = await Message.updateMany(query, {
        $addToSet: { readBy: socket.userId },
        $set: { status: 'read' },
      });

      // 4. Update conversation lastMessage status if applicable
      if (
        conversation.lastMessage &&
        conversation.lastMessage.sender?.toString() !== socket.userId
      ) {
        conversation.lastMessage.status = 'read';
        await conversation.save();
      }

      // 5. Build event payload
      const readEventPayload = {
        conversationId: conversationId.toString(),
        readBy: socket.userId,
        readByUserName: socket.user.name,
        messageIds: specificMessageIds,
        updatedCount: updateResult.modifiedCount,
        timestamp: new Date().toISOString(),
      };

      // 6. Broadcast read receipt to other participants in the conversation room
      socket.to(conversationId.toString()).emit('message:read', readEventPayload);

      // Also emit compatibility event 'message_status_updated'
      socket.to(conversationId.toString()).emit('message_status_updated', {
        conversationId: conversationId.toString(),
        status: 'read',
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      // 7. Acknowledge caller
      const successResponse = createSocketSuccess(
        {
          conversationId: conversationId.toString(),
          readCount: updateResult.modifiedCount,
        },
        'Read receipts updated successfully'
      );

      socket.emit('message:read:ack', successResponse);
      if (typeof callback === 'function') callback(successResponse);
    } catch (err) {
      console.error(`❌ [Socket.IO] Error in message:read:`, err.message);
      const errPayload = createSocketError('Failed to process read receipt', 'SERVER_ERROR');
      socket.emit('socket:error', errPayload);
      if (typeof callback === 'function') callback(errPayload);
    }
  };

  // -------------------------------------------------------------
  // Event Bindings & Aliases
  // -------------------------------------------------------------
  socket.on('message:read', handleMessageRead);
  socket.on('mark_read', handleMessageRead);
};

export default registerReadReceiptHandlers;
