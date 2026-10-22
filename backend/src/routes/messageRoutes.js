import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
} from '../controllers/messageController.js';

const router = express.Router();

// Guard all messaging endpoints with JWT authentication barrier
router.use(protect);

// -------------------------------------------------------------
// Message Endpoints (/api/messages)
// -------------------------------------------------------------

// GET /api/messages/:chatId - Retrieve message history for a conversation
router.get('/:chatId', getMessages);

// POST /api/messages - Send a new message
router.post('/', sendMessage);

// PATCH /api/messages/:chatId/read - Mark messages as read
router.patch('/:chatId/read', markMessagesAsRead);

// POST /api/messages/read - Alternative endpoint to mark messages as read
router.post('/read', markMessagesAsRead);

// DELETE /api/messages/:id - Delete a message (sender only)
router.delete('/:id', deleteMessage);

export default router;
