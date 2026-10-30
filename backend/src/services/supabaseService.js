import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

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
}

export const supabaseService = {
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
};

export default supabaseService;
