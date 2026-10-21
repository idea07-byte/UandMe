import { io } from 'socket.io-client';
import {
  SOCKET_URL,
  SOCKET_RECONNECT_ATTEMPTS,
  SOCKET_RECONNECT_DELAY,
  ENABLE_MOCK_FALLBACK,
  SOCKET_STATUS,
} from '../utils/constants';
import authService from './authService';

/**
 * Enterprise-grade, reusable Socket.IO Client Module.
 * - Centralizes connection lifecycle and authentication handshake.
 * - Interacts with Node.js/Express/Socket.IO backend server.
 * - Automatically registers user via 'setup' event.
 * - Prevents multiple socket instances across React renders.
 * - Prevents duplicate listener registration and ensures leak-free teardowns.
 * - Tracks connection status: connected, connecting, reconnecting, disconnected, mock_mode.
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.status = SOCKET_STATUS.DISCONNECTED;
    this.activeToken = null;
    this.statusListeners = new Set();
    this.eventListeners = new Map(); // event -> Set of callbacks
    this.reconnectCount = 0;
    this.mockFallbackTimer = null;
  }

  /**
   * Subscribe to connection status transitions.
   * @param {Function} callback - (status: string) => void
   * @returns {Function} Unsubscribe function
   */
  onStatusChange(callback) {
    if (typeof callback !== 'function') return () => {};
    this.statusListeners.add(callback);
    try {
      callback(this.status);
    } catch (e) {
      console.error('[SocketService] Status callback error:', e);
    }
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Notify all registered status listeners of a transition.
   * @private
   */
  _setStatus(nextStatus) {
    if (this.status === nextStatus) return;
    this.status = nextStatus;
    this.statusListeners.forEach((fn) => {
      try {
        fn(nextStatus);
      } catch (err) {
        console.error('[SocketService] Error in status subscriber:', err);
      }
    });
  }

  /**
   * Get the current connection status.
   * @returns {string}
   */
  getStatus() {
    return this.status;
  }

  /**
   * Check if socket is currently live and connected to backend server.
   * @returns {boolean}
   */
  isConnected() {
    return this.status === SOCKET_STATUS.CONNECTED && Boolean(this.socket?.connected);
  }

  /**
   * Check if running in mock sandbox fallback mode.
   * @returns {boolean}
   */
  isMockMode() {
    return this.status === SOCKET_STATUS.MOCK_MODE;
  }

  /**
   * Initialize and connect Socket.IO connection.
   * Reuses existing socket if already connected with same credentials.
   * @param {string} [tokenOverride] - Optional JWT token override
   * @returns {Object|null} Socket instance
   */
  connect(tokenOverride) {
    const token = tokenOverride || authService.getToken();

    if (this.socket && this.socket.connected && this.activeToken === token) {
      return this.socket;
    }

    if (this.socket && this.status === SOCKET_STATUS.CONNECTING && this.activeToken === token) {
      return this.socket;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.activeToken = token;
    this.reconnectCount = 0;
    this._setStatus(SOCKET_STATUS.CONNECTING);

    if (this.mockFallbackTimer) {
      clearTimeout(this.mockFallbackTimer);
      this.mockFallbackTimer = null;
    }

    try {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        auth: { token: token ? `Bearer ${token}` : undefined },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: SOCKET_RECONNECT_ATTEMPTS,
        reconnectionDelay: SOCKET_RECONNECT_DELAY,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      // Bind core transport lifecycle listeners
      this.socket.on('connect', () => {
        this.reconnectCount = 0;
        this._setStatus(SOCKET_STATUS.CONNECTED);
        console.log(`[SocketService] Connected to backend gateway [id=${this.socket.id}]`);

        // Send setup event with authenticated user info to join user personal room
        const user = authService.getCurrentUser();
        if (user?._id || user?.id) {
          this.socket.emit('setup', { _id: user._id || user.id });
        }
      });

      this.socket.on('connected', () => {
        console.log('[SocketService] Setup verified by backend server room.');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Disconnected:', reason);
        if (this.status !== SOCKET_STATUS.MOCK_MODE) {
          this._setStatus(SOCKET_STATUS.DISCONNECTED);
        }
      });

      this.socket.io.on('reconnect_attempt', (attempt) => {
        this.reconnectCount = attempt;
        this._setStatus(SOCKET_STATUS.RECONNECTING);
        console.log(`[SocketService] Reconnecting attempt #${attempt}/${SOCKET_RECONNECT_ATTEMPTS}...`);
      });

      this.socket.io.on('reconnect', () => {
        this.reconnectCount = 0;
        this._setStatus(SOCKET_STATUS.CONNECTED);
        const user = authService.getCurrentUser();
        if (user?._id || user?.id) {
          this.socket.emit('setup', { _id: user._id || user.id });
        }
        console.log('[SocketService] Reconnection succeeded.');
      });

      this.socket.io.on('reconnect_failed', () => {
        console.warn('[SocketService] Reconnection attempts exhausted.');
        this._handleConnectionFailure('Max reconnect attempts reached');
      });

      this.socket.on('connect_error', (error) => {
        console.warn(`[SocketService] Gateway unreachable at ${SOCKET_URL}:`, error.message);

        if (ENABLE_MOCK_FALLBACK && !this.mockFallbackTimer) {
          this.mockFallbackTimer = setTimeout(() => {
            if (!this.isConnected()) {
              this._handleConnectionFailure('Backend unavailable, activating fallback sandbox');
            }
          }, 3000);
        } else if (!ENABLE_MOCK_FALLBACK) {
          this._setStatus(SOCKET_STATUS.DISCONNECTED);
        }
      });

      // Re-bind application listeners
      this.eventListeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => {
          this.socket.on(event, cb);
        });
      });

      return this.socket;
    } catch (err) {
      console.error('[SocketService] Initialization error:', err);
      this._handleConnectionFailure(err.message);
      return null;
    }
  }

  /**
   * Handle connection failure.
   * @private
   */
  _handleConnectionFailure(reason) {
    if (this.mockFallbackTimer) {
      clearTimeout(this.mockFallbackTimer);
      this.mockFallbackTimer = null;
    }

    if (ENABLE_MOCK_FALLBACK) {
      console.info(`[SocketService] ${reason}. Activated Dev Mock Sandbox mode.`);
      this._setStatus(SOCKET_STATUS.MOCK_MODE);
    } else {
      this._setStatus(SOCKET_STATUS.DISCONNECTED);
    }
  }

  /**
   * Disconnect cleanly.
   */
  disconnect() {
    if (this.mockFallbackTimer) {
      clearTimeout(this.mockFallbackTimer);
      this.mockFallbackTimer = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.activeToken = null;
    this.reconnectCount = 0;
    this._setStatus(SOCKET_STATUS.DISCONNECTED);
    console.log('[SocketService] Socket cleanly closed.');
  }

  /**
   * Manually retry connection.
   */
  reconnect() {
    this.disconnect();
    return this.connect();
  }

  /**
   * Subscribe to a socket event cleanly.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!event || typeof callback !== 'function') return () => {};

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const set = this.eventListeners.get(event);
    if (!set.has(callback)) {
      set.add(callback);
      if (this.socket) {
        this.socket.on(event, callback);
      }
    }

    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from a socket event.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!event || typeof callback !== 'function') return;

    const set = this.eventListeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.eventListeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emit an event to the backend server.
   * @param {string} event
   * @param {any} data
   */
  emit(event, data) {
    if (this.isConnected()) {
      this.socket.emit(event, data);
    } else {
      console.debug(`[SocketService] Emit buffered or ignored for "${event}" (status: ${this.status})`);
    }
  }

  /**
   * Emit with ack or timeout.
   */
  emitWithAck(event, data, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        return reject(new Error(`Cannot emit "${event}": socket not connected`));
      }

      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        reject(new Error(`Timeout on "${event}"`));
      }, timeoutMs);

      try {
        this.socket.emit(event, data, (response) => {
          if (timedOut) return;
          clearTimeout(timer);
          resolve(response);
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }
}

export const socketService = new SocketService();
export default socketService;
