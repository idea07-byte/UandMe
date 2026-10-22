/**
 * PresenceManager
 * In-memory presence and multi-socket connection tracker for PulseChat.
 *
 * Capabilities:
 * - Tracks multiple concurrent active sockets per user (e.g. multiple tabs, desktop + mobile).
 * - Distinguishes between initial connection (user comes online) and additional connections.
 * - Distinguishes between closing a single tab vs. closing the user's final connection (user goes offline).
 * - Thread-safe within a single Node.js event loop instance.
 * - Prevents client-side spoofing by deriving presence strictly from authenticated socket sessions.
 */
class PresenceManager {
  constructor() {
    // Map<userId (string), Set<socketId (string)>>
    this.userSockets = new Map();

    // Map<socketId (string), userId (string)>
    this.socketToUser = new Map();
  }

  /**
   * Register a new socket connection for an authenticated user.
   *
   * @param {string} userId - Authenticated user's ObjectId string
   * @param {string} socketId - Unique socket identifier
   * @returns {{ isFirstConnection: boolean, socketCount: number }}
   */
  addConnection(userId, socketId) {
    if (!userId || !socketId) {
      return { isFirstConnection: false, socketCount: 0 };
    }

    const userIdStr = userId.toString();
    const socketIdStr = socketId.toString();

    if (!this.userSockets.has(userIdStr)) {
      this.userSockets.set(userIdStr, new Set());
    }

    const sockets = this.userSockets.get(userIdStr);
    const isFirstConnection = sockets.size === 0;

    sockets.add(socketIdStr);
    this.socketToUser.set(socketIdStr, userIdStr);

    return {
      isFirstConnection,
      socketCount: sockets.size,
    };
  }

  /**
   * Remove a socket connection on disconnect.
   *
   * @param {string} socketId - Unique socket identifier
   * @returns {{ userId: string, isLastConnection: boolean, remainingSockets: number } | null}
   */
  removeConnection(socketId) {
    if (!socketId) return null;

    const socketIdStr = socketId.toString();
    const userIdStr = this.socketToUser.get(socketIdStr);

    if (!userIdStr) {
      return null;
    }

    this.socketToUser.delete(socketIdStr);

    const sockets = this.userSockets.get(userIdStr);
    if (!sockets) {
      return { userId: userIdStr, isLastConnection: true, remainingSockets: 0 };
    }

    sockets.delete(socketIdStr);
    const isLastConnection = sockets.size === 0;

    if (isLastConnection) {
      this.userSockets.delete(userIdStr);
    }

    return {
      userId: userIdStr,
      isLastConnection,
      remainingSockets: isLastConnection ? 0 : sockets.size,
    };
  }

  /**
   * Check if a specific user currently has at least one active socket connection.
   *
   * @param {string} userId
   * @returns {boolean}
   */
  isUserOnline(userId) {
    if (!userId) return false;
    const sockets = this.userSockets.get(userId.toString());
    return Boolean(sockets && sockets.size > 0);
  }

  /**
   * Get the number of active sockets for a given user.
   *
   * @param {string} userId
   * @returns {number}
   */
  getUserSocketCount(userId) {
    if (!userId) return 0;
    return this.userSockets.get(userId.toString())?.size || 0;
  }

  /**
   * Retrieve all user IDs that are currently online.
   *
   * @returns {string[]}
   */
  getOnlineUserIds() {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get all active socket IDs for a user (useful for directed multicasting).
   *
   * @param {string} userId
   * @returns {string[]}
   */
  getUserSocketIds(userId) {
    if (!userId) return [];
    const sockets = this.userSockets.get(userId.toString());
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Reset internal maps (primarily for test suite isolation).
   */
  clear() {
    this.userSockets.clear();
    this.socketToUser.clear();
  }
}

export const presenceManager = new PresenceManager();
export default presenceManager;
