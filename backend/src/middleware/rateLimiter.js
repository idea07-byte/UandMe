import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Authentication Routes (Login, Register).
 * Mitigates credential stuffing, password brute-forcing, and account creation spam.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 500 : 25, // Generous limit in test mode to allow full test suite execution
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * Global API Rate Limiter.
 * Mitigates DoS and scraping across all standard API routes.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 5000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health' || req.path === '/',
  message: {
    status: 'error',
    message: 'Too many API requests from this IP, please try again later',
    code: 'API_RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});
