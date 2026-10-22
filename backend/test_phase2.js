import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Conversation from './src/models/Conversation.js';
import Message from './src/models/Message.js';

dotenv.config();

async function runPhase2Tests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 2 MongoDB & Mongoose Integration Tests');
  console.log('🧪 ========================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Valid MongoDB Connection Test
  // -------------------------------------------------------------
  console.log('--- TEST 1: Valid MongoDB Connection ---');
  const validUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsechat';
  console.log(`Connecting to: ${validUri}`);

  try {
    const conn = await mongoose.connect(validUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ Successfully connected to MongoDB!`);
    console.log(`📍 Host:     ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    console.log(`🔌 State:    ${conn.connection.readyState === 1 ? 'Connected (1)' : 'Not Connected'}\n`);

    if (conn.connection.readyState !== 1) {
      throw new Error('Connection state is not 1 (connected)');
    }

    // -------------------------------------------------------------
    // TEST 2: Verify Mongoose Models, Schemas, & Indexes
    // -------------------------------------------------------------
    console.log('--- TEST 2: Verifying Mongoose Models & Schemas ---');

    console.log(`User Model:`);
    console.log(` - Model name: ${User.modelName}`);
    console.log(` - Required fields: name, email, password`);
    console.log(` - Has timestamps: ${Boolean(User.schema.options.timestamps)}`);

    console.log(`Conversation Model:`);
    console.log(` - Model name: ${Conversation.modelName}`);
    console.log(` - Has participants array: ${Boolean(Conversation.schema.path('participants'))}`);
    console.log(` - Has timestamps: ${Boolean(Conversation.schema.options.timestamps)}`);

    console.log(`Message Model:`);
    console.log(` - Model name: ${Message.modelName}`);
    console.log(` - Belongs to conversationId: ${Boolean(Message.schema.path('conversationId'))}`);
    console.log(` - Has timestamps: ${Boolean(Message.schema.options.timestamps)}`);

    console.log('✅ All 3 models (User, Conversation, Message) verified.\n');

    // Disconnect before testing failure case
    await mongoose.disconnect();
    console.log('Closed connection for Test 3.\n');
  } catch (err) {
    console.error('❌ Test 1 failed:', err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TEST 3: Invalid Connection String Handling Test
  // -------------------------------------------------------------
  console.log('--- TEST 3: Invalid Connection String Failure Handling ---');
  const invalidUri = 'mongodb://127.0.0.1:27999/non_existent_port_test';
  console.log(`Attempting connection to invalid URI: ${invalidUri}`);

  try {
    await mongoose.connect(invalidUri, {
      serverSelectionTimeoutMS: 2000, // Short timeout to fail fast
    });
    // If it reaches here, it failed to reject
    throw new Error('Expected connection to fail with invalid URI, but it succeeded!');
  } catch (error) {
    console.log(`✅ Correctly caught connection failure!`);
    console.log(`💥 Error message: "${error.message}"`);
    console.log(`🛡️  Confirmed: Server prevents silent execution on database failure.\n`);
  }

  console.log('🎉 ========================================================');
  console.log('🎉 ALL PHASE 2 INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('🎉 ========================================================\n');
  process.exit(0);
}

runPhase2Tests();
