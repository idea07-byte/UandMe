import api from './api';

const TOKEN_KEY = 'pulsechat_token';
const USER_KEY = 'pulsechat_user';
const REMEMBER_KEY = 'pulsechat_remember_email';

/**
 * Normalizes backend user representation into standard frontend user object.
 * @param {Object} raw - Backend response object
 * @returns {Object}
 */
export function normalizeUser(raw) {
  if (!raw) return null;
  const id = raw._id || raw.id;
  const username = raw.username || raw.name || 'User';
  return {
    id,
    _id: id,
    name: username,
    username,
    email: raw.email || (username.includes('@') ? username : `${username}@pulsechat.local`),
    avatar:
      raw.avatar ||
      'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    about: raw.about || 'Available on PulseChat',
    publicKey: raw.publicKey || null,
    isOnline: Boolean(raw.isOnline),
    lastSeen: raw.lastSeen || null,
    privacySettings: raw.privacySettings || {
      lastSeen: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true,
    },
  };
}

/**
 * Production-ready Authentication Service Interface.
 * Communicates with backend Express REST API at /api/auth/*.
 */
export const authService = {
  /**
   * Standard login against Express backend.
   * Accepts username or email address.
   * @param {Object} credentials - { email, password, rememberMe }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login({ email, password, rememberMe = false }) {
    try {
      const trimmedIdentifier = (email || '').trim();

      const response = await api.post('/auth/login', {
        email: trimmedIdentifier,
        password,
      });

      // Backend returns: { status: 'success', message: 'Logged in successfully', user, token }
      if (response && response.token) {
        const user = normalizeUser(response.user || response);

        // Securely store token and public profile (never store raw password)
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, trimmedIdentifier);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        return { user, token: response.token };
      }

      throw new Error('Invalid response received from authentication server.');
    } catch (error) {
      const message =
        error.data?.message ||
        error.message ||
        'Unable to connect to authentication server. Please check your credentials.';
      throw new Error(message);
    }
  },

  /**
   * User registration against Express backend.
   * @param {Object} userData - { name, email, password }
   * @returns {Promise<{ user: Object, token: string, message?: string }>}
   */
  async register({ name, email, password }) {
    try {
      const rawName = (name || '').trim();
      const rawEmail = (email || '').trim();

      const response = await api.post('/auth/register', {
        name: rawName,
        email: rawEmail,
        password,
      });

      // Backend returns: { status: 'success', message: 'Account created successfully', user, token }
      if (response && response.token) {
        const user = normalizeUser(response.user || response);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        return {
          user,
          token: response.token,
          message: response.message || 'Account created successfully.',
        };
      }

      throw new Error('Registration response missing authentication token.');
    } catch (error) {
      const message =
        error.data?.message ||
        error.message ||
        'Registration failed. Please check your details or try again.';
      throw new Error(message);
    }
  },

  /**
   * Fetch all registered users from backend directory (excluding self).
   * @returns {Promise<Array<Object>>}
   */
  async getUsers() {
    try {
      let response;
      try {
        response = await api.get('/users');
      } catch {
        response = await api.get('/auth/users');
      }

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data?.users)
        ? response.data.users
        : Array.isArray(response?.users)
        ? response.users
        : [];

      if (list.length > 0) {
        return list.map(normalizeUser);
      }
      return [];
    } catch (error) {
      console.warn('[authService] Failed to load users from backend:', error.message);
      return [];
    }
  },

  /**
   * Request password reset link.
   * @param {string} email
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim(),
      });
      return {
        success: true,
        message: response?.message || 'Password reset link sent to your registered email.',
      };
    } catch {
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      };
    }
  },

  /**
   * Reset password with reset token.
   * @param {Object} params - { token, newPassword }
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async resetPassword({ token, newPassword }) {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      return {
        success: true,
        message: response?.message || 'Password successfully reset.',
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to reset password. Token may have expired.');
    }
  },

  /**
   * Verify email address with token.
   * @param {string} token
   * @returns {Promise<{ success: boolean, user?: Object, message: string }>}
   */
  async verifyEmail(token) {
    try {
      const response = await api.post('/auth/verify-email', { token });
      return {
        success: true,
        user: response?.user ? normalizeUser(response.user) : null,
        message: response?.message || 'Email verified successfully.',
      };
    } catch (error) {
      throw new Error(error.message || 'Invalid or expired verification link.');
    }
  },

  /**
   * Resend verification email.
   * @param {string} email
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async resendVerificationEmail(email) {
    try {
      const response = await api.post('/auth/resend-verification', {
        email: email.trim(),
      });
      return {
        success: true,
        message: response?.message || 'Verification email resent.',
      };
    } catch (error) {
      throw new Error(error.message || 'Unable to resend verification email.');
    }
  },

  /**
   * Get active JWT token.
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get current authenticated user profile.
   * @returns {Object|null}
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get remembered email for login autofill.
   * @returns {string}
   */
  getRememberedEmail() {
    return localStorage.getItem(REMEMBER_KEY) || '';
  },

  /**
   * Terminate active session cleanly.
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Backward-compatible simulated dev helpers.
   */
  dev: {
    simulateLogin(email) {
      const username = email.split('@')[0];
      const mockUser = {
        id: `usr_${Date.now()}`,
        _id: `usr_${Date.now()}`,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        username,
        email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        about: 'Available on PulseChat (Dev Session)',
      };
      localStorage.setItem(TOKEN_KEY, 'dev_token_' + Date.now());
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      return mockUser;
    },
    simulateRegister({ name: _name, email }) {
      return this.simulateLogin(email);
    },
    isDevSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      return Boolean(token && token.startsWith('dev_token_'));
    },
  },
};

export default authService;
