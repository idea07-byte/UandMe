import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { normalizePhone } from '../utils/phoneUtils.js';
import {
  validateRegisterInput,
  validateLoginInput,
  normalizeEmail,
} from '../utils/validators.js';
import { supabaseService } from '../services/supabaseService.js';
import { supabaseAdmin } from '../config/supabase.js';

const isUsingSupabase = () => mongoose.connection.readyState !== 1 && Boolean(supabaseAdmin);

// In-memory Phone OTP Storage (Phone E.164 -> { code, expiresAt })
const phoneOtpStore = new Map();

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

    // If using Supabase directly (when MongoDB is not connected)
    if (isUsingSupabase()) {
      const existingUser = await supabaseService.findUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'An account with this email address already exists',
        });
      }

      const user = await supabaseService.createUser({
        name: name.trim(),
        email: normalizedEmail,
        password,
      });

      const token = generateToken(user._id);
      return res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        user: user.toJSON(),
        token,
      });
    }

    // 3. Reject duplicate email registrations (MongoDB)
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

    // If using Supabase directly (when MongoDB is not connected)
    if (isUsingSupabase()) {
      const user = await supabaseService.findUserByEmail(normalizedEmail);
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
        });
      }

      const token = generateToken(user._id);
      return res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        user: user.toJSON(),
        token,
      });
    }

    // 3. Find user and explicitly include password field (MongoDB)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // 4. Check if user exists and verify password hash with bcrypt
    if (!user || !(await user.comparePassword(password))) {
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

/**
 * @desc    Send 6-digit verification code to a mobile phone number
 * @route   POST /api/auth/phone/send-otp
 * @access  Public
 */
export const sendPhoneOtp = async (req, res, next) => {
  try {
    const { phone, countryCode = 'IN' } = req.body;

    const normalized = normalizePhone(phone, countryCode);
    if (!normalized.isValid) {
      return res.status(400).json({
        status: 'error',
        message: normalized.error || 'Please enter a valid phone number with country code',
      });
    }

    // Generate random 6-digit OTP code (always accepting 123456 as deterministic test fallback)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    phoneOtpStore.set(normalized.e164, { code: otpCode, expiresAt });

    console.log(`📱 [SMS Gateway Simulator] Verification code for ${normalized.formatted || normalized.e164}: ${otpCode}`);

    return res.status(200).json({
      status: 'success',
      message: `Verification code sent to ${normalized.formatted || normalized.e164}`,
      data: {
        phone: normalized.e164,
        formattedPhone: normalized.formatted,
        devOtp: otpCode, // Provided for seamless immediate onboarding and testing
        expiresInSeconds: 600,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify OTP and log in / register the user
 * @route   POST /api/auth/phone/verify-otp
 * @access  Public
 */
export const verifyPhoneOtp = async (req, res, next) => {
  try {
    const { phone, otp, name, countryCode = 'IN' } = req.body;

    const normalized = normalizePhone(phone, countryCode);
    if (!normalized.isValid) {
      return res.status(400).json({
        status: 'error',
        message: normalized.error || 'Invalid phone number format',
      });
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length < 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Please enter the 6-digit verification code',
      });
    }

    const trimmedOtp = otp.trim();
    const stored = phoneOtpStore.get(normalized.e164);

    // Validate OTP (matches stored code or universal test code 123456)
    const isCodeValid =
      trimmedOtp === '123456' ||
      (stored && stored.code === trimmedOtp && stored.expiresAt > Date.now());

    if (!isCodeValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification code. Please request a new code.',
      });
    }

    // OTP Verified -> clear stored code
    phoneOtpStore.delete(normalized.e164);

    // 1. Check if user already exists with this phone number
    let user = null;
    if (isUsingSupabase()) {
      user = await supabaseService.findUserByPhone(normalized.e164);
    } else {
      user = await User.findOne({ phone: normalized.e164 });
    }

    // 2. Existing user -> log in immediately
    if (user) {
      const token = generateToken(user._id || user.id);
      return res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        data: {
          user: user.toJSON ? user.toJSON() : user,
          token,
          isNew: false,
        },
      });
    }

    // 3. New user -> check if name is provided
    if (!name || !name.trim()) {
      return res.status(200).json({
        status: 'prompt_name',
        message: 'Phone verified! Please enter your name to complete registration.',
        data: {
          phone: normalized.e164,
          formattedPhone: normalized.formatted,
          isNew: true,
        },
      });
    }

    // 4. Create new user account with phone
    const cleanName = name.trim();
    const pseudoEmail = `${normalized.e164.replace(/\D/g, '')}@phone.uandi.app`;
    const randomPassword = crypto.randomUUID();

    if (isUsingSupabase()) {
      user = await supabaseService.createUser({
        name: cleanName,
        email: pseudoEmail,
        password: randomPassword,
        phone: normalized.e164,
        role: 'student',
        about: 'Hey there! I am using uandi.',
      });
    } else {
      user = await User.create({
        name: cleanName,
        email: pseudoEmail,
        password: randomPassword,
        phone: normalized.e164,
        about: 'Hey there! I am using uandi.',
      });
    }

    const token = generateToken(user._id || user.id);
    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: {
        user: user.toJSON ? user.toJSON() : user,
        token,
        isNew: true,
      },
    });
  } catch (err) {
    next(err);
  }
};
