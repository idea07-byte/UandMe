import mongoose from 'mongoose';

/**
 * Database Readiness Guard Middleware.
 * Protects endpoints from timing out or throwing uncaught driver errors
 * when MongoDB is disconnected or in the middle of a reconnection failover.
 */
export const dbGuard = (req, res, next) => {
  // Allow health check and root landing page to execute even if DB is degraded
  if (req.path === '/api/health' || req.path === '/') {
    return next();
  }

  // 1 = connected in Mongoose readyState
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 'error',
      message: 'Database connection unavailable. Please try again shortly.',
      code: 'DATABASE_UNAVAILABLE',
    });
  }

  next();
};

export default dbGuard;
