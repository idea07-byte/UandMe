import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import {
  validateRegisterInput,
  validateLoginInput,
  normalizeEmail,
} from '../utils/validators.js';

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const name = req.body.name || req.body.fullName || req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    // 1. Validate incoming input fields
    const { isValid, error } = validateRegisterInput({ name, email, password });
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: error,
      });
    }

    // 2. Normalize email address
    const normalizedEmail = normalizeEmail(email);

    // 3. Reject duplicate email registrations
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists',
      });
    }

    // 4. Create new user document (password will be hashed by pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    // 5. Generate signed JWT token
    const token = generateToken(user._id);

    // 6. Return 201 Created with safe user profile (toJSON omits password)
    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Authenticate user credentials and receive JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const rawEmail = req.body.email || req.body.username || req.body.identifier;
    const password = req.body.password;

    // 1. Validate incoming input fields
    const { isValid, error } = validateLoginInput({ email: rawEmail, password });
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: error,
      });
    }

    // 2. Normalize email
    const normalizedEmail = normalizeEmail(rawEmail);

    // 3. Find user and explicitly include password field (which is select: false)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // 4. Check if user exists and verify password hash with bcrypt
    if (!user || !(await user.comparePassword(password))) {
      // Intentionally generic message to prevent user enumeration attacks
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // 5. Generate signed JWT token
    const token = generateToken(user._id);

    // 6. Return 200 OK with sanitized user profile
    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by JWT)
 */
export const getMe = async (req, res) => {
  // req.user was securely loaded by the protect middleware
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
};

/**
 * @desc    Log out current session
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  // With stateless JWTs stored in client memory or localStorage,
  // the client invalidates the session by destroying the local token.
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};
