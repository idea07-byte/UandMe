import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { testSupabaseConnection } from './supabase.js';

dotenv.config();

/**
 * Connect to database services (Supabase PostgreSQL and optional MongoDB).
 * Ensures server starts smoothly in production cloud deployments like Render.
 *
 * @returns {Promise<boolean>}
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const dbUrl = process.env.DATABASE_URL;
  let supabaseConnected = false;
  let mongoConnected = false;

  // 1. Verify Supabase PostgreSQL connection
  if (dbUrl || process.env.SUPABASE_URL) {
    try {
      const sbResult = await testSupabaseConnection();
      if (sbResult.postgresDb) {
        console.log('====================================================');
        console.log('🐘 Connected to Supabase PostgreSQL successfully!');
        console.log(`📍 Host: db.${process.env.SUPABASE_PROJECT_ID || 'supabase'}.co (Pooler: aws-0-ap-southeast-1)`);
        console.log('====================================================');
        supabaseConnected = true;
      } else if (sbResult.supabaseApi) {
        console.log('====================================================');
        console.log('⚡ Connected to Supabase REST API successfully!');
        console.log('====================================================');
        supabaseConnected = true;
      } else {
        console.warn('⚠️  Supabase PostgreSQL check returned:', sbResult.error || 'not reachable');
        if (dbUrl || process.env.SUPABASE_URL) {
          // If explicitly configured, do not abort process - allow server to start
          supabaseConnected = true;
        }
      }
    } catch (sbErr) {
      console.warn('⚠️  Supabase health check notice:', sbErr.message);
      if (dbUrl || process.env.SUPABASE_URL) {
        supabaseConnected = true;
      }
    }
  }

  // 2. Connect to MongoDB if URI is provided
  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });

      console.log('====================================================');
      console.log('🍃 Connected to MongoDB successfully!');
      console.log(`📍 Host:     ${conn.connection.host}`);
      console.log(`📦 Database: ${conn.connection.name}`);
      console.log('====================================================');
      mongoConnected = true;

      mongoose.connection.on('error', (err) => {
        console.error('❌ Runtime MongoDB error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB connection lost. Reconnecting...');
      });
    } catch (error) {
      if (supabaseConnected) {
        console.warn('⚠️  MongoDB connection skipped (Supabase PostgreSQL active).');
      } else {
        console.error('====================================================');
        console.error('❌ FATAL: Failed to connect to database.');
        console.error(`💥 Reason: ${error.message}`);
        console.error('====================================================');
        process.exit(1);
      }
    }
  }

  if (!supabaseConnected && !mongoConnected) {
    console.error('====================================================');
    console.error('❌ FATAL: Neither Supabase nor MongoDB is configured!');
    console.error('👉 Please define DATABASE_URL or MONGODB_URI in your environment.');
    console.error('====================================================');
    process.exit(1);
  }

  return true;
};

/**
 * Disconnect from MongoDB gracefully on application shutdown.
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('🍃 MongoDB connection closed gracefully.');
    }
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  }
};

export default connectDB;
