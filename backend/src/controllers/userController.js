import User from '../models/User.js';
import {
  isValidObjectId,
  validateUpdateProfileInput,
} from '../utils/validators.js';

/**
 * -------------------------------------------------------------
 * GET /api/users
 * -------------------------------------------------------------
 * Retrieves a paginated list of campus directory users.
 * - Supports pagination (page, limit).
 * - Excludes the currently authenticated user from results.
 * - Alphabetically sorted by name.
 * - Never returns password hashes.
 */
export const getUsers = async (req, res, next) => {
  try {
    // 1. Parse and sanitize pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // 2. Build filter (exclude current user so users don't see themselves in contact lists)
    const filter = {
      _id: { $ne: req.user._id },
    };

    // Optional status filter (e.g. 'online', 'offline')
    if (req.query.status && ['online', 'offline', 'away', 'busy'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    // Optional department filter
    if (req.query.department && typeof req.query.department === 'string') {
      filter.department = new RegExp(
        req.query.department.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
    }

    // 3. Count total matching users and execute paginated query in parallel
    const [totalUsers, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalUsers / limit) || 1;

    // 4. Return structured response with pagination metadata
    return res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -------------------------------------------------------------
 * GET /api/users/search?q=arun
 * -------------------------------------------------------------
 * Searches for users by name or department.
 * Privacy Rule:
 * Email search is only activated when query contains '@' (e.g., searching for a known contact).
 * This prevents malicious users from scraping campus email addresses letter-by-letter.
 * ReDoS protection: search string is sanitized before regex generation.
 */
export const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q;

    // If query string is missing or empty, return empty list immediately
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          users: [],
        },
      });
    }

    // 1. Sanitize user input against Regular Expression Denial of Service (ReDoS)
    const rawSearch = q.trim();
    const sanitized = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 2. Sensible result limits (default 10, max 20)
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));

    // 3. Construct privacy-preserving query filter
    // Always exclude the authenticated user
    const filter = {
      _id: { $ne: req.user._id },
    };

    // Privacy rule check:
    // If the query contains '@', the user is searching for an explicit email address.
    // If it does NOT contain '@', search strictly by name and department to protect email privacy.
    if (rawSearch.includes('@')) {
      filter.$or = [
        { email: new RegExp(`^${sanitized}`, 'i') },
        { name: new RegExp(sanitized, 'i') },
      ];
    } else {
      filter.$or = [
        { name: new RegExp(sanitized, 'i') },
        { department: new RegExp(sanitized, 'i') },
      ];
    }

    // 4. Query database with name sorting and limit
    const users = await User.find(filter)
      .select('-password')
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -------------------------------------------------------------
 * GET /api/users/:id
 * -------------------------------------------------------------
 * Retrieves a single user's public profile by their MongoDB ObjectId.
 * - Validates MongoDB ObjectId format strictly.
 * - Returns 400 Bad Request for invalid IDs.
 * - Returns 404 Not Found if user does not exist.
 * - Never returns password hashes.
 */
export const getUserById = async (req, res, next) => {
  try {
    const id = req.params.userId || req.params.id;

    // 1. Validate MongoDB ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format: Must be a valid 24-character hexadecimal ObjectId',
      });
    }

    // 2. Query user document by ID
    const user = await User.findById(id).select('-password');

    // 3. Handle non-existent user
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // 4. Return user profile
    return res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -------------------------------------------------------------
 * PATCH /api/users/me
 * -------------------------------------------------------------
 * Allows authenticated users to update their own profile (name, avatar, bio/about, etc.).
 * Security Protections:
 * - Operates strictly on req.user._id (authenticated session).
 * - A user CANNOT modify another user's profile.
 * - Whitelists allowed fields, strictly preventing mass assignment of protected fields:
 *   (_id, email, password, role, isVerified, blockedUsers, createdAt, etc.)
 * - Validates field lengths and types.
 * - Never returns password hashes.
 */
export const updateMe = async (req, res, next) => {
  try {
    // 1. Validate payload against whitelist and schema rules
    const { isValid, sanitizedUpdates, error } = validateUpdateProfileInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: error,
      });
    }

    // 2. Perform atomic update strictly on authenticated user's ID
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: sanitizedUpdates },
      {
        returnDocument: 'after', // Return modified document (modern Mongoose syntax)
        runValidators: true, // Run schema validation on updated fields
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User account not found',
      });
    }

    // 3. Return sanitized updated user profile
    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
