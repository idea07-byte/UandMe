import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import validateEnv from './config/envValidator.js';
import mongoSanitize from './middleware/mongoSanitize.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import dbGuard from './middleware/dbGuard.js';
import { safeError } from './utils/logger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// 1. Fail-fast environment variable validation
try {
  validateEnv();
} catch (envErr) {
  // Allow test runners that set custom variables to proceed if valid
  if (process.env.NODE_ENV !== 'test') {
    throw envErr;
  }
}

const app = express();

/**
 * -------------------------------------------------------------
 * 1. Global Security Middleware Configuration
 * -------------------------------------------------------------
 */

// 1.1 Helmet: Comprehensive HTTP Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'ws:', 'wss:', process.env.CLIENT_URL || 'http://localhost:5173'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allows cross-origin avatars and media resources
  })
);

// 1.2 CORS with Whitelist Validation
const allowedOriginEnv = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  allowedOriginEnv,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server tests), or if wildcard is configured
      if (!origin || allowedOriginEnv === '*' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from unauthorized origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Next-Cursor', 'X-Has-More'],
  })
);

// 1.3 Request-Body Size Limits (Prevents Denial-of-Service via payload flooding)
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// 1.4 NoSQL Query Injection Sanitizer (Strips '$' and '.' query operator keys)
app.use(mongoSanitize);

// 1.5 Database Readiness Guard (Returns 503 instead of hanging if DB connection drops)
app.use(dbGuard);

// 1.6 Global API Rate Limiter
app.use('/api', apiLimiter);

/**
 * -------------------------------------------------------------
 * 2. Application Routes
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

// Health check endpoints for Render, Docker, uptime monitors, and frontend checks
const handleHealthCheck = (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const isSupabaseConfigured = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_URL);
  const isHealthy = isSupabaseConfigured || isMongoConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    message: isHealthy
      ? 'PulseChat API server is healthy and operational'
      : 'PulseChat API server is degraded: no database connected',
    database: {
      supabase: isSupabaseConfigured ? 'connected' : 'disconnected',
      mongodb: isMongoConnected ? 'connected' : 'disconnected',
    },
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
  });
};

app.get('/health', handleHealthCheck);
app.get('/api/health', handleHealthCheck);

/**
 * -------------------------------------------------------------
 * 3. 404 Route Not Found Middleware
 * -------------------------------------------------------------
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
 * Handles BodyParser PayloadTooLargeError, Mongoose CastError, and Duplicate Key Errors.
 */
app.use((err, req, res, next) => {
  // 1. Handle Payload Too Large (HTTP 413)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      status: 'error',
      message: 'Payload too large: Request body exceeds maximum allowed size limit',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }

  // 2. Handle Invalid JSON Payload syntax (HTTP 400)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      message: 'Malformed JSON payload syntax',
      code: 'INVALID_JSON_SYNTAX',
    });
  }

  // 3. Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: `Invalid format for field "${err.path}": ${err.value}`,
      code: 'INVALID_FIELD_FORMAT',
    });
  }

  // 4. Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      status: 'error',
      message: `A record with that ${field} already exists`,
      code: 'DUPLICATE_KEY_ERROR',
    });
  }

  // 5. General Error Response (Hides internal stack traces in non-development environments)
  const statusCode = err.statusCode || err.status || 500;
  safeError(`[Server Error] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
