import { pgPool } from './src/config/supabase.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Complete seed dataset matching UandMe WhatsApp interface
const SEED_USERS = [
  {
    id: 'usr_me_1',
    name: 'Shyam M',
    email: 'shyam41611@gmail.com',
    username: 'shyam',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Senior Project Lead',
    department: 'Computer Science & Software Engineering',
    status: 'online',
    about: 'Building UandMe 🚀 WhatsApp-style campus communicator',
    phone: '+1 (555) 234-5678',
  },
  {
    id: 'usr_2',
    name: 'Sarah Connor',
    email: 'sarah.connor@university.edu',
    username: 'sarahc',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Team Lead',
    department: 'Computer Science',
    status: 'online',
    about: 'Reviewing distributed systems architectures',
    phone: '+1 (555) 432-1098',
  },
  {
    id: 'usr_3',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@university.edu',
    username: 'mchen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Faculty Advisor',
    department: 'Software Architecture',
    status: 'offline',
    about: 'Office hours MWF 2-4 PM',
    phone: '+1 (555) 345-6789',
  },
  {
    id: 'usr_4',
    name: 'Priya Sharma',
    email: 'priya.sharma@university.edu',
    username: 'psharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Cloud Architect',
    department: 'Distributed Networks',
    status: 'online',
    about: 'Fine-tuning NLP sentiment analysis models',
    phone: '+1 (555) 987-6543',
  },
  {
    id: 'usr_5',
    name: 'Marcus Vance',
    email: 'marcus.vance@university.edu',
    username: 'marcusv',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'DevOps & CI/CD',
    department: 'Systems Administration',
    status: 'offline',
    about: 'Studying for midterm exams',
    phone: '+1 (555) 123-9876',
  },
  {
    id: 'usr_6',
    name: 'Dr. Evelyn Reed',
    email: 'evelyn.reed@university.edu',
    username: 'ereed_advisor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role: 'Associate Professor',
    department: 'Faculty of Computer Science',
    status: 'busy',
    about: 'Faculty Office Hours: Mon & Wed 2-4 PM',
    phone: '+1 (555) 678-1234',
  },
  {
    id: 'usr_alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    username: 'arivera',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    role: 'Cybersecurity Fellow',
    department: 'Cybersecurity & Networks',
    status: 'online',
    about: 'Developing cybersecurity attack vectors & defense lab',
    phone: '+1 (555) 345-9871',
  },
];

const SEED_CONVERSATIONS = [
  {
    id: 'conv_1',
    name: 'Sarah Connor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    participants: ['usr_me_1', 'usr_2'],
    lastMessage: 'Did you review the system architecture diagram?',
  },
  {
    id: 'conv_2',
    name: 'UandMe Dev Team',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    isGroup: true,
    participants: ['usr_me_1', 'usr_2', 'usr_4', 'usr_5'],
    lastMessage: 'David: Tailwind theme and Lucide icons are configured!',
  },
  {
    id: 'conv_3',
    name: 'Dr. Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    participants: ['usr_me_1', 'usr_3'],
    lastMessage: 'Please make sure to push your changes to GitHub before our meeting tomorrow.',
  },
  {
    id: 'conv_4',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    participants: ['usr_me_1', 'usr_4'],
    lastMessage: 'The WebRTC audio/video signaling integration tests passed flawlessly!',
  },
  {
    id: 'conv_5',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    participants: ['usr_me_1', 'usr_5'],
    lastMessage: 'Remember to verify responsiveness across desktop and mobile.',
  },
];

const SEED_MESSAGES = [
  {
    id: 'msg_101',
    conversation_id: 'conv_1',
    sender_id: 'usr_2',
    text: 'Hey Shyam! How is the progress on the Real-Time Messaging and Calling app?',
    status: 'read',
  },
  {
    id: 'msg_102',
    conversation_id: 'conv_1',
    sender_id: 'usr_me_1',
    text: 'Hey Sarah! We just finished configuring the Vite frontend with Tailwind CSS and our WhatsApp design system.',
    status: 'read',
  },
  {
    id: 'msg_103',
    conversation_id: 'conv_1',
    sender_id: 'usr_2',
    text: 'Awesome! Did you configure the reusable components like Buttons, Modals, and Dialpad?',
    status: 'read',
  },
  {
    id: 'msg_104',
    conversation_id: 'conv_1',
    sender_id: 'usr_me_1',
    text: 'Yes! The dialpad is fully interactive with DTMF audio touch-tones and WebRTC voice & video calling.',
    status: 'read',
  },
  {
    id: 'msg_105',
    conversation_id: 'conv_1',
    sender_id: 'usr_2',
    text: 'Did you review the system architecture diagram?',
    status: 'read',
  },
  {
    id: 'msg_201',
    conversation_id: 'conv_2',
    sender_id: 'usr_me_1',
    text: 'Welcome team! Repository is synced with Supabase PostgreSQL and GitHub.',
    status: 'read',
  },
  {
    id: 'msg_202',
    conversation_id: 'conv_2',
    sender_id: 'usr_4',
    text: 'David: Tailwind theme and Lucide icons are configured!',
    status: 'read',
  },
  {
    id: 'msg_301',
    conversation_id: 'conv_3',
    sender_id: 'usr_3',
    text: 'Please make sure to push your changes to GitHub before our meeting tomorrow.',
    status: 'read',
  },
  {
    id: 'msg_401',
    conversation_id: 'conv_4',
    sender_id: 'usr_4',
    text: 'The WebRTC audio/video signaling integration tests passed flawlessly!',
    status: 'delivered',
  },
  {
    id: 'msg_501',
    conversation_id: 'conv_5',
    sender_id: 'usr_5',
    text: 'Remember to verify responsiveness across desktop and mobile.',
    status: 'sent',
  },
];

const SEED_CALLS = [
  {
    id: 'call_1',
    caller_id: 'usr_2',
    recipient_id: 'usr_me_1',
    recipient_name: 'Sarah Connor',
    call_type: 'video',
    direction: 'incoming',
    status: 'ended',
    duration: 840,
  },
  {
    id: 'call_2',
    caller_id: 'usr_me_1',
    recipient_id: 'usr_alex',
    recipient_name: 'Alex Rivera',
    call_type: 'voice',
    direction: 'missed',
    status: 'missed',
    duration: 0,
  },
  {
    id: 'call_3',
    caller_id: 'usr_me_1',
    recipient_id: 'usr_3',
    recipient_name: 'Dr. Michael Chen',
    call_type: 'video',
    direction: 'outgoing',
    status: 'ended',
    duration: 1920,
  },
  {
    id: 'call_4',
    caller_id: 'usr_4',
    recipient_id: 'usr_me_1',
    recipient_name: 'Priya Sharma',
    call_type: 'voice',
    direction: 'incoming',
    status: 'ended',
    duration: 360,
  },
  {
    id: 'call_5',
    caller_id: 'usr_5',
    recipient_id: 'usr_me_1',
    recipient_name: 'Marcus Vance',
    call_type: 'voice',
    direction: 'outgoing',
    status: 'ended',
    duration: 1080,
  },
];

async function run() {
  console.log('====================================================');
  console.log('🐘 Building Supabase Tables & Storing Data...');
  console.log('====================================================');

  const client = await pgPool.connect();

  try {
    // 1. Create Tables
    console.log('\n📦 Step 1: Creating Tables in Supabase...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT,
        password_hash TEXT,
        avatar TEXT,
        about TEXT DEFAULT 'Available on UandMe 🚀',
        role TEXT DEFAULT 'student',
        department TEXT DEFAULT 'Computer Science',
        status TEXT DEFAULT 'offline',
        phone TEXT,
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.conversations (
        id TEXT PRIMARY KEY,
        is_group BOOLEAN DEFAULT FALSE,
        name TEXT,
        avatar TEXT,
        admin_id TEXT,
        last_message_text TEXT,
        last_message_sender_id TEXT,
        last_message_status TEXT DEFAULT 'sent',
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.conversation_participants (
        conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE,
        user_id TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        is_muted BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        unread_count INT DEFAULT 0,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (conversation_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS public.messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE,
        sender_id TEXT,
        text TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        status TEXT DEFAULT 'sent',
        is_encrypted BOOLEAN DEFAULT FALSE,
        client_message_id TEXT,
        attachments JSONB DEFAULT '[]'::jsonb,
        read_by JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.calls (
        id TEXT PRIMARY KEY,
        caller_id TEXT,
        recipient_id TEXT,
        recipient_name TEXT,
        call_type TEXT DEFAULT 'voice',
        direction TEXT DEFAULT 'outgoing',
        status TEXT DEFAULT 'ended',
        duration INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.contacts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        contact_id TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);

      -- Ensure flexible foreign keys for mixed MongoDB and mock IDs
      ALTER TABLE public.conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_user_id_fkey;
      ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    `);
    console.log('✅ Tables created: users, conversations, conversation_participants, messages, calls, contacts');

    // 2. Insert Seed Users
    console.log('\n👥 Step 2: Storing Users...');
    for (const u of SEED_USERS) {
      await client.query(`
        INSERT INTO public.users (id, name, email, username, avatar, role, department, status, about, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          username = COALESCE(EXCLUDED.username, public.users.username),
          avatar = EXCLUDED.avatar,
          phone = EXCLUDED.phone,
          status = EXCLUDED.status,
          about = EXCLUDED.about;
      `, [u.id, u.name, u.email, u.username, u.avatar, u.role, u.department, u.status, u.about, u.phone]);
    }

    // Also migrate existing MongoDB accounts if available
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsechat', { serverSelectionTimeoutMS: 2000 });
      const mongoUsers = await mongoose.connection.db.collection('users').find().toArray();
      for (const mu of mongoUsers) {
        const id = mu._id.toString();
        const username = mu.username || mu.email.split('@')[0];
        await client.query(`
          INSERT INTO public.users (id, name, email, username, avatar, role, department, status, about, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash);
        `, [
          id,
          mu.name || 'Campus Member',
          mu.email,
          username,
          mu.avatar || '',
          mu.role || 'student',
          mu.department || 'Computer Science',
          mu.status || 'offline',
          mu.about || 'Available on UandMe 🚀',
          mu.password || null,
        ]);
      }
      console.log(`✅ Stored ${SEED_USERS.length} seed users + ${mongoUsers.length} MongoDB users in Supabase.`);
      await mongoose.disconnect();
    } catch {
      console.log(`✅ Stored ${SEED_USERS.length} seed users in Supabase.`);
    }

    // 3. Insert Conversations & Participants
    console.log('\n💬 Step 3: Storing Conversations...');
    for (const c of SEED_CONVERSATIONS) {
      await client.query(`
        INSERT INTO public.conversations (id, is_group, name, avatar, last_message_text)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          last_message_text = EXCLUDED.last_message_text;
      `, [c.id, c.isGroup, c.name, c.avatar, c.lastMessage]);

      for (const pid of c.participants) {
        await client.query(`
          INSERT INTO public.conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT (conversation_id, user_id) DO NOTHING;
        `, [c.id, pid]);
      }
    }
    console.log(`✅ Stored ${SEED_CONVERSATIONS.length} conversation threads in Supabase.`);

    // 4. Insert Messages
    console.log('\n✉️ Step 4: Storing Messages...');
    for (const m of SEED_MESSAGES) {
      await client.query(`
        INSERT INTO public.messages (id, conversation_id, sender_id, text, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          text = EXCLUDED.text,
          status = EXCLUDED.status;
      `, [m.id, m.conversation_id, m.sender_id, m.text, m.status]);
    }
    console.log(`✅ Stored ${SEED_MESSAGES.length} messages in Supabase.`);

    // 5. Insert Calls
    console.log('\n📞 Step 5: Storing Call Records...');
    for (const cl of SEED_CALLS) {
      await client.query(`
        INSERT INTO public.calls (id, caller_id, recipient_id, recipient_name, call_type, direction, status, duration)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          duration = EXCLUDED.duration;
      `, [cl.id, cl.caller_id, cl.recipient_id, cl.recipient_name, cl.call_type, cl.direction, cl.status, cl.duration]);
    }
    console.log(`✅ Stored ${SEED_CALLS.length} call logs in Supabase.`);

    // 6. Verification Summary
    console.log('\n📊 Step 6: Supabase Live Row Counts:');
    const uCount = (await client.query('SELECT COUNT(*) FROM public.users;')).rows[0].count;
    const convCount = (await client.query('SELECT COUNT(*) FROM public.conversations;')).rows[0].count;
    const partCount = (await client.query('SELECT COUNT(*) FROM public.conversation_participants;')).rows[0].count;
    const msgCount = (await client.query('SELECT COUNT(*) FROM public.messages;')).rows[0].count;
    const clCount = (await client.query('SELECT COUNT(*) FROM public.calls;')).rows[0].count;

    console.log(`   🟢 public.users:                    ${uCount} records`);
    console.log(`   🟢 public.conversations:            ${convCount} records`);
    console.log(`   🟢 public.conversation_participants: ${partCount} records`);
    console.log(`   🟢 public.messages:                 ${msgCount} records`);
    console.log(`   🟢 public.calls:                    ${clCount} records`);

    console.log('\n====================================================');
    console.log('🎉 SUCCESS: All tables created & data stored in Supabase!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Error initializing Supabase:', err);
    process.exit(1);
  } finally {
    client.release();
    await pgPool.end();
  }
}

run();
