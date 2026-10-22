/**
 * Safe Application Logger.
 * Automatically redacts sensitive fields such as passwords, JWT tokens, and Bearer tokens
 * to prevent accidental secret leakage in production log aggregators.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'accessToken',
  'refreshToken',
]);

/**
 * Deeply redacts sensitive keys from an object.
 *
 * @param {any} data
 * @returns {any}
 */
export const sanitizeForLogging = (data) => {
  if (data === null || typeof data !== 'object') {
    if (typeof data === 'string') {
      // Redact Bearer tokens in raw strings
      return data.replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED]');
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeForLogging(value);
    }
  }

  return sanitized;
};

export const safeLog = (...args) => {
  const sanitizedArgs = args.map(sanitizeForLogging);
  console.log(...sanitizedArgs);
};

export const safeError = (...args) => {
  const sanitizedArgs = args.map(sanitizeForLogging);
  console.error(...sanitizedArgs);
};

export default {
  log: safeLog,
  error: safeError,
  sanitize: sanitizeForLogging,
};
