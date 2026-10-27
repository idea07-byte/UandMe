import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import WebSocket from 'ws';
import dotenv from 'dotenv';

// Polyfill native WebSocket in Node.js runtime for Supabase Realtime
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket;
}

dotenv.config();

const { Pool } = pg;

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';

/**
 * Standard Supabase client (Anon / Public permissions).
 */
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  : null;

/**
 * Elevated Admin Supabase client with Service Role privileges.
 * Bypasses Row Level Security (RLS) for backend operations.
 */
export const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

/**
 * Direct PostgreSQL Connection Pool for SQL queries and migrations.
 */
export const pgPool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

/**
 * Test connectivity to both Supabase API and direct PostgreSQL database.
 */
export const testSupabaseConnection = async () => {
  const status = {
    supabaseApi: false,
    postgresDb: false,
    dbTime: null,
    dbVersion: null,
    error: null,
  };

  try {
    // 1. Test PostgreSQL connection
    if (DATABASE_URL && pgPool) {
      const client = await pgPool.connect();
      try {
        const res = await client.query('SELECT NOW() as current_time, version() as db_version;');
        status.postgresDb = true;
        status.dbTime = res.rows[0].current_time;
        status.dbVersion = res.rows[0].db_version;
      } finally {
        client.release();
      }
    }

    // 2. Test Supabase Admin API
    if (supabaseAdmin) {
      const { error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (!authError) {
        status.supabaseApi = true;
      } else {
        console.warn('⚠️ Supabase Admin API notice:', authError.message);
      }
    }
  } catch (err) {
    status.error = err.message;
  }

  return status;
};

export default {
  supabase,
  supabaseAdmin,
  pgPool,
  testSupabaseConnection,
};
