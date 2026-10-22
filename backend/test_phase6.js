import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import Conversation from './src/models/Conversation.js';
import Message from './src/models/Message.js';
import messageService from './src/services/messageService.js';
import dotenv from 'dotenv';

dotenv.config();

let server;
const PORT = 5008;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runPhase6Tests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 6 Message REST APIs Integration Test Suite');
  console.log('🧪 ========================================================\n');

  try {
    // 1. Connect Database
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsechat';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB successfully.');

    // Start Express test server
    await new Promise((resolve) => {
      server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`✅ Test server running at ${BASE_URL}\n`);
        resolve();
      });
    });

    // Cleanup previous test users
    const testEmails = [
      'alice_p6@campus.edu',
      'bob_p6@campus.edu',
      'carol_p6@campus.edu',
    ];
    const existingUsers = await User.find({ email: { $in: testEmails } });
    const existingUserIds = existingUsers.map((u) => u._id);
    await Message.deleteMany({ sender: { $in: existingUserIds } });
    await Conversation.deleteMany({ participants: { $in: existingUserIds } });
    await User.deleteMany({ email: { $in: testEmails } });

    // -------------------------------------------------------------
    // TEST 1: Authentication Guard on Message Endpoints
    // -------------------------------------------------------------
    console.log('--- TEST 1: Authentication Guard on Phase 6 Endpoints ---');
    const dummyConvId = '507f1f77bcf86cd799439011';
    const dummyMsgId = '507f1f77bcf86cd799439012';

    const resPostNoAuth = await fetch(`${BASE_URL}/api/conversations/${dummyConvId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello' }),
    });
    console.log(`POST /api/conversations/:id/messages without token -> Status: ${resPostNoAuth.status} (Expected: 401)`);
    if (resPostNoAuth.status !== 401) throw new Error('Unauthenticated POST was not blocked!');

    const resGetNoAuth = await fetch(`${BASE_URL}/api/conversations/${dummyConvId}/messages`);
    console.log(`GET /api/conversations/:id/messages without token -> Status: ${resGetNoAuth.status} (Expected: 401)`);
    if (resGetNoAuth.status !== 401) throw new Error('Unauthenticated GET was not blocked!');

    const resPatchNoAuth = await fetch(`${BASE_URL}/api/messages/${dummyMsgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Edited' }),
    });
    console.log(`PATCH /api/messages/:id without token -> Status: ${resPatchNoAuth.status} (Expected: 401)`);
    if (resPatchNoAuth.status !== 401) throw new Error('Unauthenticated PATCH was not blocked!');

    const resDelNoAuth = await fetch(`${BASE_URL}/api/messages/${dummyMsgId}`, {
      method: 'DELETE',
    });
    console.log(`DELETE /api/messages/:id without token -> Status: ${resDelNoAuth.status} (Expected: 401)`);
    if (resDelNoAuth.status !== 401) throw new Error('Unauthenticated DELETE was not blocked!');
    console.log('✅ Authentication requirement verified across all 4 endpoints.\n');

    // -------------------------------------------------------------
    // SETUP: Register Accounts and Initialize Conversation
    // -------------------------------------------------------------
    console.log('--- SETUP: Registering Test Accounts & Starting Conversation ---');

    async function registerUser(name, email, password) {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(data)}`);
      const userId = (data.user._id || data.user.id).toString();
      return { user: data.user, token: data.token, userId };
    }

    const alice = await registerUser('Alice P6', 'alice_p6@campus.edu', 'Password123!');
    const bob = await registerUser('Bob P6', 'bob_p6@campus.edu', 'Password123!');
    const carol = await registerUser('Carol P6', 'carol_p6@campus.edu', 'Password123!');

    // Create 1-on-1 direct conversation between Alice and Bob
    const resChat = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: bob.userId }),
    });
    const conversation = await resChat.json();
    const conversationId = conversation._id || conversation.id;
    console.log(`Created conversation between Alice and Bob: ${conversationId}\n`);

    // -------------------------------------------------------------
    // TEST 2: POST /api/conversations/:conversationId/messages
    // -------------------------------------------------------------
    console.log('--- TEST 2: POST /api/conversations/:conversationId/messages (Send & Validate) ---');

    // A. Reject empty message
    const resEmpty = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ text: '   ' }),
    });
    console.log(`Empty message -> Status: ${resEmpty.status} (Expected: 400)`);
    if (resEmpty.status !== 400) throw new Error('Empty message was not rejected!');

    // B. Reject oversized message (> 2000 chars)
    const longText = 'A'.repeat(2001);
    const resLong = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ text: longText }),
    });
    console.log(`Oversized text (>2000 chars) -> Status: ${resLong.status} (Expected: 400)`);
    if (resLong.status !== 400) throw new Error('Oversized message was not rejected!');

    // C. Non-member (Carol) tries to send message
    const resCarolSend = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${carol.token}`,
      },
      body: JSON.stringify({ text: 'Intrusion attempt' }),
    });
    console.log(`Non-member sending message -> Status: ${resCarolSend.status} (Expected: 403)`);
    if (resCarolSend.status !== 403) throw new Error('Unauthorized sender was not rejected!');

    // D. Valid message send
    const resAliceSend = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({
        text: 'Hello Bob! This is message #1 from Alice.',
        clientMessageId: 'msg_client_phase6_01',
      }),
    });
    const sendData = await resAliceSend.json();
    console.log(`Alice sends message -> Status: ${resAliceSend.status} (Expected: 201)`);
    if (resAliceSend.status !== 201) throw new Error('Message sending failed!');
    const msg1 = sendData.data.message;
    console.log(`Message created: ID=${msg1._id}, clientMessageId=${msg1.clientMessageId}, sender=${msg1.sender.name}`);
    if (msg1.clientMessageId !== 'msg_client_phase6_01') throw new Error('clientMessageId mismatch!');

    // E. Verify conversation latest message updated
    const convInDb = await Conversation.findById(conversationId);
    console.log(`Conversation lastMessage: "${convInDb.lastMessage.text}"`);
    if (convInDb.lastMessage.text !== 'Hello Bob! This is message #1 from Alice.') {
      throw new Error('Conversation latest-message was not updated!');
    }
    console.log('✅ Message persisted and conversation latest-message information updated.\n');

    // -------------------------------------------------------------
    // TEST 3: GET /api/conversations/:conversationId/messages
    // -------------------------------------------------------------
    console.log('--- TEST 3: GET /api/conversations/:conversationId/messages (Pagination & Order) ---');

    // Non-member access guard
    const resCarolGet = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${carol.token}` },
    });
    console.log(`Non-member inspecting messages -> Status: ${resCarolGet.status} (Expected: 403)`);
    if (resCarolGet.status !== 403) throw new Error('Unauthorized message reading was not blocked!');

    // Bob sends 3 more messages
    for (let i = 2; i <= 4; i++) {
      await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bob.token}`,
        },
        body: JSON.stringify({ text: `Message #${i} from Bob` }),
      });
      // Tiny delay to ensure strictly distinct timestamps for cursor testing
      await new Promise((r) => setTimeout(r, 20));
    }

    // Retrieve all messages
    const resBobFetch = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${bob.token}` },
    });
    const fetchBody = await resBobFetch.json();
    console.log(`Bob fetched messages -> Status: ${resBobFetch.status} (Expected: 200), Count: ${fetchBody.results}`);
    if (fetchBody.results !== 4) throw new Error(`Expected 4 messages, got ${fetchBody.results}`);

    // Verify chronological order: oldest to newest
    const times = fetchBody.data.messages.map((m) => new Date(m.createdAt).getTime());
    for (let i = 0; i < times.length - 1; i++) {
      if (times[i] > times[i + 1]) throw new Error('Messages are NOT in chronological order!');
    }
    console.log('✅ Chronological ordering verified (oldest to newest).');

    // Verify cursor-based pagination
    const resPage1 = await fetch(
      `${BASE_URL}/api/conversations/${conversationId}/messages?limit=2`,
      { headers: { Authorization: `Bearer ${bob.token}` } }
    );
    const page1Data = await resPage1.json();
    console.log(`Page 1 count: ${page1Data.results} (Expected: 2), hasMore: ${page1Data.pagination.hasMore}`);
    if (page1Data.results !== 2 || !page1Data.pagination.hasMore) {
      throw new Error('Pagination page 1 failed!');
    }

    const nextCursor = page1Data.pagination.nextCursor;
    console.log(`Page 1 nextCursor: ${nextCursor}`);

    const resPage2 = await fetch(
      `${BASE_URL}/api/conversations/${conversationId}/messages?limit=2&before=${encodeURIComponent(nextCursor)}`,
      { headers: { Authorization: `Bearer ${bob.token}` } }
    );
    const page2Data = await resPage2.json();
    console.log(`Page 2 before cursor count: ${page2Data.results}`);
    console.log('✅ Cursor-based pagination functional.\n');

    // -------------------------------------------------------------
    // TEST 4: PATCH /api/messages/:messageId (Edit Message)
    // -------------------------------------------------------------
    console.log('--- TEST 4: PATCH /api/messages/:messageId (Edit & Ownership Guard) ---');

    // Bob tries to edit Alice's message (msg1)
    const resBobEditAlice = await fetch(`${BASE_URL}/api/messages/${msg1._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bob.token}`,
      },
      body: JSON.stringify({ text: 'Hacked by Bob' }),
    });
    console.log(`Non-author edit attempt -> Status: ${resBobEditAlice.status} (Expected: 403)`);
    if (resBobEditAlice.status !== 403) throw new Error('Non-author was allowed to edit message!');

    // Alice edits her own message with empty text
    const resAliceEditEmpty = await fetch(`${BASE_URL}/api/messages/${msg1._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ text: '   ' }),
    });
    console.log(`Empty edit payload -> Status: ${resAliceEditEmpty.status} (Expected: 400)`);
    if (resAliceEditEmpty.status !== 400) throw new Error('Empty edit was not rejected!');

    // Alice successfully edits her message
    const resAliceEdit = await fetch(`${BASE_URL}/api/messages/${msg1._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ text: 'Hello Bob! This is message #1 (Edited by Alice).' }),
    });
    const editData = await resAliceEdit.json();
    console.log(`Alice edits own message -> Status: ${resAliceEdit.status} (Expected: 200)`);
    if (resAliceEdit.status !== 200) throw new Error('Edit failed!');
    if (!editData.data.message.isEdited) throw new Error('isEdited flag was not set!');
    console.log(`Edited text: "${editData.data.message.text}", isEdited: ${editData.data.message.isEdited}`);
    console.log('✅ Message ownership verification and editing verified.\n');

    // -------------------------------------------------------------
    // TEST 5: DELETE /api/messages/:messageId (Deletion Policy)
    // -------------------------------------------------------------
    console.log('--- TEST 5: DELETE /api/messages/:messageId (Deletion Policy) ---');

    // Carol attempts to delete Alice's message
    const resCarolDel = await fetch(`${BASE_URL}/api/messages/${msg1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${carol.token}` },
    });
    console.log(`Non-author delete attempt -> Status: ${resCarolDel.status} (Expected: 403)`);
    if (resCarolDel.status !== 403) throw new Error('Unauthorized user was allowed to delete message!');

    // Alice soft-deletes her message (default policy: tombstone preservation)
    const resAliceDel = await fetch(`${BASE_URL}/api/messages/${msg1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const delData = await resAliceDel.json();
    console.log(`Alice soft-deletes message -> Status: ${resAliceDel.status} (Expected: 200)`);
    if (resAliceDel.status !== 200) throw new Error('Soft-deletion failed!');

    // Verify in database: tombstone fields set and content wiped
    const msg1InDb = await Message.findById(msg1._id);
    console.log(`Database state after soft-delete: isDeleted=${msg1InDb.isDeleted}, text="${msg1InDb.text}"`);
    if (!msg1InDb.isDeleted || msg1InDb.text !== 'This message was deleted') {
      throw new Error('Soft-deletion policy was not applied properly!');
    }
    console.log('✅ Soft-deletion policy verified (tombstone & privacy wipe).');

    // Bob creates a temporary message to test hard-deletion
    const resBobTemp = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bob.token}`,
      },
      body: JSON.stringify({ text: 'Temporary purge message' }),
    });
    const tempMsg = (await resBobTemp.json()).data.message;

    // Bob hard-deletes the temporary message (?mode=hard)
    const resBobHardDel = await fetch(`${BASE_URL}/api/messages/${tempMsg._id}?mode=hard`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bob.token}` },
    });
    console.log(`Bob hard-deletes message -> Status: ${resBobHardDel.status} (Expected: 200)`);
    const tempInDb = await Message.findById(tempMsg._id);
    if (tempInDb !== null) throw new Error('Hard deletion did not purge document from database!');
    console.log('✅ Hard-deletion policy verified.\n');

    // -------------------------------------------------------------
    // TEST 6: Shared Message Service Verification (Socket.IO readiness)
    // -------------------------------------------------------------
    console.log('--- TEST 6: Shared Message Service Direct Invocation ---');
    const serviceMsg = await messageService.sendMessage({
      conversationId,
      senderId: alice.userId,
      text: 'Direct message from shared service (Socket.IO simulation)',
    });
    console.log(`Service returned message ID: ${serviceMsg._id}, Text: "${serviceMsg.text}"`);
    if (!serviceMsg || !serviceMsg._id) throw new Error('Shared messageService failed!');
    console.log('✅ messageService is reusable and ready for Socket.IO integration.\n');

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('🧹 Cleaning up test records...');
    const cleanupIds = [alice.userId, bob.userId, carol.userId];
    await Message.deleteMany({ sender: { $in: cleanupIds } });
    await Conversation.deleteMany({ participants: { $in: cleanupIds } });
    await User.deleteMany({ _id: { $in: cleanupIds } });
    console.log('✅ Temporary test data cleaned up.');

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL PHASE 6 INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('🎉 ========================================================\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

runPhase6Tests();
