import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getContacts,
  checkPhone,
  addContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  toggleBlock,
  syncContacts,
} from '../controllers/contactController.js';

const router = express.Router();

// Guard all contact endpoints with JWT authentication barrier
router.use(protect);

// GET /api/contacts - Retrieve user's contact book (supports ?search=&filter=)
router.get('/', getContacts);

// POST /api/contacts/check-phone - Check if phone is registered in app
router.post('/check-phone', checkPhone);

// POST /api/contacts/sync - Bulk sync device contacts
router.post('/sync', syncContacts);

// POST /api/contacts - Add contact by name and phone number
router.post('/', addContact);

// PUT /api/contacts/:id - Update contact details
router.put('/:id', updateContact);

// DELETE /api/contacts/:id - Remove contact
router.delete('/:id', deleteContact);

// PATCH /api/contacts/:id/favorite - Toggle favorite status
router.patch('/:id/favorite', toggleFavorite);

// PATCH /api/contacts/:id/block - Toggle block/unblock
router.patch('/:id/block', toggleBlock);

export default router;

