import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { beforeAll, afterAll, afterEach } from 'vitest';

dotenv.config();

// Ensure test environment is explicitly set
process.env.NODE_ENV = 'test';

// Enforce isolated test database: never touch production 'pulsechat' database
const TEST_DB_URI =
  process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/pulsechat_test';
process.env.MONGODB_URI = TEST_DB_URI;

/**
 * Utility helper to wipe all test collections in the isolated test database
 */
export const cleanDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
};

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }
  await cleanDatabase();
});

afterEach(async () => {
  // Clean up between tests to ensure repeatable, isolated test cases
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
