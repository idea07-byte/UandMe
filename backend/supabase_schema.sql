-- ============================================================================
-- uandi (UandMe) Supabase PostgreSQL Schema
-- Project: gujrjohtfuaadxiikkju
-- Real-Time Messaging, Calling, Presence & Directory Schema
-- ============================================================================

-- 1. Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    status VARCHAR(50) DEFAULT 'offline', -- 'online' | 'offline' | 'away' | 'busy'
    status_message VARCHAR(255) DEFAULT 'Available on uandi 🚀',
    phone VARCHAR(50),
    department VARCHAR(150) DEFAULT 'Computer Science',
    role VARCHAR(100) DEFAULT 'Student Member',
    password_hash VARCHAR(255),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_group BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    avatar VARCHAR(500),
    group_avatar VARCHAR(500),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    last_message_text TEXT,
    last_message_status VARCHAR(50) DEFAULT 'sent', -- 'sending' | 'sent' | 'delivered' | 'read'
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Conversation Participants Junction
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    unread_count INT DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id)
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT,
    text TEXT, -- Backwards-compatible alias for text payload
    type VARCHAR(50) DEFAULT 'text', -- 'text' | 'image' | 'file' | 'audio' | 'video' | 'call_log'
    status VARCHAR(50) DEFAULT 'sent', -- 'sending' | 'sent' | 'delivered' | 'read'
    media_url VARCHAR(500),
    media_metadata JSONB DEFAULT '{}'::jsonb,
    is_encrypted BOOLEAN DEFAULT FALSE,
    client_message_id VARCHAR(150),
    attachments JSONB DEFAULT '[]'::jsonb,
    read_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Calls Table (WebRTC 1-to-1 Audio & Video Calls)
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recipient_name VARCHAR(255),
    call_type VARCHAR(50) DEFAULT 'voice', -- 'voice' | 'video'
    direction VARCHAR(50) DEFAULT 'outgoing', -- 'incoming' | 'outgoing' | 'missed'
    status VARCHAR(50) DEFAULT 'ended', -- 'ringing' | 'ongoing' | 'ended' | 'rejected' | 'missed' | 'busy'
    duration INT DEFAULT 0, -- Duration in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Contacts Table (User Directory & Contact Book)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, contact_id)
);

-- 8. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON public.calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_recipient_id ON public.calls(recipient_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);

-- 9. Row Level Security (RLS) Enablement
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 10. Row Level Security Policies
-- -------------------------------------------------------------

-- USERS POLICIES
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.users;
CREATE POLICY "Public profiles are readable by everyone" 
    ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

-- CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations" 
    ON public.conversations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversations.id 
            AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" 
    ON public.conversations FOR INSERT 
    WITH CHECK (auth.uid() = created_by OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" 
    ON public.conversations FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversations.id 
            AND cp.user_id = auth.uid()
        )
    );

-- CONVERSATION PARTICIPANTS POLICIES
DROP POLICY IF EXISTS "Participants can view conversation members" ON public.conversation_participants;
CREATE POLICY "Participants can view conversation members" 
    ON public.conversation_participants FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversation_participants.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can add participants to conversations" ON public.conversation_participants;
CREATE POLICY "Users can add participants to conversations" 
    ON public.conversation_participants FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own participant flags" ON public.conversation_participants;
CREATE POLICY "Users can update their own participant flags" 
    ON public.conversation_participants FOR UPDATE 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;
CREATE POLICY "Users can leave conversations" 
    ON public.conversation_participants FOR DELETE 
    USING (user_id = auth.uid());

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON public.messages;
CREATE POLICY "Participants can view messages in their conversations" 
    ON public.messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = messages.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Participants can send messages in their conversations" ON public.messages;
CREATE POLICY "Participants can send messages in their conversations" 
    ON public.messages FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = messages.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Participants can update message status" ON public.messages;
CREATE POLICY "Participants can update message status" 
    ON public.messages FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = messages.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

-- CALLS POLICIES
DROP POLICY IF EXISTS "Users can view their own call logs" ON public.calls;
CREATE POLICY "Users can view their own call logs" 
    ON public.calls FOR SELECT 
    USING (caller_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can create call records" ON public.calls;
CREATE POLICY "Users can create call records" 
    ON public.calls FOR INSERT 
    WITH CHECK (caller_id = auth.uid());

DROP POLICY IF EXISTS "Participants can update call status" ON public.calls;
CREATE POLICY "Participants can update call status" 
    ON public.calls FOR UPDATE 
    USING (caller_id = auth.uid() OR recipient_id = auth.uid());

-- CONTACTS POLICIES
DROP POLICY IF EXISTS "Users can view their contacts" ON public.contacts;
CREATE POLICY "Users can view their contacts" 
    ON public.contacts FOR SELECT 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can add contacts" ON public.contacts;
CREATE POLICY "Users can add contacts" 
    ON public.contacts FOR INSERT 
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their contacts" ON public.contacts;
CREATE POLICY "Users can update their contacts" 
    ON public.contacts FOR UPDATE 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete contacts" ON public.contacts;
CREATE POLICY "Users can delete contacts" 
    ON public.contacts FOR DELETE 
    USING (user_id = auth.uid());

-- -------------------------------------------------------------
-- 11. Enable Realtime Replication Publication
-- -------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'calls'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
    END IF;
END $$;
