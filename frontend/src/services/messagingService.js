import socketService from './socket';
import { MESSAGE_STATUS } from '../utils/constants';
import chatService, { normalizeMessage } from './chatService';
import authService from './authService';

/**
 * Enterprise Centralized Messaging Service.
 * - Handles networking for real-time messaging, room subscriptions, and typing states.
 * - Connects directly to Node.js/Express/MongoDB REST API and Socket.IO events.
 * - Manages optimistic updates and server confirmation reconciliation.
 * - Dispatches 'message_received', 'typing', 'stop_typing' cleanly without listener leaks.
 */
class MessagingService {
  constructor() {
    this.activeConversationId = null;
    this.typingDebounceTimers = new Map();
    this.mockTimers = new Set();

    // Event listener registries
    this.messageListeners = new Set();
    this.statusListeners = new Set();
    this.typingListeners = new Set();
    this.stopTypingListeners = new Set();
    this.errorListeners = new Set();

    this.cleanupSocketBindings = null;
    this.initSocketBindings();
  }

  /**
   * Bind event handlers to underlying socketService.
   */
  initSocketBindings() {
    if (this.cleanupSocketBindings) {
      this.cleanupSocketBindings();
      this.cleanupSocketBindings = null;
    }

    const cleanups = [];

    // 1. connect / connected
    cleanups.push(
      socketService.on('connect', () => {
        console.log('[MessagingService] Socket connected to gateway.');
        const user = authService.getCurrentUser();
        if (user?._id || user?.id) {
          socketService.emit('setup', { _id: user._id || user.id });
        }
        if (this.activeConversationId) {
          socketService.emit('join_chat', this.activeConversationId);
        }
      })
    );

    // 2. disconnect
    cleanups.push(
      socketService.on('disconnect', (reason) => {
        console.log('[MessagingService] Socket disconnected:', reason);
        this._notifyAllTypingStopped();
      })
    );

    // 3. message_received (Backend event from Socket.IO)
    cleanups.push(
      socketService.on('message_received', (rawMessage) => {
        this._handleReceiveMessage(rawMessage);
      })
    );

    // Also support receive_message for compatibility
    cleanups.push(
      socketService.on('receive_message', (rawMessage) => {
        this._handleReceiveMessage(rawMessage);
      })
    );

    // 4. typing
    cleanups.push(
      socketService.on('typing', (room) => {
        this._handleTyping({
          conversationId: room || this.activeConversationId,
          userName: 'Contact',
        });
      })
    );

    // 5. stop_typing
    cleanups.push(
      socketService.on('stop_typing', (room) => {
        this._handleStopTyping({
          conversationId: room || this.activeConversationId,
        });
      })
    );

    // 6. message_status_updated
    cleanups.push(
      socketService.on('message_status_updated', (payload) => {
        this._handleMessageStatusUpdated(payload);
      })
    );

    this.cleanupSocketBindings = () => {
      cleanups.forEach((unsub) => unsub());
    };
  }

  /**
   * Join a conversation room.
   * @param {string} conversationId
   */
  joinConversation(conversationId) {
    if (!conversationId) return;

    if (this.activeConversationId && this.activeConversationId !== conversationId) {
      this.leaveConversation(this.activeConversationId);
    }

    this.activeConversationId = conversationId;

    if (socketService.isConnected()) {
      socketService.emit('join_chat', conversationId);
      console.log(`[MessagingService] Joined chat room: ${conversationId}`);
    }
  }

  /**
   * Leave a conversation room cleanly.
   * @param {string} conversationId
   */
  leaveConversation(conversationId) {
    const idToLeave = conversationId || this.activeConversationId;
    if (!idToLeave) return;

    this.stopTyping(idToLeave);
    this._clearMockTimers();

    if (this.activeConversationId === idToLeave) {
      this.activeConversationId = null;
    }
  }

  /**
   * Send a message with optimistic UI and authoritative server confirmation.
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.text
   * @param {Array} [params.attachments]
   * @param {Object} [params.sender]
   * @param {string} [params.clientMessageId]
   * @returns {Object} Optimistic message representation
   */
  sendMessage({ conversationId, text, attachments = [], sender = {}, clientMessageId }) {
    if (!conversationId) {
      throw new Error('conversationId is required to send a message');
    }

    const currentUser = authService.getCurrentUser();
    const effectiveClientId =
      clientMessageId || `msg_client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const optimisticMessage = {
      id: effectiveClientId,
      clientMessageId: effectiveClientId,
      conversationId,
      senderId: sender.id || currentUser?.id || currentUser?._id || 'usr_me_1',
      senderName: sender.name || currentUser?.name || 'You',
      text: (text || '').trim(),
      attachments: attachments || [],
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENDING,
      isOptimistic: true,
    };

    // Auto-stop typing on send
    this.stopTyping(conversationId);

    // Send through real backend REST API and broadcast via Socket.IO
    this._dispatchMessage(optimisticMessage);

    return optimisticMessage;
  }

  /**
   * Retry sending a previously failed message.
   * @param {Object} failedMessage
   * @returns {Object}
   */
  retryMessage(failedMessage) {
    if (!failedMessage || !failedMessage.conversationId) return null;

    this._notifyStatusUpdated({
      clientMessageId: failedMessage.clientMessageId || failedMessage.id,
      conversationId: failedMessage.conversationId,
      status: MESSAGE_STATUS.SENDING,
    });

    return this.sendMessage({
      conversationId: failedMessage.conversationId,
      text: failedMessage.text,
      attachments: failedMessage.attachments,
      sender: { id: failedMessage.senderId, name: failedMessage.senderName },
      clientMessageId: failedMessage.clientMessageId || failedMessage.id,
    });
  }

  /**
   * Post message via REST and broadcast via Socket.IO.
   * @private
   */
  async _dispatchMessage(optimisticMessage) {
    try {
      // 1. Post to Express REST API /api/messages
      const serverMessage = await chatService.sendMessage({
        conversationId: optimisticMessage.conversationId,
        text: optimisticMessage.text,
        attachments: optimisticMessage.attachments,
      });

      // 2. Reconcile optimistic message with canonical MongoDB _id and timestamp
      this._notifyStatusUpdated({
        clientMessageId: optimisticMessage.clientMessageId,
        messageId: serverMessage.id || serverMessage._id,
        conversationId: optimisticMessage.conversationId,
        status: MESSAGE_STATUS.SENT,
        serverMessage: {
          ...serverMessage,
          status: MESSAGE_STATUS.SENT,
          isOptimistic: false,
        },
      });

      // 3. Broadcast to peers in room through Socket.IO
      if (socketService.isConnected()) {
        const rawServerPayload = {
          _id: serverMessage.id || serverMessage._id,
          content: serverMessage.text || optimisticMessage.text,
          sender: {
            _id: optimisticMessage.senderId,
            username: optimisticMessage.senderName,
          },
          chat: {
            _id: optimisticMessage.conversationId,
            participants: [
              { _id: optimisticMessage.senderId },
              // Partner will be recognized on the server
            ],
          },
          status: 'sent',
          createdAt: serverMessage.timestamp || new Date().toISOString(),
        };

        socketService.emit('new_message', rawServerPayload);
      }
    } catch (err) {
      console.warn('[MessagingService] Message send error:', err.message);

      // If mock fallback is enabled and server is offline, simulate sandbox delivery
      if (socketService.isMockMode()) {
        this._sendViaMockSandbox(optimisticMessage);
      } else {
        // Reconcile status to 'failed' with retry support
        this._notifyStatusUpdated({
          clientMessageId: optimisticMessage.clientMessageId,
          conversationId: optimisticMessage.conversationId,
          status: MESSAGE_STATUS.FAILED,
          error: err.message,
        });
      }
    }
  }

  /**
   * Simulated mock mode delivery when backend server is completely offline.
   * @private
   */
  _sendViaMockSandbox(optimisticMessage) {
    const ackTimer = setTimeout(() => {
      this._notifyStatusUpdated({
        clientMessageId: optimisticMessage.clientMessageId,
        messageId: optimisticMessage.clientMessageId,
        conversationId: optimisticMessage.conversationId,
        status: MESSAGE_STATUS.SENT,
        serverMessage: {
          ...optimisticMessage,
          status: MESSAGE_STATUS.SENT,
          isOptimistic: false,
        },
      });
    }, 250);
    this.mockTimers.add(ackTimer);

    const deliveredTimer = setTimeout(() => {
      this._notifyStatusUpdated({
        clientMessageId: optimisticMessage.clientMessageId,
        conversationId: optimisticMessage.conversationId,
        status: MESSAGE_STATUS.DELIVERED,
      });
    }, 800);
    this.mockTimers.add(deliveredTimer);
  }

  /**
   * Emit typing indicator.
   * @param {string} conversationId
   */
  startTyping(conversationId) {
    const targetRoom = conversationId || this.activeConversationId;
    if (!targetRoom) return;

    if (this.typingDebounceTimers.has(targetRoom)) {
      clearTimeout(this.typingDebounceTimers.get(targetRoom));
    }

    if (socketService.isConnected()) {
      socketService.emit('typing', targetRoom);
    }

    const timer = setTimeout(() => {
      this.stopTyping(targetRoom);
    }, 2000);

    this.typingDebounceTimers.set(targetRoom, timer);
  }

  /**
   * Emit stop typing indicator.
   * @param {string} conversationId
   */
  stopTyping(conversationId) {
    const targetRoom = conversationId || this.activeConversationId;
    if (!targetRoom) return;

    if (this.typingDebounceTimers.has(targetRoom)) {
      clearTimeout(this.typingDebounceTimers.get(targetRoom));
      this.typingDebounceTimers.delete(targetRoom);
    }

    if (socketService.isConnected()) {
      socketService.emit('stop_typing', targetRoom);
    }
  }

  /**
   * Mark conversation as read locally.
   */
  markConversationAsRead(conversationId) {
    if (!conversationId) return;
    chatService.markAsRead(conversationId);
  }

  // ==========================================
  // Inbound Socket Event Dispatchers
  // ==========================================

  _handleReceiveMessage(payload) {
    if (!payload) return;

    // Normalize incoming payload from backend Socket.IO
    const normalized = normalizeMessage(payload);
    if (!normalized || !normalized.conversationId) return;

    this.messageListeners.forEach((fn) => {
      try {
        fn(normalized);
      } catch (e) {
        console.error('[MessagingService] Error in receive_message subscriber:', e);
      }
    });
  }

  _handleTyping(payload) {
    if (!payload || !payload.conversationId) return;
    this._notifyTyping(payload);
  }

  _handleStopTyping(payload) {
    if (!payload || !payload.conversationId) return;
    this._notifyStopTyping(payload);
  }

  _handleMessageStatusUpdated(payload) {
    if (!payload) return;
    this._notifyStatusUpdated(payload);
  }

  _notifyTyping(payload) {
    this.typingListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('[MessagingService] Error in typing subscriber:', e);
      }
    });
  }

  _notifyStopTyping(payload) {
    this.stopTypingListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('[MessagingService] Error in stop_typing subscriber:', e);
      }
    });
  }

  _notifyStatusUpdated(payload) {
    this.statusListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('[MessagingService] Error in status subscriber:', e);
      }
    });
  }

  _notifyError(err) {
    this.errorListeners.forEach((fn) => {
      try {
        fn(err);
      } catch (e) {
        console.error('[MessagingService] Error in error subscriber:', e);
      }
    });
  }

  _notifyAllTypingStopped() {
    if (this.activeConversationId) {
      this._notifyStopTyping({ conversationId: this.activeConversationId });
    }
  }

  _clearMockTimers() {
    this.mockTimers.forEach((timer) => clearTimeout(timer));
    this.mockTimers.clear();
  }

  // ==========================================
  // Public Event Subscription API (Leak-Free)
  // ==========================================

  onReceiveMessage(callback) {
    if (typeof callback !== 'function') return () => {};
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  onMessageStatusUpdated(callback) {
    if (typeof callback !== 'function') return () => {};
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  onTyping(callback) {
    if (typeof callback !== 'function') return () => {};
    this.typingListeners.add(callback);
    return () => {
      this.typingListeners.delete(callback);
    };
  }

  onStopTyping(callback) {
    if (typeof callback !== 'function') return () => {};
    this.stopTypingListeners.add(callback);
    return () => {
      this.stopTypingListeners.delete(callback);
    };
  }

  onError(callback) {
    if (typeof callback !== 'function') return () => {};
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  destroy() {
    if (this.cleanupSocketBindings) {
      this.cleanupSocketBindings();
      this.cleanupSocketBindings = null;
    }
    this._clearMockTimers();
    this.typingDebounceTimers.forEach((timer) => clearTimeout(timer));
    this.typingDebounceTimers.clear();
    this.messageListeners.clear();
    this.statusListeners.clear();
    this.typingListeners.clear();
    this.stopTypingListeners.clear();
    this.errorListeners.clear();
  }
}

export const messagingService = new MessagingService();
export default messagingService;
