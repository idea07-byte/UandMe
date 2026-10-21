/**
 * Email RFC-compliant regex
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Normalizes an email address (trims and converts to lowercase).
 * @param {string} email
 * @returns {string}
 */
export const normalizeEmail = (email) => {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

/**
 * Validate registration request body
 * @param {Object} data - { name, email, password }
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateRegisterInput = ({ name, email, password }) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: 'Name cannot exceed 50 characters' };
  }

  const normalized = normalizeEmail(email);
  if (!normalized || !EMAIL_REGEX.test(normalized)) {
    return { isValid: false, error: 'Please provide a valid email address' };
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }

  return { isValid: true };
};

/**
 * Validate login request body
 * @param {Object} data - { email, password }
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateLoginInput = ({ email, password }) => {
  const normalized = normalizeEmail(email);
  if (!normalized || !EMAIL_REGEX.test(normalized)) {
    return { isValid: false, error: 'Please provide a valid email address' };
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  return { isValid: true };
};
