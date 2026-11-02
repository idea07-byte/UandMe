import mongoose from 'mongoose';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import { normalizePhone } from '../utils/phoneUtils.js';
import { supabaseService } from '../services/supabaseService.js';
import { supabaseAdmin } from '../config/supabase.js';

const isUsingSupabase = () => mongoose.connection.readyState !== 1 && Boolean(supabaseAdmin);

/**
 * -------------------------------------------------------------
 * GET /api/contacts
 * -------------------------------------------------------------
 * Retrieve the current user's contact book.
 * Automatically checks and enriches each contact with registered user data.
 */
export const getContacts = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { search = '', filter = 'all' } = req.query;

    if (isUsingSupabase()) {
      const contacts = await supabaseService.listContacts(userId, { search, filter });
      return res.status(200).json({
        status: 'success',
        results: contacts.length,
        data: { contacts },
      });
    }

    // 1. Fetch user's saved contacts from MongoDB
    const query = { userId };
    if (filter === 'favorites') query.isFavorite = true;
    if (filter === 'blocked') query.isBlocked = true;
    if (filter === 'registered') query.isRegistered = true;
    if (filter === 'unregistered') query.isRegistered = false;

    let contacts = await Contact.find(query).sort({ name: 1 }).lean();

    // 2. Refresh registration status against users collection
    const phones = contacts.map((c) => c.phone);
    const registeredUsers = await User.find({ phone: { $in: phones } })
      .select('name avatar status about role department phone lastSeen')
      .lean();

    const userMap = new Map();
    registeredUsers.forEach((u) => {
      if (u.phone) userMap.set(u.phone, u);
    });

    const enrichedContacts = contacts.map((c) => {
      const matched = userMap.get(c.phone) || null;
      return {
        ...c,
        id: c._id.toString(),
        isRegistered: Boolean(matched),
        contactUser: matched
          ? {
              id: matched._id.toString(),
              _id: matched._id.toString(),
              name: matched.name,
              avatar: matched.avatar,
              about: matched.about,
              status: matched.status,
              phone: matched.phone,
              lastSeen: matched.lastSeen,
            }
          : null,
      };
    });

    // 3. In-memory search filter if provided
    let results = enrichedContacts;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.contactUser?.name && c.contactUser.name.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      status: 'success',
      results: results.length,
      data: { contacts: results },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * -------------------------------------------------------------
 * POST /api/contacts/check-phone
 * -------------------------------------------------------------
 * Check whether a given phone number is already registered in the application.
 */
export const checkPhone = async (req, res, next) => {
  try {
    const { phone, countryCode = 'IN' } = req.body;
    const normalized = normalizePhone(phone, countryCode);

    if (!normalized.isValid) {
      return res.status(400).json({
        status: 'error',
        message: normalized.error || 'Invalid phone number format',
      });
    }

    if (isUsingSupabase()) {
      const matched = await supabaseService.findUserByPhone(normalized.e164);
      return res.status(200).json({
        status: 'success',
        data: {
          phone: normalized.e164,
          formatted: normalized.formatted,
          isRegistered: Boolean(matched),
          user: matched
            ? {
                id: matched.id || matched._id,
                name: matched.name,
                avatar: matched.avatar,
                about: matched.about,
                status: matched.status,
                phone: matched.phone,
              }
            : null,
        },
      });
    }

    const matched = await User.findOne({ phone: normalized.e164 })
      .select('name avatar status about role department phone lastSeen')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        phone: normalized.e164,
        formatted: normalized.formatted,
        isRegistered: Boolean(matched),
        user: matched
          ? {
              id: matched._id.toString(),
              name: matched.name,
              avatar: matched.avatar,
              about: matched.about,
              status: matched.status,
              phone: matched.phone,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * -------------------------------------------------------------
 * POST /api/contacts
 * -------------------------------------------------------------
 * Add a new contact by name, country code, and phone number.
 * - Validates format via libphonenumber
 * - Blocks adding own phone number
 * - Blocks duplicate contact for this user
 * - Automatically checks if registered on app
 */
export const addContact = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, phone, countryCode = 'IN' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Contact name is required',
      });
    }

    // 1. Validate phone number format
    const normalized = normalizePhone(phone, countryCode);
    if (!normalized.isValid) {
      return res.status(400).json({
        status: 'error',
        message: normalized.error || 'Please enter a valid phone number with country code',
      });
    }

    // 2. Block user from adding their own phone number
    if (req.user.phone && req.user.phone === normalized.e164) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot add your own phone number as a contact',
      });
    }

    if (isUsingSupabase()) {
      const result = await supabaseService.addContact(userId, {
        name: name.trim(),
        phone: normalized.e164,
        formattedPhone: normalized.formatted,
      });

      return res.status(201).json({
        status: 'success',
        message: result.isRegistered
          ? `${name.trim()} is on uandi! You can message them now.`
          : `${name.trim()} was saved. You can invite them to join uandi.`,
        data: { contact: result },
      });
    }

    // 3. Block duplicates in MongoDB
    const existing = await Contact.findOne({ userId, phone: normalized.e164 });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: `A contact with phone number ${normalized.formatted || normalized.e164} already exists in your contacts`,
      });
    }

    // 4. Check if registered user exists
    const matchedUser = await User.findOne({ phone: normalized.e164 })
      .select('name avatar status about role department phone lastSeen')
      .lean();

    const newContact = await Contact.create({
      userId,
      name: name.trim(),
      phone: normalized.e164,
      contactUser: matchedUser ? matchedUser._id : null,
      isRegistered: Boolean(matchedUser),
    });

    const contactObj = {
      ...newContact.toObject(),
      id: newContact._id.toString(),
      formattedPhone: normalized.formatted,
      contactUser: matchedUser
        ? {
            id: matchedUser._id.toString(),
            name: matchedUser.name,
            avatar: matchedUser.avatar,
            about: matchedUser.about,
            status: matchedUser.status,
            phone: matchedUser.phone,
          }
        : null,
    };

    return res.status(201).json({
      status: 'success',
      message: matchedUser
        ? `${name.trim()} is on uandi! You can message them now.`
        : `${name.trim()} was saved. You can invite them to join uandi.`,
      data: { contact: contactObj },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'This contact number is already in your contacts list',
      });
    }
    next(err);
  }
};

/**
 * -------------------------------------------------------------
 * PUT /api/contacts/:id
 * -------------------------------------------------------------
 * Update a contact's display name or phone number.
 */
export const updateContact = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { name, phone, countryCode = 'IN' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Contact name is required',
      });
    }

    let normalized = null;
    if (phone) {
      normalized = normalizePhone(phone, countryCode);
      if (!normalized.isValid) {
        return res.status(400).json({
          status: 'error',
          message: normalized.error || 'Invalid phone number format',
        });
      }
    }

    if (isUsingSupabase()) {
      const updated = await supabaseService.updateContact(userId, id, {
        name: name.trim(),
        phone: normalized ? normalized.e164 : undefined,
      });

      return res.status(200).json({
        status: 'success',
        message: 'Contact updated successfully',
        data: { contact: updated },
      });
    }

    const contact = await Contact.findOne({ _id: id, userId });
    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Contact not found',
      });
    }

    contact.name = name.trim();
    if (normalized) {
      contact.phone = normalized.e164;
      const matched = await User.findOne({ phone: normalized.e164 });
      contact.contactUser = matched ? matched._id : null;
      contact.isRegistered = Boolean(matched);
    }

    await contact.save();

    return res.status(200).json({
      status: 'success',
      message: 'Contact updated successfully',
      data: { contact: { ...contact.toObject(), id: contact._id.toString() } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * -------------------------------------------------------------
 * DELETE /api/contacts/:id
 * -------------------------------------------------------------
 * Delete a contact from the user's contact book.
 */
export const deleteContact = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (isUsingSupabase()) {
      await supabaseService.deleteContact(userId, id);
      return res.status(200).json({
        status: 'success',
        message: 'Contact deleted successfully',
      });
    }

    const deleted = await Contact.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Contact not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Contact deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * -------------------------------------------------------------
 * PATCH /api/contacts/:id/favorite
 * -------------------------------------------------------------
 */
export const toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (isUsingSupabase()) {
      const updated = await supabaseService.toggleFavoriteContact(userId, id);
      return res.status(200).json({
        status: 'success',
        data: { contact: updated },
      });
    }

    const contact = await Contact.findOne({ _id: id, userId });
    if (!contact) {
      return res.status(404).json({ status: 'error', message: 'Contact not found' });
    }

    contact.isFavorite = !contact.isFavorite;
    await contact.save();

    return res.status(200).json({
      status: 'success',
      data: { contact: { ...contact.toObject(), id: contact._id.toString() } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * -------------------------------------------------------------
 * PATCH /api/contacts/:id/block
 * -------------------------------------------------------------
 */
export const toggleBlock = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (isUsingSupabase()) {
      const updated = await supabaseService.toggleBlockContact(userId, id);
      return res.status(200).json({
        status: 'success',
        data: { contact: updated },
      });
    }

    const contact = await Contact.findOne({ _id: id, userId });
    if (!contact) {
      return res.status(404).json({ status: 'error', message: 'Contact not found' });
    }

    contact.isBlocked = !contact.isBlocked;
    await contact.save();

    return res.status(200).json({
      status: 'success',
      data: { contact: { ...contact.toObject(), id: contact._id.toString() } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * -------------------------------------------------------------
 * POST /api/contacts/sync
 * -------------------------------------------------------------
 * Sync an array of device contacts [{ name, phone }].
 * Validates, normalizes, deduplicates, and matches against registered users.
 */
export const syncContacts = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { contacts = [] } = req.body;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({
        status: 'error',
        message: 'Contacts array is required',
      });
    }

    if (isUsingSupabase()) {
      const results = await supabaseService.syncContacts(userId, contacts);
      return res.status(200).json({
        status: 'success',
        message: `Synced ${results.length} contacts successfully`,
        data: { contacts: results },
      });
    }

    // Process and normalize raw phone inputs
    const validItems = [];
    const seenPhones = new Set();

    contacts.forEach((item) => {
      if (!item || !item.phone || !item.name) return;
      const normalized = normalizePhone(item.phone, 'IN');
      if (!normalized.isValid) return;
      if (req.user.phone && req.user.phone === normalized.e164) return; // Skip own number
      if (seenPhones.has(normalized.e164)) return; // Skip in-batch duplicates

      seenPhones.add(normalized.e164);
      validItems.push({
        name: item.name.trim(),
        phone: normalized.e164,
        formattedPhone: normalized.formatted,
      });
    });

    // Find all registered users matching these phones
    const matchedUsers = await User.find({ phone: { $in: Array.from(seenPhones) } })
      .select('name avatar status about role department phone lastSeen')
      .lean();

    const userMap = new Map();
    matchedUsers.forEach((u) => {
      if (u.phone) userMap.set(u.phone, u);
    });

    const syncedResults = [];
    for (const item of validItems) {
      const matched = userMap.get(item.phone) || null;
      const updated = await Contact.findOneAndUpdate(
        { userId, phone: item.phone },
        {
          $set: {
            name: item.name,
            phone: item.phone,
            contactUser: matched ? matched._id : null,
            isRegistered: Boolean(matched),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      syncedResults.push({
        ...updated,
        id: updated._id.toString(),
        formattedPhone: item.formattedPhone,
        contactUser: matched
          ? {
              id: matched._id.toString(),
              name: matched.name,
              avatar: matched.avatar,
              about: matched.about,
              status: matched.status,
              phone: matched.phone,
            }
          : null,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Synced ${syncedResults.length} contacts successfully`,
      data: {
        totalSynced: syncedResults.length,
        contacts: syncedResults,
      },
    });
  } catch (err) {
    next(err);
  }
};

