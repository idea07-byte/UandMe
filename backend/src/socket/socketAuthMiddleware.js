import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Socket.IO Authentication Middleware.
 * Validates JWT during the initial WebSocket/Polling handshake.
 * Rejects unauthenticated, expired, or tampered connection attempts.
 *
 * @param {import('socket.io').Socket} socket
 * @param {Function} next
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    // 1. Extract token from handshake auth, authorization header, or query parameter
    let rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization ||
      socket.handshake.query?.token;

    if (!rawToken || typeof rawToken !== 'string') {
      const authError = new Error('Authentication error: No authentication token provided');
      authError.data = { code: 'NO_TOKEN_PROVIDED', status: 'error' };
      return next(authError);
    }

    // 2. Strip 'Bearer ' prefix if present
    const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();

    if (!token) {
      const authError = new Error('Authentication error: Token is empty');
      authError.data = { code: 'EMPTY_TOKEN', status: 'error' };
      return next(authError);
    }

    // 3. Cryptographically verify token signature
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('❌ FATAL: JWT_SECRET is not configured in environment variables');
      return next(new Error('Internal server configuration error'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch (jwtErr) {
      const isExpired = jwtErr.name === 'TokenExpiredError';
      const authError = new Error(
        isExpired
          ? 'Authentication error: Token has expired'
          : 'Authentication error: Invalid authentication token'
      );
      authError.data = {
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        status: 'error',
      };
      return next(authError);
    }

    // 4. Verify user exists in MongoDB
    const user = await User.findById(decoded.id);
    if (!user) {
      const authError = new Error(
        'Authentication error: User belonging to token no longer exists'
      );
      authError.data = { code: 'USER_NOT_FOUND', status: 'error' };
      return next(authError);
    }

    // 5. Associate authenticated user data with socket instance
    socket.user = user;
    socket.userId = user._id.toString();

    next();
  } catch (err) {
    console.error('Unhandled socket authentication error:', err.message);
    const authError = new Error('Authentication error: Internal validation failure');
    authError.data = { code: 'AUTH_FAILED', status: 'error' };
    next(authError);
  }
};

export default socketAuthMiddleware;
