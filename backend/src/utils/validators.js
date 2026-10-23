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
    typeof id === 'string' &&
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
  if (!name || typeof name !== 'string' || !name.trim()) {
    return { isValid: false, error: 'Please enter your full name' };
  }

  if (name.trim().length < 2) {
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

  if (password.length > 128) {
    return { isValid: false, error: 'Password cannot exceed 128 characters' };
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

  if (password.length > 128) {
    return { isValid: false, error: 'Password cannot exceed 128 characters' };
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

/**
 * Validate direct 1-on-1 chat creation payload
 * @param {Object} data - { userId }
 * @param {string} currentUserId - Logged-in user's ID
 * @returns {{ isValid: boolean, targetUserId?: string, error?: string }}
 */
export const validateDirectChatInput = (data, currentUserId) => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object' };
  }

  const targetUserId =
    data.userId || data.partnerId || data.recipientId || data.participantId;
  if (!targetUserId || typeof targetUserId !== 'string') {
    return { isValid: false, error: 'Target userId is required to start a direct conversation' };
  }

  if (!isValidObjectId(targetUserId)) {
    return {
      isValid: false,
      error: 'Invalid target userId format: Must be a valid 24-character hexadecimal ObjectId',
    };
  }

  if (targetUserId.toString() === currentUserId.toString()) {
    return { isValid: false, error: 'Cannot create a direct conversation with yourself' };
  }

  return { isValid: true, targetUserId };
};

/**
 * Validate group chat creation payload
 * @param {Object} data - { name / chatName, participants / users, avatar }
 * @param {string} currentUserId - Logged-in user's ID
 * @returns {{ isValid: boolean, name?: string, participants?: string[], avatar?: string, error?: string }}
 */
export const validateGroupChatInput = (data, currentUserId) => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object' };
  }

  const name =
    typeof data.name === 'string'
      ? data.name
      : typeof data.chatName === 'string'
      ? data.chatName
      : '';
  if (!name || name.trim().length < 2) {
    return { isValid: false, error: 'Group title must be at least 2 characters long' };
  }
  if (name.trim().length > 60) {
    return { isValid: false, error: 'Group title cannot exceed 60 characters' };
  }

  const rawParticipants = data.participants || data.users;
  if (!Array.isArray(rawParticipants) || rawParticipants.length < 2) {
    return { isValid: false, error: 'Group chat requires at least 2 other participants' };
  }

  const participantIds = new Set();
  for (const item of rawParticipants) {
    const id = typeof item === 'object' && item !== null ? item._id || item.id : item;
    if (!id || typeof id !== 'string' || !isValidObjectId(id)) {
      return { isValid: false, error: `Invalid participant ID in list: "${id}"` };
    }
    if (id.toString() !== currentUserId.toString()) {
      participantIds.add(id.toString());
    }
  }

  if (participantIds.size < 2) {
    return { isValid: false, error: 'Group chat requires at least 2 unique other participants' };
  }

  // Include current user in group participants
  participantIds.add(currentUserId.toString());

  return {
    isValid: true,
    name: name.trim(),
    participants: Array.from(participantIds),
    avatar: typeof data.avatar === 'string' ? data.avatar.trim() : '',
  };
};

/**
 * Validate message sending payload
 * @param {Object} data - { chatId / conversationId, text / content, attachments, clientMessageId }
 * @returns {{ isValid: boolean, chatId?: string, text?: string, attachments?: Array, clientMessageId?: string, error?: string }}
 */
export const validateSendMessageInput = (data) => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object' };
  }

  const chatId = data.chatId || data.conversationId;
  if (!chatId || typeof chatId !== 'string' || !isValidObjectId(chatId)) {
    return { isValid: false, error: 'Valid chatId (or conversationId) is required' };
  }

  const rawText =
    typeof data.text === 'string'
      ? data.text
      : typeof data.content === 'string'
      ? data.content
      : '';
  const text = rawText.trim();
  const attachments = Array.isArray(data.attachments) ? data.attachments : [];

  if (text.length === 0 && attachments.length === 0) {
    return {
      isValid: false,
      error: 'Message cannot be empty: provide text or at least one attachment',
    };
  }

  if (text.length > 2000) {
    return { isValid: false, error: 'Message text cannot exceed 2000 characters' };
  }

  const clientMessageId =
    typeof data.clientMessageId === 'string'
      ? data.clientMessageId.trim().substring(0, 100)
      : null;

  return {
    isValid: true,
    chatId,
    text,
    attachments,
    clientMessageId,
  };
};

