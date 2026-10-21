import dotenv from 'dotenv';

// Load environment variables from .env file before anything else
dotenv.config();

// Import the configured Express app
import app from './app.js';

// Read port from environment variables, defaulting to 5000
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start listening for incoming HTTP requests
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 PulseChat Backend API running successfully!`);
  console.log(`📡 URL:         http://localhost:${PORT}`);
  console.log(`🩺 Health API:  http://localhost:${PORT}/api/health`);
  console.log(`🌿 Environment: ${NODE_ENV}`);
  console.log('====================================================');
});

// Handle unhandled Promise rejections (e.g. failed async operations)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, consider graceful shutdown if critical
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Graceful shutdown on process termination signals (e.g. Ctrl+C or Docker stop)
const handleGracefulShutdown = (signal) => {
  console.log(`\n${signal} signal received: Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
