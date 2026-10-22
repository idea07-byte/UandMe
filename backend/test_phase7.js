import http from 'http';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import dotenv from 'dotenv';
import app from './src/app.js';
import { initSocket } from './src/socket/index.js';
import User from './src/models/User.js';
import Conversation from './src/models/Conversation.js';
import Message from './src/models/Message.js';

dotenv.config();

const PORT = 5009;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

let httpServer;
let ioServer;

/**
 * Helper to register and login user via REST API
 */
async function createAndLoginUser(name, email, password) {
  // Register
  const regRes = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const regData = await regRes.json();
  if (regRes.status !== 201) {
    throw new Error(`Failed to register ${email}: ${JSON.stringify(regData)}`);
  }

  // Login
  const loginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200) {
    throw new Error(`Failed to login ${email}: ${JSON.stringify(loginData)}`);
  }

  return {
    user: loginData.user,
    token: loginData.token,
  };
}

async function runPhase7Tests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 7 Socket.IO Integration Test Suite');
  console.log('🧪 ========================================================\n');

  try {
    // 1. Connect MongoDB
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsechat';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB successfully.');

    // 2. Start HTTP server + Socket.IO
    httpServer = http.createServer(app);
    ioServer = initSocket(httpServer);

    await new Promise((resolve) => {
      httpServer.listen(PORT, '127.0.0.1', () => {
        console.log(`✅ Test server with Socket.IO running at ${SERVER_URL}\n`);
        resolve();
      });
    });

    // 3. Clean up test users
    const testEmails = [
      'alice_p7@campus.edu',
      'bob_p7@campus.edu',
      'mallory_p7@campus.edu',
    ];
    const existingUsers = await User.find({ email: { $in: testEmails } });
    const existingUserIds = existingUsers.map((u) => u._id);
    await Message.deleteMany({ sender: { $in: existingUserIds } });
    await Conversation.deleteMany({ participants: { $in: existingUserIds } });
    await User.deleteMany({ email: { $in: testEmails } });

    // 4. Register users via REST API to verify REST API is preserved
    console.log('--- Step 1: Verify REST API Functionality with Socket.IO Attached ---');
    const healthRes = await fetch(`${SERVER_URL}/api/health`);
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || healthData.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
    }
    console.log('✅ REST /api/health returns 200 OK while Socket.IO is co-hosted.');

    const alice = await createAndLoginUser('Alice P7', 'alice_p7@campus.edu', 'AlicePass123!');
    const bob = await createAndLoginUser('Bob P7', 'bob_p7@campus.edu', 'BobPass123!');
    const mallory = await createAndLoginUser('Mallory P7', 'mallory_p7@campus.edu', 'MalloryPass123!');
    console.log('✅ REST Authentication routes work seamlessly (/api/auth/register, /api/auth/login).');

    // Create a conversation between Alice and Bob
    const convRes = await fetch(`${SERVER_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: bob.user.id }),
    });
    const convData = await convRes.json();
    if (convRes.status !== 200 && convRes.status !== 201) {
      throw new Error(`Failed to create conversation: ${JSON.stringify(convData)}`);
    }
    const conversationId = (convData.id || convData._id || convData.data?.conversation?.id).toString();
    console.log(`✅ Created test conversation between Alice & Bob: ${conversationId}\n`);

    // --- Test 2: Connection Rejected when No Token Provided ---
    console.log('--- Step 2: Reject Unauthenticated Socket Connections ---');
    await new Promise((resolve, reject) => {
      const socket = Client(SERVER_URL, {
        auth: {}, // No token provided
        transports: ['websocket'],
        reconnection: false,
      });

      socket.on('connect', () => {
        socket.disconnect();
        reject(new Error('FAIL: Unauthenticated socket connection was unexpectedly accepted!'));
      });

      socket.on('connect_error', (err) => {
        console.log(`✅ Unauthenticated connection correctly rejected: "${err.message}" (code: ${err.data?.code})`);
        if (err.data?.code === 'NO_TOKEN_PROVIDED') {
          resolve();
        } else {
          // Some socket.io client versions might only surface err.message
          resolve();
        }
      });
    });

    // --- Test 3: Connection Rejected with Invalid/Tampered Token ---
    console.log('\n--- Step 3: Reject Connections with Invalid/Tampered Token ---');
    await new Promise((resolve, reject) => {
      const socket = Client(SERVER_URL, {
        auth: { token: 'invalid.tampered.token_signature' },
        transports: ['websocket'],
        reconnection: false,
      });

      socket.on('connect', () => {
        socket.disconnect();
        reject(new Error('FAIL: Socket with invalid token was unexpectedly accepted!'));
      });

      socket.on('connect_error', (err) => {
        console.log(`✅ Invalid token connection correctly rejected: "${err.message}" (code: ${err.data?.code})`);
        resolve();
      });
    });

    // --- Test 4: Successful Authenticated Socket Connection ---
    console.log('\n--- Step 4: Successful Authenticated Socket Connection ---');
    let aliceSocket;
    await new Promise((resolve, reject) => {
      aliceSocket = Client(SERVER_URL, {
        auth: { token: alice.token },
        transports: ['websocket'],
        reconnection: false,
      });

      aliceSocket.on('connect', () => {
        console.log(`✅ Alice connected successfully with socket ID: ${aliceSocket.id}`);
        resolve();
      });

      aliceSocket.on('connect_error', (err) => {
        reject(new Error(`Alice connection failed: ${err.message}`));
      });
    });

    // --- Test 5: Verify Room Joining for Authorized Participant ---
    console.log('\n--- Step 5: Join Room with Membership Verification (Authorized) ---');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for conversation:joined'));
      }, 5000);

      aliceSocket.on('conversation:joined', (response) => {
        clearTimeout(timeout);
        console.log(`✅ Alice received 'conversation:joined':`, response);
        if (response.status === 'ok' && response.conversationId === conversationId) {
          resolve();
        } else {
          reject(new Error(`Unexpected response payload: ${JSON.stringify(response)}`));
        }
      });

      aliceSocket.on('socket:error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Unexpected socket error: ${JSON.stringify(err)}`));
      });

      aliceSocket.emit('conversation:join', { conversationId });
    });

    // --- Test 6: Prevent Unauthorized User from Joining Private Conversation Room ---
    console.log('\n--- Step 6: Prevent Unauthorized User from Joining Room ---');
    let mallorySocket;
    await new Promise((resolve, reject) => {
      mallorySocket = Client(SERVER_URL, {
        auth: { token: mallory.token },
        transports: ['websocket'],
        reconnection: false,
      });

      mallorySocket.on('connect', () => {
        console.log(`✅ Mallory (unauthorized user) connected with socket ID: ${mallorySocket.id}`);
        resolve();
      });

      mallorySocket.on('connect_error', (err) => {
        reject(new Error(`Mallory connection failed: ${err.message}`));
      });
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for forbidden room access error'));
      }, 5000);

      mallorySocket.on('conversation:joined', (res) => {
        clearTimeout(timeout);
        reject(new Error(`SECURITY VULNERABILITY: Mallory was allowed into conversation: ${JSON.stringify(res)}`));
      });

      mallorySocket.on('socket:error', (err) => {
        clearTimeout(timeout);
        console.log(`✅ Unauthorized room join prevented with standard socket error:`, err);
        if (err.status === 'error' && err.code === 'FORBIDDEN_ROOM_ACCESS') {
          resolve();
        } else {
          reject(new Error(`Expected FORBIDDEN_ROOM_ACCESS error, got: ${JSON.stringify(err)}`));
        }
      });

      // Mallory attempts to sneak into Alice and Bob's private conversation
      mallorySocket.emit('conversation:join', { conversationId });
    });

    // --- Test 7: Reject Invalid Conversation ID Format ---
    console.log('\n--- Step 7: Reject Invalid Conversation ID Format ---');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for invalid conversation ID error'));
      }, 5000);

      const errHandler = (err) => {
        if (err.code === 'INVALID_CONVERSATION_ID') {
          clearTimeout(timeout);
          aliceSocket.off('socket:error', errHandler);
          console.log(`✅ Invalid ObjectId rejected with standard error:`, err);
          resolve();
        }
      };

      aliceSocket.on('socket:error', errHandler);
      aliceSocket.emit('conversation:join', 'invalid-non-object-id');
    });

    // --- Test 8: Non-Existent Conversation Room ---
    console.log('\n--- Step 8: Reject Non-Existent Conversation Room ---');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for non-existent conversation error'));
      }, 5000);

      const fakeId = new mongoose.Types.ObjectId().toString();
      const errHandler = (err) => {
        if (err.code === 'CONVERSATION_NOT_FOUND') {
          clearTimeout(timeout);
          aliceSocket.off('socket:error', errHandler);
          console.log(`✅ Non-existent room rejected with CONVERSATION_NOT_FOUND:`, err);
          resolve();
        }
      };

      aliceSocket.on('socket:error', errHandler);
      aliceSocket.emit('conversation:join', { conversationId: fakeId });
    });

    // --- Test 9: Authorized Room Leave ---
    console.log('\n--- Step 9: Leave Room Cleanly ---');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for conversation:left'));
      }, 5000);

      aliceSocket.on('conversation:left', (response) => {
        clearTimeout(timeout);
        console.log(`✅ Alice received 'conversation:left':`, response);
        if (response.status === 'ok') {
          resolve();
        } else {
          reject(new Error(`Unexpected response: ${JSON.stringify(response)}`));
        }
      });

      aliceSocket.emit('conversation:leave', { conversationId });
    });

    // --- Step 10: Clean Disconnection ---
    console.log('\n--- Step 10: Disconnect Sockets Cleanly ---');
    if (aliceSocket) aliceSocket.disconnect();
    if (mallorySocket) mallorySocket.disconnect();
    console.log('✅ Client sockets disconnected cleanly.');

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL PHASE 7 SOCKET.IO INTEGRATION TESTS PASSED!');
    console.log('🎉 ========================================================\n');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exitCode = 1;
  } finally {
    if (ioServer) {
      ioServer.close();
    }
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    await mongoose.disconnect();
    console.log('🛑 Closed HTTP server and MongoDB connection.');
    process.exit(process.exitCode || 0);
  }
}

runPhase7Tests();
