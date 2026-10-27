import mongoose from 'mongoose';

/**
 * Database Readiness Guard Middleware.
 * Protects endpoints from timing out or throwing uncaught driver errors
 * when database is disconnected or in the middle of a reconnection failover.
 */
export const dbGuard = (req, res, next) => {
  // Allow health check and root landing page to execute unconditionally
  if (req.path === '/api/health' || req.path === '/health' || req.path === '/') {
    return next();
  }

  const isSupabaseConfigured = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_URL);

  // If Supabase PostgreSQL is configured in production, allow requests
  if (isSupabaseConfigured) {
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
