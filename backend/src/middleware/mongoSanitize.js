/**
 * NoSQL Injection Sanitization Middleware
 * In-place sanitization for Express 5 compatibility.
 * Recursively inspects and removes forbidden MongoDB operators ('$' or '.') from
 * req.body, req.query, and req.params without reassigning getter properties.
 */

/**
 * Recursively deletes keys starting with '$' or containing '.' in-place.
 *
 * @param {any} target
 */
export const sanitizeInPlace = (target) => {
  if (target === null || typeof target !== 'object') {
    return;
  }

  if (Array.isArray(target)) {
    for (const item of target) {
      if (item !== null && typeof item === 'object') {
        sanitizeInPlace(item);
      }
    }
    return;
  }

  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else if (typeof target[key] === 'object' && target[key] !== null) {
      sanitizeInPlace(target[key]);
    }
  }
};

/**
 * Express middleware to sanitize body, query, and params in-place.
 */
export const mongoSanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeInPlace(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeInPlace(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeInPlace(req.params);
  }
  next();
};

export default mongoSanitize;
