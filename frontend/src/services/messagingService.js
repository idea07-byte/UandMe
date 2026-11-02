import socketService from './socket';
import { MESSAGE_STATUS } from '../utils/constants';
import chatService, { normalizeMessage } from './chatService';
import authService from './authService';
import notificationService from './notificationService';

const OFFLINE_QUEUE_KEY = 'uandi_offline_queue';

/**
 * Enterprise Centralized Messaging Service.
 * - Handles networking for real-time messaging, room subscriptions, and typing states.
 * - Connects directly to REST API and Socket.IO events.
 * - Manages optimistic updates, delivery receipts (2 ticks), read receipts (blue ticks).
 * - Emoji reactions, message edits, deletions, and offline queuing.
 * - Dispatches notifications via notificationService.
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
    this.reactionListeners = new Set();
    this.deleteListeners = new Set();
    this.updateListeners = new Set();
    this.errorListeners = new Set();

    this.cleanupSocketBindings = null;
    this.initSocketBindings();

    // Window online listener to flush offline message queue
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[MessagingService] Connection restored. Flushing offline queue...');
        this.flushOfflineQueue();
      });
    }
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
          socketService.emit('conversation:join', this.activeConversationId);
        }
        this.flushOfflineQueue();
      })
    );

    // 2. disconnect
    cleanups.push(
      socketService.on('disconnect', (reason) => {
        console.log('[MessagingService] Socket disconnected:', reason);
        this._notifyAllTypingStopped();
      })
    );

    // 3. Inbound Messages
    const handleInbound = (rawMessage) => {
      this._handleReceiveMessage(rawMessage);
    };

    cleanups.push(socketService.on('message:received', handleInbound));
    cleanups.push(socketService.on('message_received', handleInbound));
    cleanups.push(socketService.on('receive_message', handleInbound));

    // 4. Delivery Receipts (2 grey ticks)
    const handleDelivery = (payload) => {
      this._notifyStatusUpdated({
        messageId: payload.messageId || payload.id,
        conversationId: payload.conversationId,
        status: MESSAGE_STATUS.DELIVERED,
      });
    };
    cleanups.push(socketService.on('message:delivered', handleDelivery));

    // 5. Read Receipts (2 blue ticks)
    const handleRead = (payload) => {
      this._notifyStatusUpdated({
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        status: MESSAGE_STATUS.READ,
      });
    };
    cleanups.push(socketService.on('message:read', handleRead));
    cleanups.push(socketService.on('message_status_updated', (p) => {
      if (p.status) {
        this._notifyStatusUpdated(p);
      }
    }));

    // 6. Reactions
    const handleReaction = (payload) => {
      this.reactionListeners.forEach((fn) => {
        try {
          fn(payload);
        } catch {}
      });
    };
    cleanups.push(socketService.on('message:reacted', handleReaction));
    cleanups.push(socketService.on('reaction_updated', handleReaction));

    // 7. Message Edits
    const handleEdit = (payload) => {
      this.updateListeners.forEach((fn) => {
        try {
          fn(payload);
        } catch {}
      });
    };
    cleanups.push(socketService.on('message:updated', handleEdit));

    // 8. Message Deletes
    const handleDelete = (payload) => {
      this.deleteListeners.forEach((fn) => {
        try {
          fn(payload);
        } catch {}
      });
    };
    cleanups.push(socketService.on('message:deleted', handleDelete));

    // 9. Typing Indicators
    cleanups.push(
      socketService.on('typing', (room) => {
        this._handleTyping({
          conversationId: room || this.activeConversationId,
          userName: 'Contact',
        });
      })
    );

    cleanups.push(
      socketService.on('stop_typing', (room) => {
        this._handleStopTyping({
          conversationId: room || this.activeConversationId,
        });
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
    notificationService.setActiveConversation(conversationId);

    if (socketService.isConnected()) {
      socketService.emit('join_chat', conversationId);
      socketService.emit('conversation:join', conversationId);
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
      notificationService.setActiveConversation(null);
    }

    if (socketService.isConnected()) {
      socketService.emit('leave_conversation', idToLeave);
      socketService.emit('conversation:leave', idToLeave);
    }
  }

  /**
   * Send a message with optimistic UI, delivery confirmation, and offline queuing.
   * @param {Object} params
   * @returns {Object} Optimistic message representation
   */
  sendMessage({ conversationId, text, attachments = [], sender = {}, clientMessageId, replyTo = null }) {
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
      replyTo: replyTo || null,
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENDING,
      isOptimistic: true,
    };

    // Auto-stop typing on send
    this.stopTyping(conversationId);

    // If offline, store in offline queue
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this._enqueueOffline(optimisticMessage);
      return optimisticMessage;
    }

    // Send through real backend REST API and broadcast via Socket.IO
    this._dispatchMessage(optimisticMessage);

    return optimisticMessage;
  }

  /**
   * Add message to offline queue in localStorage
   * @private
   */
  _enqueueOffline(optimisticMessage) {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(optimisticMessage);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log('[MessagingService] Message stored in offline queue:', optimisticMessage.clientMessageId);
    } catch {}
  }

  /**
   * Flush offline queue when connection is restored
   */
  async flushOfflineQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;
      localStorage.removeItem(OFFLINE_QUEUE_KEY);

      console.log(`[MessagingService] Flushing ${queue.length} offline queued messages...`);
      for (const msg of queue) {
        await this._dispatchMessage(msg);
      }
    } catch (e) {
      console.warn('[MessagingService] Failed to flush offline queue:', e);
    }
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
      replyTo: failedMessage.replyTo,
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

      // 2. Reconcile optimistic message with canonical ID and 1 tick ('sent')
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
          id: serverMessage.id || serverMessage._id,
          conversationId: optimisticMessage.conversationId,
          content: serverMessage.text || optimisticMessage.text,
          text: serverMessage.text || optimisticMessage.text,
          attachments: optimisticMessage.attachments,
          replyTo: optimisticMessage.replyTo,
          sender: {
            _id: optimisticMessage.senderId,
            id: optimisticMessage.senderId,
            username: optimisticMessage.senderName,
            name: optimisticMessage.senderName,
          },
          status: 'sent',
          createdAt: serverMessage.timestamp || new Date().toISOString(),
        };

        socketService.emit('send_message', rawServerPayload);
        socketService.emit('message:send', rawServerPayload);
      }
    } catch (err) {
      console.warn('[MessagingService] Message send error:', err.message);

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this._enqueueOffline(optimisticMessage);
        return;
      }

      if (socketService.isMockMode()) {
        this._sendViaMockSandbox(optimisticMessage);
      } else {
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
   * Send emoji reaction to a message
   * @param {string} messageId
   * @param {string} conversationId
   * @param {string} emoji
   */
  reactToMessage(messageId, conversationId, emoji) {
    if (!messageId || !emoji) return;

    const currentUser = authService.getCurrentUser();
    const payload = {
      messageId,
      conversationId,
      emoji,
      userId: currentUser?.id || currentUser?._id,
      userName: currentUser?.name || 'You',
    };

    if (socketService.isConnected()) {
      socketService.emit('message:react', payload);
      socketService.emit('react_message', payload);
    }

    // Local notification
    this.reactionListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch {}
    });
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
    }, 2500);

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
   * Mark conversation as read.
   * @param {string} conversationId
   */
  markConversationAsRead(conversationId) {
    if (!conversationId) return;

    chatService.markAsRead(conversationId);

    if (socketService.isConnected()) {
      socketService.emit('message:read', { conversationId });
      socketService.emit('mark_read', { conversationId });
    }
  }

  // ==========================================
  // Inbound Socket Event Dispatchers
  // ==========================================

  _handleReceiveMessage(payload) {
    if (!payload) return;

    const normalized = normalizeMessage(payload);
    if (!normalized || !normalized.conversationId) return;

    const currentUser = authService.getCurrentUser();
    const isFromSelf =
      normalized.senderId === currentUser?.id ||
      normalized.senderId === currentUser?._id;

    // 1. If received from another peer, acknowledge delivery (2 ticks)
    if (!isFromSelf && socketService.isConnected()) {
      socketService.emit('message:delivered', {
        messageId: normalized.id,
        conversationId: normalized.conversationId,
      });

      // If this conversation is currently open and document is visible, also mark as read
      if (
        this.activeConversationId === normalized.conversationId &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      ) {
        socketService.emit('message:read', {
          conversationId: normalized.conversationId,
          messageId: normalized.id,
        });
      }
    }

    // 2. Dispatch push notification / in-app banner
    notificationService.notifyIncomingMessage({
      message: normalized,
      currentUserId: currentUser?.id || currentUser?._id,
    });

    // 3. Dispatch to message subscribers
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
  // Public Event Subscription API
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

  onReactionUpdated(callback) {
    if (typeof callback !== 'function') return () => {};
    this.reactionListeners.add(callback);
    return () => {
      this.reactionListeners.delete(callback);
    };
  }

  onMessageUpdated(callback) {
    if (typeof callback !== 'function') return () => {};
    this.updateListeners.add(callback);
    return () => {
      this.updateListeners.delete(callback);
    };
  }

  onMessageDeleted(callback) {
    if (typeof callback !== 'function') return () => {};
    this.deleteListeners.add(callback);
    return () => {
      this.deleteListeners.delete(callback);
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
    this.reactionListeners.clear();
    this.updateListeners.clear();
    this.deleteListeners.clear();
    this.errorListeners.clear();
  }
}

export const messagingService = new MessagingService();
export default messagingService;
