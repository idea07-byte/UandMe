import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

const app = express();

/**
 * -------------------------------------------------------------
 * 1. Global Middleware Configuration
 * -------------------------------------------------------------
 */

// Enable Cross-Origin Resource Sharing (CORS) so our React frontend can connect
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Built-in Express middleware to parse incoming JSON payloads (e.g. req.body)
app.use(express.json());

// Built-in Express middleware to parse standard URL-encoded form data
app.use(express.urlencoded({ extended: true }));

/**
 * -------------------------------------------------------------
 * 2. Routes
 * -------------------------------------------------------------
 */

// Root endpoint: Quick welcoming message with endpoint discovery
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'PulseChat API Gateway',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
      users: {
        list: 'GET /api/users',
        search: 'GET /api/users/search?q={query}',
        getById: 'GET /api/users/:id',
        updateMe: 'PATCH /api/users/me',
      },
      conversations: {
        list: 'GET /api/conversations (or GET /api/chats)',
        create: 'POST /api/conversations',
        getById: 'GET /api/conversations/:id',
        listMessages: 'GET /api/conversations/:conversationId/messages',
        sendMessage: 'POST /api/conversations/:conversationId/messages',
      },
      chats: {
        list: 'GET /api/chats',
        accessOrCreate: 'POST /api/chats',
        createGroup: 'POST /api/chats/group',
        getById: 'GET /api/chats/:id',
        updateFlags: 'PATCH /api/chats/:id',
        delete: 'DELETE /api/chats/:id',
        participants: 'PATCH /api/chats/:id/participants',
      },
      messages: {
        sendToConversation: 'POST /api/conversations/:conversationId/messages',
        listForConversation: 'GET /api/conversations/:conversationId/messages',
        edit: 'PATCH /api/messages/:messageId',
        delete: 'DELETE /api/messages/:messageId',
        markRead: 'PATCH /api/messages/:chatId/read (or POST /api/messages/read)',
        listForChat: 'GET /api/messages/:chatId',
        send: 'POST /api/messages',
      },
    },
  });
});

// Authentication API Routes
app.use('/api/auth', authRoutes);

// User Management API Routes
app.use('/api/users', userRoutes);

// Conversation & Chat API Routes
app.use('/api/chats', chatRoutes);
app.use('/api/conversations', chatRoutes);

// Messaging API Routes
app.use('/api/messages', messageRoutes);


// Health check endpoint: Monitored by Docker, uptime services, and frontend checks
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    message: isDbConnected
      ? 'PulseChat API server is healthy and connected to MongoDB'
      : 'PulseChat API server is degraded: database is not connected',
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * -------------------------------------------------------------
 * 3. 404 Route Not Found Middleware
 * -------------------------------------------------------------
 * Catches any request that did not match the routes defined above.
 */
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * -------------------------------------------------------------
 * 4. Centralized Global Error Handling Middleware
 * -------------------------------------------------------------
 * Catches any synchronous or asynchronous errors forwarded via next(err).
 * Four parameters (err, req, res, next) define this as an error-handling middleware.
 */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
