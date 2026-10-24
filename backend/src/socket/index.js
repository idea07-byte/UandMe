import { Server } from 'socket.io';
import socketAuthMiddleware from './socketAuthMiddleware.js';
import registerConversationHandlers from './conversationHandler.js';
import registerTypingHandlers from './typingHandler.js';
import registerReadReceiptHandlers from './readReceiptHandler.js';
import registerMessageHandlers from './messageHandler.js';
import registerCallHandlers from './callHandler.js';
import presenceManager from './presenceManager.js';
import User from '../models/User.js';

let io = null;

/**
 * Initialize and attach Socket.IO server to the HTTP server instance.
 *
 * @param {import('http').Server} httpServer
 * @returns {Server} Initialized Socket.IO server instance
 */
export const initSocket = (httpServer) => {
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // 1. Mount Socket Authentication Middleware
  io.use(socketAuthMiddleware);

  // 2. Handle Connection Lifecycle
  io.on('connection', (socket) => {
    // Safe connection logging (user ID, name, socket ID; never logging tokens or credentials)
    console.log(
      `🔌 [Socket.IO] Client connected: socketId=${socket.id}, userId=${socket.userId}, name="${socket.user.name}"`
    );

    // Automatically join the user's personal private notification rooms
    socket.join(`user:${socket.userId}`);
    socket.join(socket.userId);

    // -------------------------------------------------------------
    // Multi-Socket Online Presence Tracking
    // -------------------------------------------------------------
    const { isFirstConnection, socketCount } = presenceManager.addConnection(
      socket.userId,
      socket.id
    );

    // Broadcast 'user:online' ONLY when this is the user's first active connection
    if (isFirstConnection) {
      User.findByIdAndUpdate(socket.userId, { status: 'online' }).catch((err) => {
        console.error(
          `❌ Failed to update status to online for user ${socket.userId}:`,
          err.message
        );
      });

      io.emit('user:online', {
        userId: socket.userId,
        status: 'online',
        timestamp: new Date().toISOString(),
      });
    }

    // Frontend compatibility handshake event ('setup')
    socket.on('setup', () => {
      socket.emit('connected');
    });

    // 3. Register Modular Handlers
    registerConversationHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerReadReceiptHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerCallHandlers(io, socket);

    // 4. Presence Query API (Safe retrieval of presence status)
    socket.on('user:presence:query', (payload, callback) => {
      const userIds = Array.isArray(payload?.userIds) ? payload.userIds : [];
      const presenceMap = {};
      userIds.forEach((uid) => {
        presenceMap[uid] = presenceManager.isUserOnline(uid) ? 'online' : 'offline';
      });
      if (typeof callback === 'function') {
        callback(presenceMap);
      } else {
        socket.emit('user:presence:result', presenceMap);
      }
    });

    // 5. Security Guard: Prevent clients from setting arbitrary users' online status
    const rejectArbitraryPresence = (eventName) => () => {
      socket.emit('socket:error', {
        status: 'error',
        message: 'Clients cannot arbitrarily set presence status. Presence is server-authoritative.',
        code: 'FORBIDDEN_PRESENCE_MUTATION',
      });
    };
    socket.on('user:online', rejectArbitraryPresence('user:online'));
    socket.on('user:offline', rejectArbitraryPresence('user:offline'));
    socket.on('user:set_status', rejectArbitraryPresence('user:set_status'));

    // 6. Safe Disconnection Handling
    socket.on('disconnect', (reason) => {
      console.log(
        `🔌 [Socket.IO] Client disconnected: socketId=${socket.id}, userId=${socket.userId}, reason="${reason}"`
      );

      const presenceInfo = presenceManager.removeConnection(socket.id);

      // Broadcast 'user:offline' and update lastSeen ONLY when user's final connection closes
      if (presenceInfo && presenceInfo.isLastConnection) {
        const disconnectTime = new Date();

        User.findByIdAndUpdate(presenceInfo.userId, {
          status: 'offline',
          lastSeen: disconnectTime,
        }).catch((err) => {
          console.error(
            `❌ Failed to update status to offline for user ${presenceInfo.userId}:`,
            err.message
          );
        });

        io.emit('user:offline', {
          userId: presenceInfo.userId,
          status: 'offline',
          lastSeen: disconnectTime.toISOString(),
        });
      }
    });
  });

  console.log(`⚡ Socket.IO initialized with CORS origin: ${allowedOrigin}`);
  return io;
};

/**
 * Get the active Socket.IO server instance.
 * Throws if initSocket hasn't been called.
 * @returns {Server}
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocket first.');
  }
  return io;
};

/**
 * Safe accessor for Socket.IO server instance.
 * Returns null instead of throwing if uninitialized.
 * @returns {Server|null}
 */
export const safeGetIO = () => io;

export default initSocket;
