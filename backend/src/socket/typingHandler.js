import Conversation from '../models/Conversation.js';
import { isValidObjectId } from '../utils/validators.js';
import { createSocketError } from './conversationHandler.js';

/**
 * Register Typing Indicator Handlers.
 *
 * Implements ephemeral real-time typing indicators for PulseChat:
 * - 'typing:start' (aliased to 'typing')
 * - 'typing:stop'  (aliased to 'stop_typing')
 *
 * Design & Security Guarantees:
 * 1. Broadcast only to authorized room participants: The handler verifies in MongoDB that
 *    the requesting user is a legitimate member of the conversation room before broadcasting.
 * 2. Zero database writes: Typing indicators are strictly transient and stream through
 *    in-memory socket room broadcasting (socket.to(room).emit), avoiding costly disk I/O.
 * 3. Client timeout behavior: Documented 3000ms safety timeout on clients prevents sticky
 *    indicators if a user disconnects abruptly or encounters network drops.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export const registerTypingHandlers = (io, socket) => {
  /**
   * Helper to validate payload and conversation membership for typing events.
   *
   * @param {any} payload
   * @returns {Promise<{ isValid: boolean, conversationId?: string, error?: Object }>}
   */
  const validateTypingRequest = async (payload) => {
    // 1. Extract conversation ID from payload object or primitive string
    const conversationId =
      typeof payload === 'object' && payload !== null
        ? payload.conversationId || payload.chatId || payload.id
        : payload;

    // 2. Validate ObjectId format
    if (!conversationId || !isValidObjectId(conversationId)) {
      return {
        isValid: false,
        error: createSocketError(
          'Invalid conversation ID format: Must be a valid 24-character hexadecimal ObjectId',
          'INVALID_CONVERSATION_ID'
        ),
      };
    }

    // 3. Verify conversation exists and user is an authorized participant
    const conversation = await Conversation.findById(conversationId).select('participants');
    if (!conversation) {
      return {
        isValid: false,
        error: createSocketError(
          'Conversation room not found',
          'CONVERSATION_NOT_FOUND',
          { conversationId }
        ),
      };
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === socket.userId
    );

    if (!isMember) {
      return {
        isValid: false,
        error: createSocketError(
          'Access forbidden: You cannot broadcast typing indicators to a conversation you are not a member of',
          'FORBIDDEN_TYPING_ACCESS',
          { conversationId }
        ),
      };
    }

    return {
      isValid: true,
      conversationId: conversationId.toString(),
    };
  };

  /**
   * Handler for typing:start
   */
  const handleTypingStart = async (payload, callback) => {
    try {
      const validation = await validateTypingRequest(payload);
      if (!validation.isValid) {
        socket.emit('socket:error', validation.error);
        if (typeof callback === 'function') callback(validation.error);
        return;
      }

      const { conversationId } = validation;

      const eventPayload = {
        conversationId,
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date().toISOString(),
      };

      // Broadcast exclusively to OTHER members in the room (excludes the sender)
      socket.to(conversationId).emit('typing:start', eventPayload);

      // Also emit compatibility alias 'typing' for frontend consumption
      socket.to(conversationId).emit('typing', {
        conversationId,
        userId: socket.userId,
        userName: socket.user.name,
      });

      if (typeof callback === 'function') {
        callback({ status: 'ok', conversationId });
      }
    } catch (err) {
      console.error(`❌ [Socket.IO] Error in typing:start:`, err.message);
      const errPayload = createSocketError('Failed to process typing indicator', 'SERVER_ERROR');
      socket.emit('socket:error', errPayload);
      if (typeof callback === 'function') callback(errPayload);
    }
  };

  /**
   * Handler for typing:stop
   */
  const handleTypingStop = async (payload, callback) => {
    try {
      const validation = await validateTypingRequest(payload);
      if (!validation.isValid) {
        socket.emit('socket:error', validation.error);
        if (typeof callback === 'function') callback(validation.error);
        return;
      }

      const { conversationId } = validation;

      const eventPayload = {
        conversationId,
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      };

      // Broadcast stop event exclusively to other members in the room
      socket.to(conversationId).emit('typing:stop', eventPayload);

      // Also emit compatibility alias 'stop_typing'
      socket.to(conversationId).emit('stop_typing', {
        conversationId,
        userId: socket.userId,
      });

      if (typeof callback === 'function') {
        callback({ status: 'ok', conversationId });
      }
    } catch (err) {
      console.error(`❌ [Socket.IO] Error in typing:stop:`, err.message);
      const errPayload = createSocketError('Failed to process typing indicator', 'SERVER_ERROR');
      socket.emit('socket:error', errPayload);
      if (typeof callback === 'function') callback(errPayload);
    }
  };

  // -------------------------------------------------------------
  // Event Bindings & Aliases
  // -------------------------------------------------------------
  socket.on('typing:start', handleTypingStart);
  socket.on('typing', handleTypingStart);

  socket.on('typing:stop', handleTypingStop);
  socket.on('stop_typing', handleTypingStop);
};

export default registerTypingHandlers;
