import mongoose from 'mongoose';

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
 * Validates whether a given string is a valid MongoDB ObjectId.
 * @param {string} id - Candidate ObjectId string
 * @returns {boolean} True if valid 24-character hex ObjectId
 */
export const isValidObjectId = (id) => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    new mongoose.Types.ObjectId(id).toString() === id
  );
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

/**
 * Whitelist of fields a user is permitted to update via PATCH /api/users/me.
 * Strictly prevents mass assignment of protected/security fields (role, email, password, isVerified, _id).
 */
export const ALLOWED_PROFILE_UPDATES = [
  'name',
  'avatar',
  'bio',
  'about',
  'department',
  'status',
];

/**
 * Validate and sanitize profile update request body
 * @param {Object} data - Candidate req.body
 * @returns {{ isValid: boolean, sanitizedUpdates?: Object, error?: string }}
 */
export const validateUpdateProfileInput = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, error: 'Request body must be a valid JSON object' };
  }

  const updates = {};
  const allowedKeys = new Set(ALLOWED_PROFILE_UPDATES);

  // Extract only whitelisted properties
  for (const key of Object.keys(data)) {
    if (allowedKeys.has(key)) {
      updates[key] = data[key];
    }
  }

  // Reject if no permitted fields were provided
  if (Object.keys(updates).length === 0) {
    return {
      isValid: false,
      error:
        'No valid update fields provided. Allowed fields: name, avatar, bio (or about), department, status',
    };
  }

  // Validate name if supplied
  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long' };
    }
    if (updates.name.trim().length > 50) {
      return { isValid: false, error: 'Name cannot exceed 50 characters' };
    }
    updates.name = updates.name.trim();
  }

  // Validate avatar if supplied
  if (updates.avatar !== undefined) {
    if (typeof updates.avatar !== 'string') {
      return {
        isValid: false,
        error: 'Avatar must be a valid string URL or path',
      };
    }
    updates.avatar = updates.avatar.trim();
  }

  // Handle bio / about alias and validate length
  const bioValue = updates.bio !== undefined ? updates.bio : updates.about;
  if (bioValue !== undefined) {
    if (typeof bioValue !== 'string') {
      return { isValid: false, error: 'Bio must be a string' };
    }
    if (bioValue.trim().length > 120) {
      return { isValid: false, error: 'Bio cannot exceed 120 characters' };
    }
    updates.about = bioValue.trim();
    delete updates.bio; // Normalize to schema field 'about'
  }

  // Validate department if supplied
  if (updates.department !== undefined) {
    if (typeof updates.department !== 'string') {
      return { isValid: false, error: 'Department must be a string' };
    }
    if (updates.department.trim().length > 80) {
      return { isValid: false, error: 'Department cannot exceed 80 characters' };
    }
    updates.department = updates.department.trim();
  }

  // Validate presence status if supplied
  if (updates.status !== undefined) {
    const validStatuses = ['online', 'offline', 'away', 'busy'];
    if (!validStatuses.includes(updates.status)) {
      return {
        isValid: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      };
    }
  }

  return { isValid: true, sanitizedUpdates: updates };
};
