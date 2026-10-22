import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
} from '../controllers/messageController.js';

const router = express.Router();

// Guard all messaging endpoints with JWT authentication barrier
router.use(protect);

// -------------------------------------------------------------
// Message Endpoints (/api/messages)
// -------------------------------------------------------------

// POST /api/messages - Send a new message
router.post('/', sendMessage);

// POST /api/messages/read - Mark messages as read
router.post('/read', markMessagesAsRead);

// PATCH /api/messages/:chatId/read - Mark conversation messages as read
router.patch('/:chatId/read', markMessagesAsRead);

// PATCH /api/messages/:messageId - Edit a message (author only)
router.patch('/:messageId', editMessage);

// DELETE /api/messages/:messageId - Delete a message (author or group admin)
router.delete('/:messageId', deleteMessage);

// GET /api/messages/:chatId - Retrieve message history for a conversation
router.get('/:chatId', getMessages);

export default router;
