import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

// In-memory contacts cache (userId -> Map(phone -> contactObj))
const memoryContacts = new Map();

/**
 * Normalizes a database row from Supabase public.users into a standard User object
 * compatible with both Mongoose and standard frontend expectations.
 */
export function formatUser(raw) {
  if (!raw) return null;
  const id = raw.id || raw._id;
  const username = raw.username || (raw.email ? raw.email.split('@')[0] : 'user');
  const name = raw.name || username || 'User';

  return {
    _id: id,
    id: id,
    name,
    username,
    email: raw.email || '',
    avatar: raw.avatar || '',
    about: raw.about || raw.status_message || 'Available on uandi 🚀',
    bio: raw.about || raw.status_message || 'Available on uandi 🚀',
    role: raw.role || 'student',
    department: raw.department || 'Computer Science',
    status: raw.status || 'offline',
    phone: raw.phone || '',
    isOnline: raw.status === 'online',
    lastSeen: raw.last_seen || raw.lastSeen || new Date().toISOString(),
    password: raw.password_hash || raw.password,
    password_hash: raw.password_hash || raw.password,
    comparePassword: async function (candidate) {
      const hash = this.password || this.password_hash;
      if (!hash) return false;
      return bcrypt.compare(candidate, hash);
    },
    toJSON: function () {
      const copy = { ...this };
      delete copy.password;
      delete copy.password_hash;
      delete copy.comparePassword;
      delete copy.toJSON;
      return copy;
    },
    toObject: function () {
      return this.toJSON();
    },
  };
}export const supabaseService = {
  // -------------------------------------------------------------
  // USER & AUTH OPERATIONS
  // -------------------------------------------------------------

  async findUserByEmail(email) {
    if (!supabaseAdmin || !email) return null;
    const cleanEmail = email.trim().toLowerCase();

    // Query by email
    const { data: byEmail, error: emailErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (byEmail) return formatUser(byEmail);

    // Fallback: Query by username
    const { data: byUsername } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('username', cleanEmail)
      .maybeSingle();

    if (byUsername) return formatUser(byUsername);
    return null;
  },

  async findUserById(id) {
    if (!supabaseAdmin || !id) return null;
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id.toString())
      .maybeSingle();

    if (error || !data) return null;
    return formatUser(data);
  },

  async findUserByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = phone.trim();

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (data) return formatUser(data);
      } catch (err) {
        console.warn('[supabaseService] findUserByPhone query failed:', err.message);
      }
    }

    // Check memory contacts for registered users
    for (const userMap of memoryContacts.values()) {
      for (const c of userMap.values()) {
        if (c.contactUser && c.contactUser.phone === cleanPhone) {
          return c.contactUser;
        }
      }
    }
    return null;
  },

  async findUsersByPhones(phones) {
    if (!Array.isArray(phones) || phones.length === 0) return [];
    const validPhones = phones.filter(Boolean);
    if (validPhones.length === 0) return [];

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .in('phone', validPhones);

        if (data && data.length > 0) {
          return data.map(formatUser);
        }
      } catch (err) {
        console.warn('[supabaseService] findUsersByPhones query failed:', err.message);
      }
    }
    return [];
  },


  async createUser({ name, email, password, username, avatar, role, department, about, phone }) {
    if (!supabaseAdmin) throw new Error('Supabase client unavailable');
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    const payload = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      password_hash: hashedPassword,
      avatar: avatar || '',
      role: role || 'student',
      department: department || 'Computer Science',
      status: 'online',
      about: about || 'Available on uandi 🚀',
      phone: phone || null,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create account in Supabase: ${error.message}`);
    }

    return formatUser(data);
  },

  async updateUser(id, updateFields) {
    if (!supabaseAdmin || !id) return null;
    const mapped = {
      updated_at: new Date().toISOString(),
    };

    if (updateFields.name !== undefined) mapped.name = updateFields.name;
    if (updateFields.avatar !== undefined) mapped.avatar = updateFields.avatar;
    if (updateFields.about !== undefined) mapped.about = updateFields.about;
    if (updateFields.status_message !== undefined) mapped.status_message = updateFields.status_message;
    if (updateFields.status !== undefined) mapped.status = updateFields.status;
    if (updateFields.phone !== undefined) mapped.phone = updateFields.phone;
    if (updateFields.role !== undefined) mapped.role = updateFields.role;
    if (updateFields.department !== undefined) mapped.department = updateFields.department;
    if (updateFields.lastSeen !== undefined) mapped.last_seen = updateFields.lastSeen;
    if (updateFields.password !== undefined) {
      mapped.password_hash = await bcrypt.hash(updateFields.password, 10);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(mapped)
      .eq('id', id.toString())
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return formatUser(data);
  },

  async listUsers(currentUserId, { page = 1, limit = 50, search = '', status = '', department = '' }) {
    if (!supabaseAdmin) return { users: [], total: 0 };
    const skip = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    if (currentUserId) {
      query = query.neq('id', currentUserId.toString());
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (department) {
      query = query.ilike('department', `%${department}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
    }

    query = query.order('name', { ascending: true }).range(skip, skip + limit - 1);

    const { data, count, error } = await query;
    if (error || !data) return { users: [], total: 0 };

    return {
      users: data.map(formatUser),
      total: count || data.length,
    };
  },

  // -------------------------------------------------------------
  // CONVERSATION & CHAT OPERATIONS
  // -------------------------------------------------------------

  async getUserConversations(currentUserId, { filter = 'all', search = '', view = 'chats' } = {}) {
    if (!supabaseAdmin || !currentUserId) return [];
    const userIdStr = currentUserId.toString();

    // 1. Fetch participant memberships for current user
    let partQuery = supabaseAdmin
      .from('conversation_participants')
      .select('*')
      .eq('user_id', userIdStr);

    if (view === 'archived') {
      partQuery = partQuery.eq('is_archived', true);
    } else {
      partQuery = partQuery.eq('is_archived', false);
    }

    const { data: userParts, error: partErr } = await partQuery;
    if (partErr || !userParts || userParts.length === 0) return [];

    const convIds = userParts.map((p) => p.conversation_id);
    const userPartMap = new Map(userParts.map((p) => [p.conversation_id, p]));

    // 2. Fetch conversations
    const { data: convs, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convErr || !convs) return [];

    // 3. Fetch all participants for these conversations
    const { data: allParts } = await supabaseAdmin
      .from('conversation_participants')
      .select('*')
      .in('conversation_id', convIds);

    const participantUserIds = [...new Set((allParts || []).map((p) => p.user_id))];

    // 4. Fetch all user profiles for participants
    const { data: userProfiles } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar, about, role, department, status, last_seen')
      .in('id', participantUserIds);

    const userMap = new Map((userProfiles || []).map((u) => [u.id, formatUser(u)]));

    // Group participants by conversation
    const convParticipantsMap = new Map();
    for (const part of allParts || []) {
      if (!convParticipantsMap.has(part.conversation_id)) {
        convParticipantsMap.set(part.conversation_id, []);
      }
      const u = userMap.get(part.user_id);
      if (u) {
        convParticipantsMap.get(part.conversation_id).push(u);
      }
    }

    // 5. Build full conversation objects
    let result = convs.map((c) => {
      const myPart = userPartMap.get(c.id) || {};
      const participants = convParticipantsMap.get(c.id) || [];
      const senderProfile = c.last_message_sender_id ? userMap.get(c.last_message_sender_id) : null;

      // For direct 1-on-1 chats, fallback name/avatar to the other participant
      let displayName = c.name;
      let displayAvatar = c.avatar;
      if (!c.is_group) {
        const otherUser = participants.find((p) => p.id !== userIdStr) || participants[0];
        if (otherUser) {
          displayName = displayName || otherUser.name;
          displayAvatar = displayAvatar || otherUser.avatar;
        }
      }

      return {
        _id: c.id,
        id: c.id,
        name: displayName || 'Chat',
        avatar: displayAvatar || '',
        isGroup: Boolean(c.is_group),
        is_group: Boolean(c.is_group),
        admin: c.admin_id ? userMap.get(c.admin_id) || { _id: c.admin_id, id: c.admin_id } : null,
        participants,
        lastMessage: c.last_message_text
          ? {
              text: c.last_message_text,
              sender: senderProfile || { _id: c.last_message_sender_id, id: c.last_message_sender_id },
              timestamp: c.last_message_at ? new Date(c.last_message_at) : new Date(c.updated_at),
              status: c.last_message_status || 'sent',
            }
          : null,
        unreadCount: myPart.unread_count || 0,
        pinned: Boolean(myPart.is_pinned),
        isPinned: Boolean(myPart.is_pinned),
        isMuted: Boolean(myPart.is_muted),
        isArchived: Boolean(myPart.is_archived),
        updatedAt: c.updated_at || c.created_at,
        createdAt: c.created_at,
        toObject: function () {
          return this;
        },
      };
    });

    // Apply category filter
    if (filter === 'unread') {
      result = result.filter((c) => c.unreadCount > 0);
    }

    // Apply search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const msgMatch = c.lastMessage?.text?.toLowerCase().includes(q);
        const partMatch = c.participants?.some(
          (p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
        );
        return nameMatch || msgMatch || partMatch;
      });
    }

    // Sort: Pinned first, then latest activity
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : new Date(a.updatedAt).getTime();
      const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });

    return result;
  },

  async getConversationById(conversationId, currentUserId) {
    if (!supabaseAdmin || !conversationId) return null;
    const idStr = conversationId.toString();

    // 1. Fetch conversation
    const { data: conv, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', idStr)
      .maybeSingle();

    if (error || !conv) return null;

    // 2. Fetch participants
    const { data: parts } = await supabaseAdmin
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', idStr);

    const partUserIds = (parts || []).map((p) => p.user_id);
    const { data: profiles } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar, about, role, department, status, last_seen')
      .in('id', partUserIds);

    const participants = (profiles || []).map(formatUser);
    const myPart = (parts || []).find((p) => p.user_id === currentUserId?.toString()) || {};

    let displayName = conv.name;
    let displayAvatar = conv.avatar;
    if (!conv.is_group && currentUserId) {
      const otherUser = participants.find((p) => p.id !== currentUserId.toString()) || participants[0];
      if (otherUser) {
        displayName = displayName || otherUser.name;
        displayAvatar = displayAvatar || otherUser.avatar;
      }
    }

    return {
      _id: conv.id,
      id: conv.id,
      name: displayName || 'Chat',
      avatar: displayAvatar || '',
      isGroup: Boolean(conv.is_group),
      is_group: Boolean(conv.is_group),
      admin: conv.admin_id ? { _id: conv.admin_id, id: conv.admin_id } : null,
      participants,
      lastMessage: conv.last_message_text
        ? {
            text: conv.last_message_text,
            sender: { _id: conv.last_message_sender_id, id: conv.last_message_sender_id },
            timestamp: conv.last_message_at ? new Date(conv.last_message_at) : new Date(conv.updated_at),
            status: conv.last_message_status || 'sent',
          }
        : null,
      unreadCount: myPart.unread_count || 0,
      pinned: Boolean(myPart.is_pinned),
      isPinned: Boolean(myPart.is_pinned),
      isMuted: Boolean(myPart.is_muted),
      isArchived: Boolean(myPart.is_archived),
      updatedAt: conv.updated_at || conv.created_at,
      createdAt: conv.created_at,
      toObject: function () {
        return this;
      },
      save: async function () {
        await supabaseAdmin
          .from('conversations')
          .update({
            name: this.name,
            avatar: this.avatar,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conv.id);
        return this;
      },
    };
  },

  async createOrGetDirectChat(userId, targetUserId) {
    if (!supabaseAdmin) throw new Error('Supabase client unavailable');
    const u1 = userId.toString();
    const u2 = targetUserId.toString();

    // 1. Check if direct chat already exists
    const { data: existingParts } = await supabaseAdmin
      .from('conversation_participants')
      .select('conversation_id')
      .in('user_id', [u1, u2]);

    if (existingParts && existingParts.length > 0) {
      const counts = {};
      for (const p of existingParts) {
        counts[p.conversation_id] = (counts[p.conversation_id] || 0) + 1;
        if (counts[p.conversation_id] === 2) {
          // Verify conversation is not a group
          const { data: conv } = await supabaseAdmin
            .from('conversations')
            .select('*')
            .eq('id', p.conversation_id)
            .eq('is_group', false)
            .maybeSingle();

          if (conv) {
            return await this.getConversationById(conv.id, u1);
          }
        }
      }
    }

    // 2. Create new direct conversation
    const convId = 'conv_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const { data: newConv, error: createErr } = await supabaseAdmin
      .from('conversations')
      .insert({
        id: convId,
        is_group: false,
        name: '',
        avatar: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createErr) throw new Error(createErr.message);

    // Add participants
    await supabaseAdmin.from('conversation_participants').insert([
      { conversation_id: convId, user_id: u1 },
      { conversation_id: convId, user_id: u2 },
    ]);

    return await this.getConversationById(convId, u1);
  },

  async createGroupChat(adminId, { name, avatar = '', participants = [] }) {
    if (!supabaseAdmin) throw new Error('Supabase client unavailable');
    const adminStr = adminId.toString();
    const allMemberIds = [...new Set([adminStr, ...participants.map((p) => p.toString())])];
    const convId = 'conv_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    const { data: newConv, error: createErr } = await supabaseAdmin
      .from('conversations')
      .insert({
        id: convId,
        is_group: true,
        name: name.trim(),
        avatar: avatar || '',
        admin_id: adminStr,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createErr) throw new Error(createErr.message);

    const partInserts = allMemberIds.map((uid) => ({
      conversation_id: convId,
      user_id: uid,
      is_admin: uid === adminStr,
    }));

    await supabaseAdmin.from('conversation_participants').insert(partInserts);
    return await this.getConversationById(convId, adminStr);
  },

  async updateConversationFlags(conversationId, userId, { pinned, isMuted, isArchived, name, avatar }) {
    if (!supabaseAdmin) return null;
    const convId = conversationId.toString();
    const uid = userId.toString();

    const partUpdate = {};
    if (pinned !== undefined) partUpdate.is_pinned = Boolean(pinned);
    if (isMuted !== undefined) partUpdate.is_muted = Boolean(isMuted);
    if (isArchived !== undefined) partUpdate.is_archived = Boolean(isArchived);

    if (Object.keys(partUpdate).length > 0) {
      await supabaseAdmin
        .from('conversation_participants')
        .update(partUpdate)
        .eq('conversation_id', convId)
        .eq('user_id', uid);
    }

    const convUpdate = {};
    if (name !== undefined) convUpdate.name = name.trim();
    if (avatar !== undefined) convUpdate.avatar = avatar.trim();
    if (Object.keys(convUpdate).length > 0) {
      convUpdate.updated_at = new Date().toISOString();
      await supabaseAdmin
        .from('conversations')
        .update(convUpdate)
        .eq('id', convId);
    }

    return await this.getConversationById(convId, uid);
  },

  // -------------------------------------------------------------
  // MESSAGE OPERATIONS
  // -------------------------------------------------------------

  async getMessages(conversationId, { limit = 50, before = null }) {
    if (!supabaseAdmin || !conversationId) return { messages: [], pagination: { hasMore: false } };
    const convId = conversationId.toString();

    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: rows, error } = await query;
    if (error || !rows) return { messages: [], pagination: { hasMore: false } };

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    // Fetch senders
    const senderIds = [...new Set(slice.map((m) => m.sender_id).filter(Boolean))];
    const { data: senders } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar, about, role, department, status')
      .in('id', senderIds);

    const senderMap = new Map((senders || []).map((s) => [s.id, formatUser(s)]));

    const messages = slice.reverse().map((m) => {
      const senderObj = senderMap.get(m.sender_id) || { _id: m.sender_id, id: m.sender_id, name: 'User' };
      return {
        _id: m.id,
        id: m.id,
        conversationId: m.conversation_id,
        sender: senderObj,
        text: m.text || '',
        type: m.type || 'text',
        status: m.status || 'sent',
        isEncrypted: Boolean(m.is_encrypted),
        clientMessageId: m.client_message_id || null,
        attachments: m.attachments || [],
        readBy: m.read_by || [],
        createdAt: new Date(m.created_at),
        updatedAt: m.created_at ? new Date(m.created_at) : new Date(),
      };
    });

    const nextCursor = hasMore && messages.length > 0 ? messages[0].createdAt.toISOString() : null;

    return {
      messages,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };
  },

  async sendMessage({ conversationId, senderId, text = '', attachments = [], clientMessageId = null }) {
    if (!supabaseAdmin) throw new Error('Supabase client unavailable');
    const convId = conversationId.toString();
    const sId = senderId.toString();
    const msgId = 'msg_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const nowIso = new Date().toISOString();

    const newMsg = {
      id: msgId,
      conversation_id: convId,
      sender_id: sId,
      text: (text || '').trim(),
      type: attachments && attachments.length > 0 ? 'image' : 'text',
      status: 'sent',
      attachments: attachments || [],
      client_message_id: clientMessageId ? clientMessageId.toString().slice(0, 100) : null,
      created_at: nowIso,
    };

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert(newMsg)
      .select()
      .single();

    if (error) throw new Error(`Supabase message send failed: ${error.message}`);

    // Update conversation latest message
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_text: newMsg.text || '📎 Attachment',
        last_message_sender_id: sId,
        last_message_status: 'sent',
        last_message_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', convId);

    // Fetch sender profile
    const senderProfile = (await this.findUserById(sId)) || { _id: sId, id: sId, name: 'User' };

    return {
      _id: msgId,
      id: msgId,
      conversationId: convId,
      sender: senderProfile,
      text: newMsg.text,
      type: newMsg.type,
      status: 'sent',
      clientMessageId: newMsg.client_message_id,
      attachments: newMsg.attachments,
      createdAt: new Date(nowIso),
      updatedAt: new Date(nowIso),
    };
  },

  // -------------------------------------------------------------
  // CONTACT BOOK OPERATIONS
  // -------------------------------------------------------------

  async listContacts(userId, { search = '', filter = 'all' } = {}) {
    const uid = userId.toString();
    const userMap = memoryContacts.get(uid) || new Map();
    let contacts = Array.from(userMap.values());

    // Enrich registration status against Supabase users
    const phones = contacts.map((c) => c.phone).filter(Boolean);
    const registeredUsers = await this.findUsersByPhones(phones);
    const registeredPhoneMap = new Map();
    registeredUsers.forEach((u) => {
      if (u.phone) registeredPhoneMap.set(u.phone, u);
    });

    contacts = contacts.map((c) => {
      const matched = registeredPhoneMap.get(c.phone) || null;
      return {
        ...c,
        isRegistered: Boolean(matched),
        contactUser: matched
          ? {
              id: matched.id || matched._id,
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

    if (filter === 'favorites') contacts = contacts.filter((c) => c.isFavorite);
    if (filter === 'blocked') contacts = contacts.filter((c) => c.isBlocked);
    if (filter === 'registered') contacts = contacts.filter((c) => c.isRegistered);
    if (filter === 'unregistered') contacts = contacts.filter((c) => !c.isRegistered);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      contacts = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.contactUser?.name && c.contactUser.name.toLowerCase().includes(q))
      );
    }

    return contacts.sort((a, b) => a.name.localeCompare(b.name));
  },

  async addContact(userId, { name, phone, formattedPhone }) {
    const uid = userId.toString();
    if (!memoryContacts.has(uid)) {
      memoryContacts.set(uid, new Map());
    }
    const userMap = memoryContacts.get(uid);

    if (userMap.has(phone)) {
      const err = new Error(`A contact with phone number ${formattedPhone || phone} already exists`);
      err.status = 409;
      throw err;
    }

    const matchedUser = await this.findUserByPhone(phone);
    const contactId = 'cnt_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const contact = {
      id: contactId,
      _id: contactId,
      userId: uid,
      name: name.trim(),
      phone,
      formattedPhone: formattedPhone || phone,
      isRegistered: Boolean(matchedUser),
      contactUser: matchedUser
        ? {
            id: matchedUser.id || matchedUser._id,
            name: matchedUser.name,
            avatar: matchedUser.avatar,
            about: matchedUser.about,
            status: matchedUser.status,
            phone: matchedUser.phone,
          }
        : null,
      isFavorite: false,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    userMap.set(phone, contact);
    return contact;
  },

  async updateContact(userId, contactId, { name, phone }) {
    const uid = userId.toString();
    const userMap = memoryContacts.get(uid);
    if (!userMap) {
      const err = new Error('Contact not found');
      err.status = 404;
      throw err;
    }

    let target = null;
    for (const [p, c] of userMap.entries()) {
      if (c.id === contactId) {
        target = c;
        break;
      }
    }

    if (!target) {
      const err = new Error('Contact not found');
      err.status = 404;
      throw err;
    }

    if (name) target.name = name.trim();
    if (phone && phone !== target.phone) {
      userMap.delete(target.phone);
      target.phone = phone;
      target.formattedPhone = phone;
      const matched = await this.findUserByPhone(phone);
      target.isRegistered = Boolean(matched);
      target.contactUser = matched ? { id: matched.id, name: matched.name, avatar: matched.avatar, phone: matched.phone } : null;
      userMap.set(phone, target);
    }
    target.updatedAt = new Date().toISOString();
    return target;
  },

  async deleteContact(userId, contactId) {
    const uid = userId.toString();
    const userMap = memoryContacts.get(uid);
    if (!userMap) return true;

    for (const [phone, c] of userMap.entries()) {
      if (c.id === contactId) {
        userMap.delete(phone);
        break;
      }
    }
    return true;
  },

  async toggleFavoriteContact(userId, contactId) {
    const uid = userId.toString();
    const userMap = memoryContacts.get(uid);
    if (!userMap) {
      const err = new Error('Contact not found');
      err.status = 404;
      throw err;
    }

    let target = null;
    for (const c of userMap.values()) {
      if (c.id === contactId) {
        target = c;
        break;
      }
    }
    if (!target) {
      const err = new Error('Contact not found');
      err.status = 404;
      throw err;
    }

    target.isFavorite = !target.isFavorite;
    return target;
  },

  async toggleBlockContact(userId, contactId) {
    const uid = userId.toString();
    const userMap = memoryContacts.get(uid);
    if (!userMap) {
      const err = new Error('Contact not found');
      err.status = 404;
      throw err;
    }

    let target = null;
    for (const c of userMap.values()) {
      if (c.id === contactId) {
        target = c;
        break;
      }
    }
    if (!target) {
      const err = new Error('Contact not found');
      err.status = 404;
      throw err;
    }

    target.isBlocked = !target.isBlocked;
    return target;
  },

  async syncContacts(userId, rawContacts = []) {
    const uid = userId.toString();
    if (!memoryContacts.has(uid)) {
      memoryContacts.set(uid, new Map());
    }
    const userMap = memoryContacts.get(uid);

    const validItems = [];
    const phonesToLookup = [];

    rawContacts.forEach((item) => {
      if (!item || !item.name || !item.phone) return;
      const normalizedPhone = item.phone.trim();
      validItems.push({ name: item.name.trim(), phone: normalizedPhone, formattedPhone: item.formattedPhone || normalizedPhone });
      phonesToLookup.push(normalizedPhone);
    });

    const registeredUsers = await this.findUsersByPhones(phonesToLookup);
    const regMap = new Map();
    registeredUsers.forEach((u) => {
      if (u.phone) regMap.set(u.phone, u);
    });

    const synced = [];
    validItems.forEach((item) => {
      const matched = regMap.get(item.phone) || null;
      let existing = userMap.get(item.phone);
      if (existing) {
        existing.name = item.name;
        existing.isRegistered = Boolean(matched);
        existing.contactUser = matched ? { id: matched.id, name: matched.name, avatar: matched.avatar, phone: matched.phone } : null;
        synced.push(existing);
      } else {
        const contactId = 'cnt_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const newContact = {
          id: contactId,
          _id: contactId,
          userId: uid,
          name: item.name,
          phone: item.phone,
          formattedPhone: item.formattedPhone,
          isRegistered: Boolean(matched),
          contactUser: matched ? { id: matched.id, name: matched.name, avatar: matched.avatar, phone: matched.phone } : null,
          isFavorite: false,
          isBlocked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        userMap.set(item.phone, newContact);
        synced.push(newContact);
      }
    });

    return synced;
  },

  // -------------------------------------------------------------
  // MESSAGE LIFECYCLE EXTENSIONS (Edit, Delete, Read Receipts)
  // -------------------------------------------------------------

  async editMessage({ messageId, userId, text }) {
    if (!supabaseAdmin) throw new Error('Supabase client unavailable');
    const msgId = messageId.toString();
    const uid = userId.toString();
    const nowIso = new Date().toISOString();

    const { data: existing, error: findErr } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', msgId)
      .single();

    if (findErr || !existing) {
      const err = new Error('Message not found');
      err.statusCode = 404;
      throw err;
    }

    if (existing.sender_id !== uid) {
      const err = new Error('Access forbidden: You can only edit your own messages');
      err.statusCode = 403;
      throw err;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('messages')
      .update({
        text,
      })
      .eq('id', msgId)
      .select()
      .single();

    if (updateErr) throw new Error(`Edit message failed: ${updateErr.message}`);

    const senderProfile = (await this.findUserById(uid)) || { _id: uid, id: uid, name: 'User' };

    return {
      _id: updated.id,
      id: updated.id,
      conversationId: updated.conversation_id,
      sender: senderProfile,
      text: updated.text,
      status: updated.status,
      isEdited: true,
      editedAt: new Date(nowIso),
      attachments: updated.attachments || [],
      createdAt: new Date(updated.created_at),
      updatedAt: new Date(nowIso),
    };
  },

  async deleteMessage({ messageId, userId, mode = 'soft' }) {
    if (!supabaseAdmin) throw new Error('Supabase client unavailable');
    const msgId = messageId.toString();
    const uid = userId.toString();

    const { data: existing } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', msgId)
      .single();

    if (!existing) {
      const err = new Error('Message not found');
      err.statusCode = 404;
      throw err;
    }

    const convId = existing.conversation_id;

    if (mode === 'hard') {
      await supabaseAdmin.from('messages').delete().eq('id', msgId);
    } else {
      await supabaseAdmin
        .from('messages')
        .update({
          text: 'This message was deleted',
          attachments: [],
        })
        .eq('id', msgId);
    }

    return {
      messageId: msgId,
      conversationId: convId,
      mode,
      deletedBy: uid,
    };
  },

  async markMessagesAsRead({ conversationId, userId }) {
    if (!supabaseAdmin || !conversationId) return 0;
    const convId = conversationId.toString();
    const uid = userId.toString();

    const { error, count } = await supabaseAdmin
      .from('messages')
      .update({ status: 'read' })
      .eq('conversation_id', convId)
      .neq('sender_id', uid);

    if (error) {
      console.warn('[supabaseService] markMessagesAsRead error:', error.message);
      return 0;
    }

    await supabaseAdmin
      .from('conversations')
      .update({ last_message_status: 'read' })
      .eq('id', convId);

    return count || 1;
  },

  async updateMessageStatus(messageId, status) {
    if (!supabaseAdmin || !messageId) return;
    await supabaseAdmin
      .from('messages')
      .update({ status })
      .eq('id', messageId.toString());
  },

};

export default supabaseService;
