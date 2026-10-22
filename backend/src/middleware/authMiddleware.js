import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication Middleware: protect
 * Inspects the incoming Authorization header for a Bearer token,
 * verifies the signature, and loads the active user into req.user.
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check for Bearer token in HTTP Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1]?.trim();
  }

  // 2. Reject request if token is missing
  if (!token || typeof token !== 'string') {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied: No authentication token provided',
    });
  }

  try {
    // 3. Verify token authenticity and expiration with strict algorithm whitelisting
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // 4. Verify that the user still exists in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied: The user belonging to this token no longer exists',
      });
    }

    // 5. Attach user document to Express request object for downstream controllers
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication session expired: Please log in again',
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Access denied: Invalid authentication token',
    });
  }
};

export default protect;
