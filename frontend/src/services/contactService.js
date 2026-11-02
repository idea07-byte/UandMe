import api from './api';
import authService from './authService';
import { normalizePhone } from '../utils/phoneUtils';

const CONTACTS_CACHE_KEY = 'uandi_contacts_cache';

const getLocalCache = (userId) => {
  try {
    const raw = localStorage.getItem(`${CONTACTS_CACHE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocalCache = (userId, contacts) => {
  try {
    localStorage.setItem(`${CONTACTS_CACHE_KEY}_${userId}`, JSON.stringify(contacts));
  } catch {}
};

export const contactService = {
  /**
   * Fetch user's contacts list with local cache and search/filter.
   */
  async getContacts({ search = '', filter = 'all' } = {}) {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || 'guest';

    try {
      const response = await api.get('/contacts', {
        params: { search, filter },
      });

      if (response && response.data && Array.isArray(response.data.contacts)) {
        setLocalCache(userId, response.data.contacts);
        return response.data.contacts;
      }
    } catch (err) {
      console.warn('[contactService] GET /contacts failed, using local cache:', err.message);
    }

    // Fallback to local cache
    let cached = getLocalCache(userId);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      cached = cached.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.contactUser?.name && c.contactUser.name.toLowerCase().includes(q))
      );
    }

    if (filter === 'favorites') cached = cached.filter((c) => c.isFavorite);
    if (filter === 'blocked') cached = cached.filter((c) => c.isBlocked);
    if (filter === 'registered') cached = cached.filter((c) => c.isRegistered);
    if (filter === 'unregistered') cached = cached.filter((c) => !c.isRegistered);

    return cached.sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Check if a phone number is registered in the application.
   */
  async checkPhone(phone, countryCode = '+91') {
    const normalized = normalizePhone(phone, countryCode.replace('+', ''));
    if (!normalized.isValid) {
      return { isValid: false, isRegistered: false, error: normalized.error };
    }

    try {
      const response = await api.post('/contacts/check-phone', {
        phone: normalized.e164,
      });
      return {
        isValid: true,
        ...response.data,
      };
    } catch (err) {
      return {
        isValid: true,
        phone: normalized.e164,
        formatted: normalized.formatted,
        isRegistered: false,
      };
    }
  },

  /**
   * Add a new contact by name, phone, and country code.
   */
  async addContact({ name, phone, countryCode = '+91' }) {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || 'guest';
    const normalized = normalizePhone(phone, countryCode.replace('+', ''));

    if (!normalized.isValid) {
      throw new Error(normalized.error || 'Invalid phone number format');
    }

    // Check if adding own number
    if (currentUser?.phone && currentUser.phone === normalized.e164) {
      throw new Error('You cannot add your own phone number as a contact');
    }

    try {
      const response = await api.post('/contacts', {
        name,
        phone: normalized.e164,
        countryCode: countryCode.replace('+', ''),
      });

      const newContact = response.data?.contact;
      if (newContact) {
        const cached = getLocalCache(userId);
        const updated = [newContact, ...cached.filter((c) => c.id !== newContact.id)];
        setLocalCache(userId, updated);
        return newContact;
      }
    } catch (err) {
      if (err.status === 409 || err.message?.includes('already exists')) {
        throw new Error(err.message || 'This contact number is already in your contacts');
      }
      console.warn('[contactService] POST /contacts fallback:', err.message);
    }

    // Local in-memory / cache fallback
    const newContact = {
      id: `cnt_${Date.now()}`,
      userId,
      name: name.trim(),
      phone: normalized.e164,
      formattedPhone: normalized.formatted,
      isRegistered: false,
      contactUser: null,
      isFavorite: false,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    const cached = getLocalCache(userId);
    const updated = [newContact, ...cached.filter((c) => c.phone !== newContact.phone)];
    setLocalCache(userId, updated);
    return newContact;
  },

  /**
   * Update contact details.
   */
  async updateContact(id, { name, phone, countryCode = '+91' }) {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || 'guest';

    let normalizedPhone = undefined;
    if (phone) {
      const parsed = normalizePhone(phone, countryCode.replace('+', ''));
      if (parsed.isValid) normalizedPhone = parsed.e164;
    }

    try {
      const response = await api.put(`/contacts/${id}`, {
        name,
        phone: normalizedPhone,
      });

      const updated = response.data?.contact;
      if (updated) {
        const cached = getLocalCache(userId).map((c) => (c.id === id ? updated : c));
        setLocalCache(userId, cached);
        return updated;
      }
    } catch (err) {
      console.warn('[contactService] PUT /contacts/:id failed:', err.message);
    }

    const cached = getLocalCache(userId).map((c) => {
      if (c.id === id) {
        return {
          ...c,
          name: name || c.name,
          phone: normalizedPhone || c.phone,
        };
      }
      return c;
    });
    setLocalCache(userId, cached);
    return cached.find((c) => c.id === id);
  },

  /**
   * Delete contact.
   */
  async deleteContact(id) {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || 'guest';

    try {
      await api.delete(`/contacts/${id}`);
    } catch (err) {
      console.warn('[contactService] DELETE /contacts/:id failed:', err.message);
    }

    const cached = getLocalCache(userId).filter((c) => c.id !== id);
    setLocalCache(userId, cached);
    return true;
  },

  /**
   * Toggle favorite.
   */
  async toggleFavorite(id) {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || 'guest';

    try {
      const response = await api.patch(`/contacts/${id}/favorite`);
      const updated = response.data?.contact;
      if (updated) {
        const cached = getLocalCache(userId).map((c) => (c.id === id ? updated : c));
        setLocalCache(userId, cached);
        return updated;
      }
    } catch {}

    const cached = getLocalCache(userId).map((c) => {
      if (c.id === id) return { ...c, isFavorite: !c.isFavorite };
      return c;
    });
    setLocalCache(userId, cached);
    return cached.find((c) => c.id === id);
  },

  /**
   * Toggle block.
   */
  async toggleBlock(id) {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || 'guest';

    try {
      const response = await api.patch(`/contacts/${id}/block`);
      const updated = response.data?.contact;
      if (updated) {
        const cached = getLocalCache(userId).map((c) => (c.id === id ? updated : c));
        setLocalCache(userId, cached);
        return updated;
      }
    } catch {}

    const cached = getLocalCache(userId).map((c) => {
      if (c.id === id) return { ...c, isBlocked: !c.isBlocked };
      return c;
    });
    setLocalCache(userId, cached);
    return cached.find((c) => c.id === id);
  },

  /**
   * Sync an array of device contacts [{ name, phone }].
   */
  async syncDeviceContacts(contactsList) {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?._id || 'guest';

    try {
      const response = await api.post('/contacts/sync', {
        contacts: contactsList,
      });

      if (response.data && Array.isArray(response.data.contacts)) {
        setLocalCache(userId, response.data.contacts);
        return response.data;
      }
    } catch (err) {
      console.warn('[contactService] POST /contacts/sync failed:', err.message);
    }

    return { totalSynced: contactsList.length, contacts: contactsList };
  },
};

export default contactService;

