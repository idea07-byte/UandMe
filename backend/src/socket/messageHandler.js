import messageService from '../services/messageService.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { isValidObjectId } from '../utils/validators.js';
import { createSocketError, createSocketSuccess } from './conversationHandler.js';

/**
 * Register Real-Time Message Handlers (Send, Edit, Delete).
 *
 * Implements real-time messaging lifecycle:
 * - 'message:send' (aliased to 'send_message')
 * - 'message:update' (aliased to 'message:edit') -> broadcasts 'message:updated'
 * - 'message:delete' -> broadcasts 'message:deleted'
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerMessageHandlers = (io, socket) => {
  /**
   * Handle real-time message sending over Socket.IO
   */
  const handleSendMessage = async (payload, callback) => {
    try {
      if (!payload || typeof payload !== 'object') {
        const err = createSocketError('Message payload must be an object', 'INVALID_PAYLOAD');
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      const conversationId = payload.conversationId || payload.chatId;
      const text = payload.text !== undefined ? payload.text : payload.content;
      const { attachments, clientMessageId } = payload;

      const message = await messageService.sendMessage({
        conversationId,
        senderId: socket.userId,
        text,
        attachments,
        clientMessageId,
      });

      // Acknowledgement callback to sender
      const ackPayload = createSocketSuccess(
        { message, clientMessageId },
        'Message sent successfully'
      );
      if (typeof callback === 'function') callback(ackPayload);

      // Broadcast to other members in the conversation room
      socket.to(conversationId.toString()).emit('message:received', message);
      socket.to(conversationId.toString()).emit('receive_message', message);
    } catch (err) {
      console.error(`❌ [Socket.IO] Error in message:send:`, err.message);
      const errPayload = createSocketError(
        err.message || 'Failed to send message',
        err.statusCode === 403 ? 'FORBIDDEN_MESSAGE_SEND' : 'SEND_MESSAGE_FAILED'
      );
      socket.emit('socket:error', errPayload);
      if (typeof callback === 'function') callback(errPayload);
    }
  };

  /**
   * Handle message editing over Socket.IO
   * Emits 'message:updated' to all conversation participants.
   */
  const handleUpdateMessage = async (payload, callback) => {
    try {
      if (!payload || typeof payload !== 'object') {
        const err = createSocketError('Edit payload must be an object', 'INVALID_PAYLOAD');
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      const messageId = payload.messageId || payload.id;
      const text = payload.text !== undefined ? payload.text : payload.content;

      if (!messageId || !isValidObjectId(messageId)) {
        const err = createSocketError('Invalid message ID format', 'INVALID_MESSAGE_ID');
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      const updated = await messageService.editMessage({
        messageId,
        userId: socket.userId,
        text,
      });

      const response = createSocketSuccess({ message: updated }, 'Message updated successfully');
      if (typeof callback === 'function') callback(response);

      // Broadcast 'message:updated' to all participants in the conversation room
      io.to(updated.conversationId.toString()).emit('message:updated', {
        messageId: updated._id.toString(),
        conversationId: updated.conversationId.toString(),
        text: updated.text,
        isEdited: true,
        editedAt: updated.editedAt,
        message: updated,
      });
    } catch (err) {
      console.error(`❌ [Socket.IO] Error in message:update:`, err.message);
      const errPayload = createSocketError(
        err.message || 'Failed to update message',
        err.statusCode === 403 ? 'FORBIDDEN_EDIT_MESSAGE' : 'EDIT_MESSAGE_FAILED'
      );
      socket.emit('socket:error', errPayload);
      if (typeof callback === 'function') callback(errPayload);
    }
  };

  /**
   * Handle message deletion over Socket.IO
   * Emits 'message:deleted' to all conversation participants.
   */
  const handleDeleteMessage = async (payload, callback) => {
    try {
      if (!payload || typeof payload !== 'object') {
        const err = createSocketError('Delete payload must be an object', 'INVALID_PAYLOAD');
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      const messageId = payload.messageId || payload.id;
      const mode = payload.mode || 'soft';

      if (!messageId || !isValidObjectId(messageId)) {
        const err = createSocketError('Invalid message ID format', 'INVALID_MESSAGE_ID');
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      // Find message to get conversationId before deleting
      const existing = await Message.findById(messageId);
      if (!existing) {
        const err = createSocketError('Message not found', 'MESSAGE_NOT_FOUND');
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      const conversationId = existing.conversationId.toString();

      const result = await messageService.deleteMessage({
        messageId,
        userId: socket.userId,
        mode,
      });

      const response = createSocketSuccess(result, 'Message deleted successfully');
      if (typeof callback === 'function') callback(response);

      // Broadcast 'message:deleted' to all participants in the conversation room
      io.to(conversationId).emit('message:deleted', {
        messageId: messageId.toString(),
        conversationId,
        mode,
        deletedBy: socket.userId,
        text: mode === 'soft' ? 'This message was deleted' : null,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`❌ [Socket.IO] Error in message:delete:`, err.message);
      const errPayload = createSocketError(
        err.message || 'Failed to delete message',
        err.statusCode === 403 ? 'FORBIDDEN_DELETE_MESSAGE' : 'DELETE_MESSAGE_FAILED'
      );
      socket.emit('socket:error', errPayload);
      if (typeof callback === 'function') callback(errPayload);
    }
  };

  // -------------------------------------------------------------
  // Event Bindings & Aliases
  // -------------------------------------------------------------
  socket.on('message:send', handleSendMessage);
  socket.on('send_message', handleSendMessage);

  socket.on('message:update', handleUpdateMessage);
  socket.on('message:edit', handleUpdateMessage);

  socket.on('message:delete', handleDeleteMessage);
};

export default registerMessageHandlers;
