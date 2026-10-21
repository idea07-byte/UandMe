import dotenv from 'dotenv';

// 1. Load environment variables before importing dependent modules
dotenv.config();

// 2. Import database connection helper and configured Express application
import { connectDB, disconnectDB } from './config/database.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

/**
 * Bootstrap function to initialize database connection before listening for HTTP traffic.
 */
const startServer = async () => {
  // Connect to MongoDB first; connectDB exits the process if the connection fails
  await connectDB();

  // Start HTTP server once database connection is established
  server = app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 PulseChat Backend API running successfully!`);
    console.log(`📡 URL:         http://localhost:${PORT}`);
    console.log(`🩺 Health API:  http://localhost:${PORT}/api/health`);
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
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
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
