import express from 'express';
import {
  getUsers,
  searchUsers,
  getUserById,
  updateMe,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * -------------------------------------------------------------
 * Authentication Barrier
 * -------------------------------------------------------------
 * All user management routes require a valid JWT Bearer token.
 */
router.use(protect);

/**
 * -------------------------------------------------------------
 * User Routes
 * -------------------------------------------------------------
 * IMPORTANT ROUTING NOTE:
 * Explicit sub-paths like '/search' and '/me' MUST be registered
 * BEFORE parameterized route '/:id'. Otherwise, Express would
 * interpret the string 'search' or 'me' as a dynamic ':id' parameter.
 */

// GET /api/users - Paginated directory listing
router.get('/', getUsers);

// GET /api/users/search - Search users by name (and email with privacy constraints)
router.get('/search', searchUsers);

// PATCH /api/users/me - Update the currently authenticated user's profile
router.patch('/me', updateMe);

// GET /api/users/:id - Retrieve public user profile by MongoDB ObjectId
router.get('/:id', getUserById);

export default router;
