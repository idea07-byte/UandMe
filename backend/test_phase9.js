import http from 'http';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import dotenv from 'dotenv';
import app from './src/app.js';
import { initSocket } from './src/socket/index.js';
import presenceManager from './src/socket/presenceManager.js';
import User from './src/models/User.js';
import Conversation from './src/models/Conversation.js';
import Message from './src/models/Message.js';

dotenv.config();

const PORT = 5010;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

let httpServer;
let ioServer;

/**
 * Helper to register and login user via REST API
 */
async function createAndLoginUser(name, email, password) {
  const regRes = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const regData = await regRes.json();
  if (regRes.status !== 201) {
    throw new Error(`Failed to register ${email}: ${JSON.stringify(regData)}`);
  }

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

/**
 * Helper to create an authenticated socket client
 */
function createSocketClient(token) {
  return Client(SERVER_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
    forceNew: true,
  });
}

async function runPhase9Tests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 9 Advanced Chat Features Test Suite');
  console.log('🧪 ========================================================\n');

  try {
    // 1. Connect MongoDB
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsechat';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB successfully.');

    // 2. Clear presence manager memory
    presenceManager.clear();

    // 3. Start HTTP server + Socket.IO on dedicated test port
    httpServer = http.createServer(app);
    ioServer = initSocket(httpServer);

    await new Promise((resolve) => {
      httpServer.listen(PORT, '127.0.0.1', () => {
        console.log(`✅ Test server running at ${SERVER_URL}\n`);
        resolve();
      });
    });

    // 4. Clean up test users
    const testEmails = [
      'alice_p9@campus.edu',
      'bob_p9@campus.edu',
      'mallory_p9@campus.edu',
    ];
    const existingUsers = await User.find({ email: { $in: testEmails } });
    const existingUserIds = existingUsers.map((u) => u._id);
    await Message.deleteMany({ sender: { $in: existingUserIds } });
    await Conversation.deleteMany({ participants: { $in: existingUserIds } });
    await User.deleteMany({ email: { $in: testEmails } });

    // 5. Create test users
    console.log('--- Step 1: Register and Authenticate Test Users ---');
    const alice = await createAndLoginUser('Alice P9', 'alice_p9@campus.edu', 'AlicePass123!');
    const bob = await createAndLoginUser('Bob P9', 'bob_p9@campus.edu', 'BobPass123!');
    const mallory = await createAndLoginUser('Mallory P9', 'mallory_p9@campus.edu', 'MalloryPass123!');
    console.log('✅ Registered Alice, Bob, and Mallory.');

    // Create 1-on-1 conversation between Alice and Bob
    const convRes = await fetch(`${SERVER_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: bob.user.id }),
    });
    const convData = await convRes.json();
    const conversationId = (convData.id || convData._id || convData.data?.conversation?.id).toString();
    console.log(`✅ Created test conversation between Alice & Bob: ${conversationId}\n`);

    // =========================================================
    // FEATURE C: Online Status & Multi-Socket Tracking
    // =========================================================
    console.log('--- Step 2: Multi-Socket Online Presence Tracking ---');

    // Bob connects first to observe Alice's online events
    const bobSocket = createSocketClient(bob.token);
    await new Promise((resolve) => bobSocket.on('connect', resolve));
    console.log(`✅ Bob connected [socketId: ${bobSocket.id}]`);

    // Setup listener on Bob's socket to catch Alice's user:online
    let aliceOnlineCount = 0;
    let aliceOfflineCount = 0;
    bobSocket.on('user:online', (data) => {
      if (data.userId === alice.user.id) {
        aliceOnlineCount++;
      }
    });
    bobSocket.on('user:offline', (data) => {
      if (data.userId === alice.user.id) {
        aliceOfflineCount++;
      }
    });

    // Alice opens Tab 1 (First Connection)
    const aliceSocketTab1 = createSocketClient(alice.token);
    await new Promise((resolve) => aliceSocketTab1.on('connect', resolve));
    console.log(`✅ Alice Tab 1 connected [socketId: ${aliceSocketTab1.id}]`);

    // Allow event loop to propagate
    await new Promise((r) => setTimeout(r, 100));

    if (aliceOnlineCount !== 1) {
      throw new Error(`Expected Bob to receive 1 user:online event for Alice, received: ${aliceOnlineCount}`);
    }
    const aliceUserInDb1 = await User.findById(alice.user.id);
    if (aliceUserInDb1.status !== 'online') {
      throw new Error(`Expected Alice status in MongoDB to be 'online', got: ${aliceUserInDb1.status}`);
    }
    console.log('✅ Alice first connection broadcast user:online and updated MongoDB status to online.');

    // Alice opens Tab 2 (Second Connection - Multiple browser tabs/devices)
    const aliceSocketTab2 = createSocketClient(alice.token);
    await new Promise((resolve) => aliceSocketTab2.on('connect', resolve));
    console.log(`✅ Alice Tab 2 connected [socketId: ${aliceSocketTab2.id}]`);

    await new Promise((r) => setTimeout(r, 100));

    if (aliceOnlineCount !== 1) {
      throw new Error(`Expected NO duplicate user:online for second tab, but aliceOnlineCount is ${aliceOnlineCount}`);
    }
    if (presenceManager.getUserSocketCount(alice.user.id) !== 2) {
      throw new Error(`Expected PresenceManager to track 2 sockets for Alice, got ${presenceManager.getUserSocketCount(alice.user.id)}`);
    }
    console.log('✅ Multi-socket tracking verified: 2 concurrent sockets active without duplicate presence broadcasts.');

    // Alice closes Tab 1 (One of two connections closes)
    aliceSocketTab1.disconnect();
    await new Promise((r) => setTimeout(r, 100));

    if (aliceOfflineCount !== 0) {
      throw new Error('Alice should NOT be marked offline while Tab 2 remains active!');
    }
    const aliceUserInDb2 = await User.findById(alice.user.id);
    if (aliceUserInDb2.status !== 'online') {
      throw new Error('Alice status in DB should remain online while active sockets exist!');
    }
    console.log('✅ Closing Tab 1 kept Alice online because Tab 2 remains active.');

    // Alice closes Tab 2 (Final connection closes)
    aliceSocketTab2.disconnect();
    await new Promise((r) => setTimeout(r, 150));

    if (aliceOfflineCount !== 1) {
      throw new Error(`Expected Bob to receive user:offline on final disconnect, got: ${aliceOfflineCount}`);
    }
    const aliceUserInDb3 = await User.findById(alice.user.id);
    if (aliceUserInDb3.status !== 'offline') {
      throw new Error(`Expected Alice status in DB to be 'offline', got: ${aliceUserInDb3.status}`);
    }
    if (!aliceUserInDb3.lastSeen) {
      throw new Error('Expected lastSeen timestamp to be updated in MongoDB on final disconnect!');
    }
    console.log(`✅ Final disconnect marked Alice offline and updated lastSeen (${aliceUserInDb3.lastSeen.toISOString()}).`);

    // Test Security Guard: Prevent arbitrary status mutation from client
    let presenceError = null;
    bobSocket.emit('user:online', { userId: mallory.user.id });
    bobSocket.on('socket:error', (err) => {
      if (err.code === 'FORBIDDEN_PRESENCE_MUTATION') {
        presenceError = err;
      }
    });
    await new Promise((r) => setTimeout(r, 100));
    if (!presenceError) {
      throw new Error('Server allowed client to emit arbitrary presence status!');
    }
    console.log('✅ Security guard verified: Client arbitrary presence mutation rejected (FORBIDDEN_PRESENCE_MUTATION).\n');

    // Reconnect Alice for chat features
    const aliceSocket = createSocketClient(alice.token);
    await new Promise((resolve) => aliceSocket.on('connect', resolve));
    console.log(`✅ Alice reconnected for chat tests [socketId: ${aliceSocket.id}]`);

    // Both join conversation room
    await new Promise((resolve) => {
      aliceSocket.emit('conversation:join', { conversationId }, (ack) => {
        if (ack.status === 'ok') resolve();
      });
    });
    await new Promise((resolve) => {
      bobSocket.emit('conversation:join', { conversationId }, (ack) => {
        if (ack.status === 'ok') resolve();
      });
    });
    console.log(`✅ Alice and Bob joined conversation room ${conversationId}.\n`);

    // =========================================================
    // FEATURE A: Typing Indicators
    // =========================================================
    console.log('--- Step 3: Ephemeral Real-Time Typing Indicators ---');

    let bobReceivedTypingStart = null;
    let bobReceivedTypingStop = null;

    bobSocket.on('typing:start', (data) => {
      bobReceivedTypingStart = data;
    });
    bobSocket.on('typing:stop', (data) => {
      bobReceivedTypingStop = data;
    });

    // Alice starts typing
    aliceSocket.emit('typing:start', { conversationId });
    await new Promise((r) => setTimeout(r, 100));

    if (!bobReceivedTypingStart || bobReceivedTypingStart.userId !== alice.user.id) {
      throw new Error(`Bob did not receive typing:start from Alice: ${JSON.stringify(bobReceivedTypingStart)}`);
    }
    console.log(`✅ Bob received 'typing:start' from Alice: ${bobReceivedTypingStart.userName} is typing...`);

    // Alice stops typing
    aliceSocket.emit('typing:stop', { conversationId });
    await new Promise((r) => setTimeout(r, 100));

    if (!bobReceivedTypingStop || bobReceivedTypingStop.userId !== alice.user.id) {
      throw new Error(`Bob did not receive typing:stop from Alice: ${JSON.stringify(bobReceivedTypingStop)}`);
    }
    console.log('✅ Bob received \'typing:stop\' cleanly.');

    // Security: Mallory (unauthorized non-participant) tries to emit typing:start
    const mallorySocket = createSocketClient(mallory.token);
    await new Promise((resolve) => mallorySocket.on('connect', resolve));

    let malloryTypingError = null;
    bobReceivedTypingStart = null; // reset

    mallorySocket.on('socket:error', (err) => {
      if (err.code === 'FORBIDDEN_TYPING_ACCESS') {
        malloryTypingError = err;
      }
    });
    mallorySocket.emit('typing:start', { conversationId });
    await new Promise((r) => setTimeout(r, 100));

    if (!malloryTypingError) {
      throw new Error('Mallory was allowed to emit typing:start to unauthorized conversation!');
    }
    if (bobReceivedTypingStart !== null) {
      throw new Error('Bob received typing indicator from unauthorized user Mallory!');
    }
    console.log('✅ Unauthorized typing broadcast blocked (FORBIDDEN_TYPING_ACCESS).');

    // Verify zero database writes during typing
    const messageCount = await Message.countDocuments({ conversationId });
    if (messageCount !== 0) {
      throw new Error('Typing indicator resulted in DB message write!');
    }
    console.log('✅ Zero database writes confirmed for ephemeral typing events.\n');

    // =========================================================
    // FEATURE B: Read Receipts
    // =========================================================
    console.log('--- Step 4: Authoritative Read Receipts ---');

    // Alice sends a message via Socket.IO
    let sentMessage = null;
    await new Promise((resolve) => {
      aliceSocket.emit(
        'message:send',
        { conversationId, text: 'Hey Bob, did you get the class notes?', clientMessageId: 'p9_msg_1' },
        (res) => {
          sentMessage = res.message;
          resolve();
        }
      );
    });

    if (!sentMessage || !sentMessage._id) {
      throw new Error(`Failed to send message: ${JSON.stringify(sentMessage)}`);
    }
    console.log(`✅ Alice sent message [ID: ${sentMessage._id}]: "${sentMessage.text}"`);

    // Verify initial message state in DB (status: 'sent', readBy: [Alice])
    const msgInDbBefore = await Message.findById(sentMessage._id);
    if (msgInDbBefore.status !== 'sent' || msgInDbBefore.readBy.length !== 1) {
      throw new Error(`Unexpected initial message read status: ${msgInDbBefore.status}`);
    }

    // Alice listens for Bob's read receipt
    let aliceReceivedReadReceipt = null;
    let aliceReceivedStatusUpdate = null;
    aliceSocket.on('message:read', (data) => {
      aliceReceivedReadReceipt = data;
    });
    aliceSocket.on('message_status_updated', (data) => {
      aliceReceivedStatusUpdate = data;
    });

    // Bob marks message as read
    let bobReadAck = null;
    await new Promise((resolve) => {
      bobSocket.emit('message:read', { conversationId, messageId: sentMessage._id }, (ack) => {
        bobReadAck = ack;
        resolve();
      });
    });

    await new Promise((r) => setTimeout(r, 100));

    if (!bobReadAck || bobReadAck.status !== 'ok') {
      throw new Error(`Bob read acknowledgement failed: ${JSON.stringify(bobReadAck)}`);
    }
    if (!aliceReceivedReadReceipt || aliceReceivedReadReceipt.readBy !== bob.user.id) {
      throw new Error(`Alice did not receive message:read receipt: ${JSON.stringify(aliceReceivedReadReceipt)}`);
    }
    if (!aliceReceivedStatusUpdate || aliceReceivedStatusUpdate.status !== 'read') {
      throw new Error(`Alice did not receive message_status_updated: ${JSON.stringify(aliceReceivedStatusUpdate)}`);
    }

    // Verify database state: readBy contains Bob and status is 'read'
    const msgInDbAfter = await Message.findById(sentMessage._id);
    const readByStrings = msgInDbAfter.readBy.map((id) => id.toString());
    if (!readByStrings.includes(bob.user.id) || msgInDbAfter.status !== 'read') {
      throw new Error(`MongoDB message read status not updated properly: readBy=${readByStrings}, status=${msgInDbAfter.status}`);
    }
    console.log(`✅ Read receipt verified: Alice received 'message:read' and 'message_status_updated' from Bob.`);
    console.log(`✅ MongoDB Message updated: status='read', readBy=[${readByStrings.join(', ')}]`);

    // Security: Mallory tries to mark Alice's message as read
    let malloryReadError = null;
    mallorySocket.on('socket:error', (err) => {
      if (err.code === 'FORBIDDEN_READ_RECEIPT') {
        malloryReadError = err;
      }
    });
    mallorySocket.emit('message:read', { conversationId, messageId: sentMessage._id });
    await new Promise((r) => setTimeout(r, 100));

    if (!malloryReadError) {
      throw new Error('Mallory was allowed to update read receipts for an unauthorized conversation!');
    }
    console.log('✅ Unauthorized read receipt blocked (FORBIDDEN_READ_RECEIPT).\n');

    // =========================================================
    // FEATURE D: Message Updates (Edit & Delete)
    // =========================================================
    console.log('--- Step 5: Real-Time Message Updates (Edit & Delete) ---');

    let bobReceivedMessageUpdate = null;
    let bobReceivedMessageDelete = null;

    bobSocket.on('message:updated', (data) => {
      bobReceivedMessageUpdate = data;
    });
    bobSocket.on('message:deleted', (data) => {
      bobReceivedMessageDelete = data;
    });

    // 1. Alice edits her message
    await new Promise((resolve) => {
      aliceSocket.emit(
        'message:update',
        { messageId: sentMessage._id, text: 'Hey Bob, did you get the updated class notes? (Edited)' },
        (res) => {
          if (res.status === 'ok') resolve();
        }
      );
    });

    await new Promise((r) => setTimeout(r, 100));

    if (
      !bobReceivedMessageUpdate ||
      bobReceivedMessageUpdate.messageId !== sentMessage._id.toString() ||
      !bobReceivedMessageUpdate.text.includes('(Edited)')
    ) {
      throw new Error(`Bob did not receive message:updated: ${JSON.stringify(bobReceivedMessageUpdate)}`);
    }
    console.log(`✅ Bob received 'message:updated': "${bobReceivedMessageUpdate.text}"`);

    // 2. Non-author edit guard: Bob tries to edit Alice's message
    let bobEditError = null;
    bobSocket.on('socket:error', (err) => {
      if (err.code === 'FORBIDDEN_EDIT_MESSAGE') {
        bobEditError = err;
      }
    });
    bobSocket.emit('message:update', { messageId: sentMessage._id, text: 'Hacked by Bob' });
    await new Promise((r) => setTimeout(r, 100));

    if (!bobEditError) {
      throw new Error('Non-author Bob was allowed to edit Alice\'s message!');
    }
    console.log('✅ Non-author edit blocked (FORBIDDEN_EDIT_MESSAGE).');

    // 3. Alice soft-deletes her message
    await new Promise((resolve) => {
      aliceSocket.emit('message:delete', { messageId: sentMessage._id, mode: 'soft' }, (res) => {
        if (res.status === 'ok') resolve();
      });
    });

    await new Promise((r) => setTimeout(r, 100));

    if (
      !bobReceivedMessageDelete ||
      bobReceivedMessageDelete.messageId !== sentMessage._id.toString() ||
      bobReceivedMessageDelete.text !== 'This message was deleted'
    ) {
      throw new Error(`Bob did not receive message:deleted: ${JSON.stringify(bobReceivedMessageDelete)}`);
    }
    console.log(`✅ Bob received 'message:deleted': "${bobReceivedMessageDelete.text}" (mode: soft)`);

    // Verify in MongoDB: message text masked, isDeleted=true
    const deletedInDb = await Message.findById(sentMessage._id);
    if (!deletedInDb.isDeleted || deletedInDb.text !== 'This message was deleted') {
      throw new Error('Message in MongoDB was not soft-deleted!');
    }
    console.log('✅ Database state verified: soft-deletion tombstone applied.');

    // 4. Non-author delete guard: Mallory tries to delete Alice's message
    let malloryDeleteError = null;
    mallorySocket.on('socket:error', (err) => {
      if (err.code === 'FORBIDDEN_DELETE_MESSAGE') {
        malloryDeleteError = err;
      }
    });
    mallorySocket.emit('message:delete', { messageId: sentMessage._id, mode: 'hard' });
    await new Promise((r) => setTimeout(r, 100));

    if (!malloryDeleteError) {
      throw new Error('Mallory was allowed to delete Alice\'s message!');
    }
    console.log('✅ Non-author delete blocked (FORBIDDEN_DELETE_MESSAGE).\n');

    // =========================================================
    // Clean Disconnect
    // =========================================================
    aliceSocket.disconnect();
    bobSocket.disconnect();
    mallorySocket.disconnect();
    console.log('✅ Disconnected all client sockets cleanly.');

    console.log('🎉 ========================================================');
    console.log('🎉 ALL PHASE 9 ADVANCED CHAT FEATURE TESTS PASSED!');
    console.log('🎉 ========================================================\n');
  } catch (error) {
    console.error('❌ PHASE 9 TEST RUNNER FAILED:', error);
    process.exitCode = 1;
  } finally {
    if (ioServer) ioServer.close();
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    await mongoose.disconnect();
    console.log('🛑 Closed HTTP server and MongoDB connection.\n');
  }
}

runPhase9Tests();
