import api from './api';
import authService from './authService';
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_CONTACTS,
} from './mockChatData';

// Fallback in-memory stores for offline dev sandbox
let fallbackConversations = [...MOCK_CONVERSATIONS];
let fallbackMessages = { ...MOCK_MESSAGES };
let fallbackContacts = [...MOCK_CONTACTS];

// Local preferences storage key helper
const getPrefKey = (key) => {
  const user = authService.getCurrentUser();
  const userId = user?.id || user?._id || 'guest';
  return `pulsechat_${key}_${userId}`;
};

const getStoredSet = (key) => {
  try {
    const raw = localStorage.getItem(getPrefKey(key));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const saveStoredSet = (key, set) => {
  try {
    localStorage.setItem(getPrefKey(key), JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to persist preference:', e);
  }
};

/**
 * Normalizes a backend Chat document into standard frontend Conversation schema.
 * @param {Object} chat - MongoDB Chat document
 * @param {string} currentUserId - Authenticated user ID
 * @returns {Object}
 */
export function normalizeConversation(chat, currentUserId) {
  if (!chat) return null;

  const id = chat._id || chat.id;
  const isGroup = Boolean(chat.isGroupChat);
  const participants = Array.isArray(chat.participants) ? chat.participants : [];

  // Identify the other participant in 1-on-1 direct chat
  const otherParticipant =
    participants.find((p) => {
      const pid = typeof p === 'object' ? p._id || p.id : p;
      return pid !== currentUserId;
    }) ||
    participants[0] ||
    {};

  const otherUser = typeof otherParticipant === 'object' ? otherParticipant : {};
  const partnerName = otherUser.username || otherUser.name || 'Contact';

  // Read client-side persistence flags for pins, mutes, favorites, archives
  const pinnedSet = getStoredSet('pinned_chats');
  const mutedSet = getStoredSet('muted_chats');
  const favSet = getStoredSet('favorite_chats');
  const archivedSet = getStoredSet('archived_chats');
  const blockedSet = getStoredSet('blocked_contacts');

  // Format last message
  let lastMessage = null;
  if (chat.latestMessage) {
    const lm = chat.latestMessage;
    const sender = typeof lm.sender === 'object' ? lm.sender : {};
    lastMessage = {
      text: lm.content || (lm.mediaUrl ? '📎 Attachment' : ''),
      timestamp: lm.createdAt || lm.timestamp || new Date().toISOString(),
      senderId: sender._id || sender.id || lm.sender,
      senderName: sender.username || sender.name || '',
      status: lm.status || 'sent',
    };
  }

  return {
    id,
    _id: id,
    name: isGroup ? chat.chatName || 'Group Chat' : partnerName,
    avatar: isGroup
      ? null
      : otherUser.avatar ||
        'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    status: otherUser.isOnline ? 'online' : 'offline',
    lastSeen: otherUser.lastSeen
      ? new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Offline',
    about: otherUser.about || 'Available on PulseChat',
    email: otherUser.email || `${partnerName}@pulsechat.local`,
    isGroup,
    memberCount: isGroup ? participants.length : 2,
    participants,
    partnerId: otherUser._id || otherUser.id || null,
    lastMessage,
    unreadCount: 0,
    pinned: pinnedSet.has(id),
    isMuted: mutedSet.has(id),
    isFavorite: favSet.has(id),
    isArchived: archivedSet.has(id),
    isBlocked: blockedSet.has(otherUser._id || otherUser.id || id),
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt || chat.createdAt,
  };
}

/**
 * Normalizes a backend Message document into standard frontend Message schema.
 * @param {Object} msg - MongoDB Message document
 * @returns {Object}
 */
export function normalizeMessage(msg) {
  if (!msg) return null;

  const id = msg._id || msg.id;
  const conversationId =
    typeof msg.chat === 'object' ? msg.chat?._id || msg.chat?.id : msg.chat;
  const senderObj = typeof msg.sender === 'object' ? msg.sender : {};
  const senderId = senderObj._id || senderObj.id || msg.sender;
  const senderName = senderObj.username || senderObj.name || 'User';

  const attachments = [];
  if (msg.mediaUrl) {
    attachments.push({
      type: msg.messageType || 'image',
      name: 'Media Attachment',
      size: 'Cloud File',
      url: msg.mediaUrl,
    });
  }

  return {
    id,
    _id: id,
    conversationId,
    senderId,
    senderName,
    text: msg.content || '',
    attachments,
    timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
    status: msg.status || 'sent',
    isOptimistic: false,
    isMock: false,
  };
}

/**
 * Centralized Chat and Contacts Service.
 * Connects directly to real Express + MongoDB REST API endpoints (/api/chats, /api/messages, /api/auth/users).
 */
export const chatService = {
  /**
   * Fetch conversations from Express backend (/api/chats).
   * @param {Object} params
   * @param {'all'|'unread'|'favorites'} [params.filter='all']
   * @param {string} [params.search='']
   * @param {'chats'|'contacts'|'archived'} [params.view='chats']
   * @returns {Promise<Array>}
   */
  async getConversations({ filter = 'all', search = '', view = 'chats' } = {}) {
    const currentUser = authService.getCurrentUser();
    const currentUserId = currentUser?.id || currentUser?._id;

    let conversations = [];

    // 1. Attempt real backend REST call
    try {
      const response = await api.get('/chats');
      if (Array.isArray(response)) {
        conversations = response.map((c) => normalizeConversation(c, currentUserId));
      }
    } catch (err) {
      console.warn('[chatService] Backend /chats unreachable, using local fallback:', err.message);
      conversations = [...fallbackConversations];
    }

    // 2. Category view filter ('chats' vs 'archived')
    let list = conversations.filter((c) => {
      if (view === 'archived') {
        return Boolean(c.isArchived);
      }
      if (c.isArchived) return false;
      if (filter === 'unread' && (c.unreadCount || 0) === 0) return false;
      if (filter === 'favorites' && !c.isFavorite) return false;
      return true;
    });

    // 3. Search query filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const msgMatch = c.lastMessage?.text?.toLowerCase().includes(q);
        const emailMatch = c.email?.toLowerCase().includes(q);
        return nameMatch || msgMatch || emailMatch;
      });
    }

    // 4. Sort: Pinned first, then latest timestamp descending
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = new Date(a.lastMessage?.timestamp || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessage?.timestamp || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  },

  /**
   * Fetch conversation history from Express backend (/api/messages/:chatId).
   * @param {string} conversationId
   * @returns {Promise<Array>}
   */
  async getMessages(conversationId) {
    if (!conversationId) return [];

    try {
      const response = await api.get(`/messages/${conversationId}`);
      if (Array.isArray(response)) {
        return response.map(normalizeMessage);
      }
    } catch (err) {
      console.warn(`[chatService] Backend /messages/${conversationId} error:`, err.message);
    }

    return fallbackMessages[conversationId] || [];
  },

  /**
   * Send a new message via Express REST backend (/api/messages).
   * @param {Object} params
   * @param {string} params.conversationId
   * @param {string} params.text
   * @param {Array} [params.attachments]
   * @returns {Promise<Object>}
   */
  async sendMessage({ conversationId, text, attachments = [] }) {
    if (!conversationId) throw new Error('conversationId is required');

    try {
      const response = await api.post('/messages', {
        chatId: conversationId,
        content: text.trim(),
      });

      if (response && response._id) {
        return normalizeMessage(response);
      }
    } catch (err) {
      console.warn('[chatService] POST /messages failed:', err.message);
      throw err;
    }

    // Local fallback creation
    const fallbackMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      conversationId,
      senderId: authService.getCurrentUser()?.id || 'usr_me_1',
      senderName: authService.getCurrentUser()?.name || 'You',
      text: text.trim(),
      attachments,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    if (!fallbackMessages[conversationId]) {
      fallbackMessages[conversationId] = [];
    }
    fallbackMessages[conversationId].push(fallbackMsg);

    return fallbackMsg;
  },

  /**
   * Access or create a 1-on-1 direct conversation with a contact (/api/chats).
   * @param {Object} contact - Selected contact object
   * @returns {Promise<Object>} Normalized conversation object
   */
  async createOrGetConversation(contact) {
    const targetUserId = contact.partnerId || contact.id || contact._id;
    const currentUser = authService.getCurrentUser();
    const currentUserId = currentUser?.id || currentUser?._id;

    if (!targetUserId) {
      throw new Error('Contact ID missing');
    }

    try {
      const response = await api.post('/chats', {
        userId: targetUserId,
      });

      if (response && response._id) {
        return normalizeConversation(response, currentUserId);
      }
    } catch (err) {
      console.warn('[chatService] POST /chats failed, using local fallback:', err.message);
    }

    // Fallback in-memory creation
    const existing = fallbackConversations.find(
      (c) => c.partnerId === targetUserId || c.id === contact.id
    );
    if (existing) return existing;

    const newChat = {
      id: `conv_${Date.now()}`,
      _id: `conv_${Date.now()}`,
      name: contact.name || contact.username || 'Contact',
      avatar: contact.avatar || null,
      status: contact.status || 'offline',
      lastSeen: contact.lastSeen || 'Offline',
      about: contact.about || 'Available on PulseChat',
      email: contact.email || `${contact.name}@pulsechat.local`,
      isGroup: false,
      memberCount: 2,
      partnerId: targetUserId,
      participants: [
        { _id: currentUserId, username: currentUser?.name },
        { _id: targetUserId, username: contact.name },
      ],
      lastMessage: null,
      unreadCount: 0,
      pinned: false,
      isMuted: false,
      isFavorite: false,
      isArchived: false,
      isBlocked: false,
    };

    fallbackConversations.unshift(newChat);
    return newChat;
  },

  /**
   * Fetch registered users as campus contacts (/api/auth/users).
   * @param {Object} [params]
   * @param {string} [params.search='']
   * @param {'all'|'online'|'offline'} [params.status='all']
   * @returns {Promise<Array>}
   */
  async getContacts({ search = '', status = 'all' } = {}) {
    let contacts = [];

    try {
      const users = await authService.getUsers();
      if (Array.isArray(users) && users.length > 0) {
        contacts = users.map((u) => ({
          id: u.id || u._id,
          _id: u.id || u._id,
          name: u.username || u.name,
          username: u.username,
          handle: `@${u.username || u.name}`,
          email: u.email || `${u.username}@pulsechat.local`,
          avatar: u.avatar,
          about: u.about || 'Available on PulseChat',
          status: u.isOnline ? 'online' : 'offline',
          lastSeen: u.lastSeen
            ? new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Offline',
          role: 'Campus Member',
          department: 'Computer Science',
          publicKey: u.publicKey,
        }));
      }
    } catch (err) {
      console.warn('[chatService] Failed to load contacts from /api/auth/users:', err.message);
    }

    if (contacts.length === 0) {
      contacts = [...fallbackContacts];
    }

    // Status filter
    if (status === 'online') {
      contacts = contacts.filter((c) => c.status === 'online' || c.status === 'away');
    } else if (status === 'offline') {
      contacts = contacts.filter((c) => c.status === 'offline' || c.status === 'busy');
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      contacts = contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.handle?.toLowerCase().includes(q) ||
          c.about?.toLowerCase().includes(q)
      );
    }

    return contacts.sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Fetch single contact by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getContactById(id) {
    const contacts = await this.getContacts();
    return contacts.find((c) => c.id === id || c._id === id) || null;
  },

  /**
   * Search registered users directory (/api/auth/users).
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchRegisteredUsers(query = '') {
    const contacts = await this.getContacts();
    if (!query.trim()) {
      return contacts.slice(0, 10);
    }
    const q = query.toLowerCase().trim();
    return contacts.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.handle?.toLowerCase().includes(q)
    );
  },

  /**
   * Toggle Pin conversation.
   */
  async togglePin(id) {
    const set = getStoredSet('pinned_chats');
    const newState = !set.has(id);
    if (newState) set.add(id);
    else set.delete(id);
    saveStoredSet('pinned_chats', set);
    return newState;
  },

  /**
   * Toggle Mute conversation.
   */
  async toggleMute(id) {
    const set = getStoredSet('muted_chats');
    const newState = !set.has(id);
    if (newState) set.add(id);
    else set.delete(id);
    saveStoredSet('muted_chats', set);
    return newState;
  },

  /**
   * Toggle Favorite conversation.
   */
  async toggleFavorite(id) {
    const set = getStoredSet('favorite_chats');
    const newState = !set.has(id);
    if (newState) set.add(id);
    else set.delete(id);
    saveStoredSet('favorite_chats', set);
    return newState;
  },

  /**
   * Toggle Archive conversation.
   */
  async toggleArchive(id) {
    const set = getStoredSet('archived_chats');
    const newState = !set.has(id);
    if (newState) set.add(id);
    else set.delete(id);
    saveStoredSet('archived_chats', set);
    return newState;
  },

  /**
   * Toggle Block contact.
   */
  async toggleBlockContact(contactId) {
    const set = getStoredSet('blocked_contacts');
    const newState = !set.has(contactId);
    if (newState) set.add(contactId);
    else set.delete(contactId);
    saveStoredSet('blocked_contacts', set);
    return newState;
  },

  /**
   * Mark conversation as read locally.
   */
  async markAsRead(conversationId) {
    if (fallbackMessages[conversationId]) {
      fallbackMessages[conversationId] = fallbackMessages[conversationId].map((m) =>
        m.status !== 'read' ? { ...m, status: 'read' } : m
      );
    }
  },

  /**
   * Mark conversation as unread locally.
   */
  async markAsUnread(_conversationId) {
    // Local visual unread toggle
  },

  /**
   * Clear local message stream.
   */
  async clearMessages(conversationId) {
    delete fallbackMessages[conversationId];
  },

  /**
   * Delete conversation.
   */
  async deleteConversation(conversationId) {
    fallbackConversations = fallbackConversations.filter((c) => c.id !== conversationId);
    delete fallbackMessages[conversationId];
  },
};

export default chatService;
