import { Server } from 'socket.io';
import socketAuthMiddleware from './socketAuthMiddleware.js';
import registerConversationHandlers from './conversationHandler.js';

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

    // Automatically join the user's personal private notification room
    socket.join(`user:${socket.userId}`);
    socket.join(socket.userId);

    // Frontend compatibility event ('setup')
    socket.on('setup', () => {
      socket.emit('connected');
    });

    // 3. Register Conversation Room Handlers (Join / Leave)
    registerConversationHandlers(io, socket);

    // 4. Safe Disconnection Logging
    socket.on('disconnect', (reason) => {
      console.log(
        `🔌 [Socket.IO] Client disconnected: socketId=${socket.id}, userId=${socket.userId}, reason="${reason}"`
      );
    });
  });

  console.log(`⚡ Socket.IO initialized with CORS origin: ${allowedOrigin}`);
  return io;
};

/**
 * Get the active Socket.IO server instance.
 * @returns {Server|null}
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocket first.');
  }
  return io;
};

export default initSocket;
