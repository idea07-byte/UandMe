import Conversation from '../models/Conversation.js';
import { isValidObjectId } from '../utils/validators.js';

/**
 * Standardized Socket Error Helper
 * @param {string} message - Human-readable error message
 * @param {string} code - Machine-readable error code
 * @param {any} [details=null] - Optional supplemental details
 * @returns {Object} Standardized error payload
 */
export const createSocketError = (message, code = 'SOCKET_ERROR', details = null) => ({
  status: 'error',
  message,
  code,
  ...(details && { details }),
});

/**
 * Standardized Socket Success Helper
 * @param {Object} data - Payload data
 * @param {string} [message='Operation successful']
 * @returns {Object}
 */
export const createSocketSuccess = (data = {}, message = 'Operation successful') => ({
  status: 'ok',
  message,
  ...data,
});

/**
 * Register Conversation Room Join & Leave Handlers.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerConversationHandlers = (io, socket) => {
  /**
   * Helper: Join conversation room after strictly verifying membership.
   */
  const handleJoin = async (payload, callback) => {
    // 1. Extract conversation ID from payload object or primitive string
    const conversationId =
      typeof payload === 'object' && payload !== null
        ? payload.conversationId || payload.chatId || payload.id
        : payload;

    // 2. Validate ObjectId format
    if (!conversationId || !isValidObjectId(conversationId)) {
      const err = createSocketError(
        'Invalid conversation ID format: Must be a valid 24-character hexadecimal ObjectId',
        'INVALID_CONVERSATION_ID'
      );
      socket.emit('socket:error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    try {
      // 3. Find conversation in MongoDB
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

      // 4. Verify that the authenticated user is an authorized participant
      const isMember = conversation.participants.some(
        (p) => p.toString() === socket.userId
      );

      if (!isMember) {
        const err = createSocketError(
          'Access forbidden: You are not a member of this conversation',
          'FORBIDDEN_ROOM_ACCESS',
          { conversationId }
        );
        socket.emit('socket:error', err);
        if (typeof callback === 'function') callback(err);
        return;
      }

      // 5. Authorized: Join room
      socket.join(conversationId.toString());

      console.log(
        `🚪 [Socket.IO] User ${socket.userId} joined conversation room: ${conversationId}`
      );

      const success = createSocketSuccess(
        { conversationId: conversationId.toString() },
        'Successfully joined conversation room'
      );

      socket.emit('conversation:joined', success);
      if (typeof callback === 'function') callback(success);
    } catch (err) {
      console.error(
        `❌ [Socket.IO] Error joining conversation ${conversationId}:`,
        err.message
      );
      const errorPayload = createSocketError(
        'Internal server error while joining room',
        'SERVER_ERROR'
      );
      socket.emit('socket:error', errorPayload);
      if (typeof callback === 'function') callback(errorPayload);
    }
  };

  /**
   * Helper: Leave conversation room cleanly.
   */
  const handleLeave = (payload, callback) => {
    const conversationId =
      typeof payload === 'object' && payload !== null
        ? payload.conversationId || payload.chatId || payload.id
        : payload;

    if (conversationId) {
      socket.leave(conversationId.toString());
      console.log(
        `🚪 [Socket.IO] User ${socket.userId} left conversation room: ${conversationId}`
      );
    }

    const response = createSocketSuccess(
      { conversationId: conversationId ? conversationId.toString() : null },
      'Successfully left conversation room'
    );

    socket.emit('conversation:left', response);
    if (typeof callback === 'function') callback(response);
  };

  // -------------------------------------------------------------
  // Bind Events & Interoperability Aliases
  // -------------------------------------------------------------

  // Canonical Phase 7 event: 'conversation:join'
  socket.on('conversation:join', handleJoin);

  // Frontend compatibility aliases: 'join_conversation', 'join_chat'
  socket.on('join_conversation', handleJoin);
  socket.on('join_chat', handleJoin);

  // Canonical Phase 7 event: 'conversation:leave'
  socket.on('conversation:leave', handleLeave);

  // Frontend compatibility alias: 'leave_conversation'
  socket.on('leave_conversation', handleLeave);
};

export default registerConversationHandlers;
