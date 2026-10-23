import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 1. Load environment variables reliably regardless of working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // fallback to cwd .env if present

// 2. Import database connection helper, configured Express application, and Socket.IO initializer
import { connectDB, disconnectDB } from './config/database.js';
import app from './app.js';
import { initSocket } from './socket/index.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let httpServer;
let io;

/**
 * Bootstrap function to initialize database connection before listening for HTTP & WebSocket traffic.
 */
const startServer = async () => {
  // Connect to MongoDB first; connectDB exits the process if the connection fails
  await connectDB();

  // Create native HTTP server wrapping Express app
  httpServer = http.createServer(app);

  // Initialize Socket.IO server attached to the HTTP server
  io = initSocket(httpServer);

  // Start HTTP and WebSocket server once database connection is established
  httpServer.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 PulseChat Backend API & Socket.IO running!`);
    console.log(`📡 URL:         http://localhost:${PORT}`);
    console.log(`🩺 Health API:  http://localhost:${PORT}/api/health`);
    console.log(`🔌 WebSockets:  ws://localhost:${PORT}`);
    console.log(`🌿 Environment: ${NODE_ENV}`);
    console.log('====================================================');
  });
};

// Start the server
startServer();

// Handle unhandled Promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Graceful shutdown on process termination signals (e.g. Ctrl+C or Docker stop)
const handleGracefulShutdown = async (signal) => {
  console.log(`\n${signal} signal received: Closing server gracefully...`);
  if (io) {
    io.close();
  }
  if (httpServer) {
    httpServer.close(async () => {
      console.log('HTTP and WebSocket server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
