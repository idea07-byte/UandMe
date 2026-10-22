import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  accessOrCreateChat,
  createGroupChat,
  getUserConversations,
  getConversationById,
  updateConversation,
  deleteOrLeaveConversation,
  updateGroupParticipants,
} from '../controllers/chatController.js';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from '../controllers/messageController.js';

const router = express.Router();

// Guard all conversation endpoints with JWT authentication barrier
router.use(protect);

// -------------------------------------------------------------
// Conversation Endpoints (/api/chats)
// -------------------------------------------------------------

// GET /api/chats - List user's conversations (supports ?filter=, ?search=, ?view=)
router.get('/', getUserConversations);

// POST /api/chats - Access/create 1-on-1 direct conversation or group chat
router.post('/', accessOrCreateChat);

// POST /api/chats/group - Dedicated group conversation creation
router.post('/group', createGroupChat);

// GET /api/chats/:id - Retrieve conversation details by ID
router.get('/:id', getConversationById);

// PATCH /api/chats/:id - Update flags (pin, mute, archive) or rename group
router.patch('/:id', updateConversation);

// DELETE /api/chats/:id - Delete conversation or leave group
router.delete('/:id', deleteOrLeaveConversation);

// PATCH /api/chats/:id/participants - Add or remove group members
router.patch('/:id/participants', updateGroupParticipants);

// -------------------------------------------------------------
// Nested Conversation Message Endpoints (/api/chats/:id/messages)
// -------------------------------------------------------------

// GET /api/chats/:id/messages - Paginated message history for room
router.get('/:id/messages', getMessages);

// POST /api/chats/:id/messages - Send message to conversation
router.post('/:id/messages', sendMessage);

// PATCH /api/chats/:id/read - Mark conversation messages as read
router.patch('/:id/read', markMessagesAsRead);

export default router;
