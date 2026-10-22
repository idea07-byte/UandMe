import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import Conversation from './src/models/Conversation.js';
import Message from './src/models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

let server;
const PORT = 5006;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 5 Conversations & Messaging Test Suite');
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

    // Clean up any existing test records
    const testEmails = [
      'alice_p5@campus.edu',
      'bob_p5@campus.edu',
      'carol_p5@campus.edu',
      'dave_p5@campus.edu',
    ];
    const existingUsers = await User.find({ email: { $in: testEmails } });
    const existingUserIds = existingUsers.map((u) => u._id);

    await Message.deleteMany({ sender: { $in: existingUserIds } });
    await Conversation.deleteMany({ participants: { $in: existingUserIds } });
    await User.deleteMany({ email: { $in: testEmails } });

    // -------------------------------------------------------------
    // TEST 1: Unauthenticated Requests (Protected Endpoint Barrier)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Authentication Guard on Chat & Message Routes ---');
    const resChatsNoAuth = await fetch(`${BASE_URL}/api/chats`);
    console.log(`GET /api/chats without token -> Status: ${resChatsNoAuth.status} (Expected: 401)`);
    if (resChatsNoAuth.status !== 401) throw new Error('Unauthenticated /api/chats was not blocked!');

    const resMsgNoAuth = await fetch(`${BASE_URL}/api/messages/507f1f77bcf86cd799439011`);
    console.log(`GET /api/messages/:id without token -> Status: ${resMsgNoAuth.status} (Expected: 401)`);
    if (resMsgNoAuth.status !== 401) throw new Error('Unauthenticated /api/messages was not blocked!');
    console.log('✅ Access denied for unauthenticated requests as required.\n');

    // -------------------------------------------------------------
    // SETUP: Register Test Accounts
    // -------------------------------------------------------------
    console.log('--- SETUP: Registering Test Accounts ---');

    async function registerUser(name, email, password) {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.status !== 201) throw new Error(`Registration failed for ${email}: ${JSON.stringify(data)}`);
      const userId = (data.user._id || data.user.id).toString();
      return { user: data.user, token: data.token, userId };
    }

    const alice = await registerUser('Alice P5', 'alice_p5@campus.edu', 'Password123!');
    const bob = await registerUser('Bob P5', 'bob_p5@campus.edu', 'Password123!');
    const carol = await registerUser('Carol P5', 'carol_p5@campus.edu', 'Password123!');
    const dave = await registerUser('Dave P5', 'dave_p5@campus.edu', 'Password123!');

    console.log(`Registered Alice (${alice.userId})`);
    console.log(`Registered Bob (${bob.userId})`);
    console.log(`Registered Carol (${carol.userId})`);
    console.log(`Registered Dave (${dave.userId})\n`);

    // -------------------------------------------------------------
    // TEST 2: 1-on-1 Direct Chat Access / Creation & Deduplication
    // -------------------------------------------------------------
    console.log('--- TEST 2: Direct 1-on-1 Conversation Creation & Deduplication ---');

    // A. Invalid requests
    const resSelfChat = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: alice.userId }),
    });
    console.log(`Attempt to chat with self -> Status: ${resSelfChat.status} (Expected: 400)`);
    if (resSelfChat.status !== 400) throw new Error('Self conversation creation was not blocked!');

    const resInvalidId = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: 'not-a-valid-id' }),
    });
    console.log(`Attempt with invalid ObjectId -> Status: ${resInvalidId.status} (Expected: 400)`);
    if (resInvalidId.status !== 400) throw new Error('Invalid ObjectId was not blocked!');

    // B. Create fresh 1-on-1 chat between Alice & Bob
    const resCreateChat = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: bob.userId }),
    });
    const chatAliceBob = await resCreateChat.json();
    console.log(`Create direct chat -> Status: ${resCreateChat.status} (Expected: 201), ID: ${chatAliceBob._id}`);
    if (resCreateChat.status !== 201) throw new Error('Direct chat creation failed!');
    if (chatAliceBob.participants.length !== 2) throw new Error('Expected 2 participants');
    console.log('✅ Direct chat created with populated participants.');

    // C. Deduplication: Requesting the same user returns existing chat
    const resDupChat = await fetch(`${BASE_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: bob.userId }),
    });
    const chatAliceBobDup = await resDupChat.json();
    console.log(`Deduplication test -> Status: ${resDupChat.status} (Expected: 200), ID: ${chatAliceBobDup._id}`);
    if (resDupChat.status !== 200 || chatAliceBobDup._id !== chatAliceBob._id) {
      throw new Error('Deduplication failed: did not return identical conversation ID!');
    }
    console.log('✅ Deduplication confirmed: same conversation returned.\n');

    // -------------------------------------------------------------
    // TEST 3: Group Chat Creation & Validation
    // -------------------------------------------------------------
    console.log('--- TEST 3: Group Chat Creation & Membership Validation ---');

    // Missing title
    const resGroupNoTitle = await fetch(`${BASE_URL}/api/chats/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({
        participants: [bob.userId, carol.userId],
      }),
    });
    console.log(`Group without title -> Status: ${resGroupNoTitle.status} (Expected: 400)`);
    if (resGroupNoTitle.status !== 400) throw new Error('Group without title was not rejected!');

    // Less than 2 other members
    const resGroupTooFew = await fetch(`${BASE_URL}/api/chats/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({
        name: 'AI Study Group',
        participants: [bob.userId],
      }),
    });
    console.log(`Group with only 1 other member -> Status: ${resGroupTooFew.status} (Expected: 400)`);
    if (resGroupTooFew.status !== 400) throw new Error('Group with too few members was not rejected!');

    // Valid group: Alice, Bob, Carol
    const resCreateGroup = await fetch(`${BASE_URL}/api/chats/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({
        name: 'Distributed Systems Capstone',
        participants: [bob.userId, carol.userId],
      }),
    });
    const groupChat = await resCreateGroup.json();
    console.log(`Create group -> Status: ${resCreateGroup.status} (Expected: 201), Name: "${groupChat.name}"`);
    if (resCreateGroup.status !== 201) throw new Error('Group chat creation failed!');
    if (!groupChat.isGroup || groupChat.participants.length !== 3) {
      throw new Error('Group chat metadata invalid');
    }
    console.log(`✅ Group created successfully with admin: ${groupChat.admin.name} and 3 participants.\n`);

    // -------------------------------------------------------------
    // TEST 4: Authorization Barrier on Private Chats
    // -------------------------------------------------------------
    console.log('--- TEST 4: Privacy & Authorization Guard on Private Chats ---');

    // Carol tries to access Alice & Bob's direct chat
    const resCarolSnoop = await fetch(`${BASE_URL}/api/chats/${chatAliceBob._id}`, {
      headers: { Authorization: `Bearer ${carol.token}` },
    });
    console.log(`Carol accessing Alice-Bob chat -> Status: ${resCarolSnoop.status} (Expected: 403)`);
    if (resCarolSnoop.status !== 403) throw new Error('Unauthorized conversation inspection was not blocked!');

    // Carol tries to fetch messages from Alice & Bob's direct chat
    const resCarolMsgSnoop = await fetch(`${BASE_URL}/api/messages/${chatAliceBob._id}`, {
      headers: { Authorization: `Bearer ${carol.token}` },
    });
    console.log(`Carol reading messages from Alice-Bob chat -> Status: ${resCarolMsgSnoop.status} (Expected: 403)`);
    if (resCarolMsgSnoop.status !== 403) throw new Error('Unauthorized message reading was not blocked!');
    console.log('✅ Privacy verified: Non-participants cannot view conversation metadata or messages.\n');

    // -------------------------------------------------------------
    // TEST 5: Messaging (Send, Reconcile, Validation)
    // -------------------------------------------------------------
    console.log('--- TEST 5: Message Sending, Validation & Last Message Update ---');

    // Empty message validation
    const resEmptyMsg = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({
        chatId: chatAliceBob._id,
        text: '   ',
      }),
    });
    console.log(`Sending empty message -> Status: ${resEmptyMsg.status} (Expected: 400)`);
    if (resEmptyMsg.status !== 400) throw new Error('Empty message was not rejected!');

    // Alice sends valid message
    const resAliceMsg = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({
        chatId: chatAliceBob._id,
        text: 'Hello Bob! Are you ready to review the Capstone PR?',
        clientMessageId: 'client_msg_1001',
      }),
    });
    const msgAlice = await resAliceMsg.json();
    console.log(`Alice sends message -> Status: ${resAliceMsg.status} (Expected: 201), ID: ${msgAlice._id}`);
    if (resAliceMsg.status !== 201) throw new Error('Sending message failed!');
    if (msgAlice.clientMessageId !== 'client_msg_1001') throw new Error('clientMessageId was not persisted!');
    if (!msgAlice.sender || msgAlice.sender.name !== 'Alice P5') throw new Error('Sender was not populated!');

    // Verify conversation lastMessage was updated
    const resChatCheck = await fetch(`${BASE_URL}/api/chats/${chatAliceBob._id}`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const chatChecked = await resChatCheck.json();
    console.log(`Verified lastMessage snippet: "${chatChecked.lastMessage.text}"`);
    if (chatChecked.lastMessage.text !== 'Hello Bob! Are you ready to review the Capstone PR?') {
      throw new Error('Conversation lastMessage was not synchronized!');
    }
    console.log('✅ Message persisted and conversation lastMessage updated.\n');

    // -------------------------------------------------------------
    // TEST 6: Message History Retrieval & Read Receipt Synchronization
    // -------------------------------------------------------------
    console.log('--- TEST 6: Message History & Read Receipts ---');

    // Bob sends a reply
    const resBobMsg = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bob.token}`,
      },
      body: JSON.stringify({
        chatId: chatAliceBob._id,
        text: 'Hey Alice! Yes, checking the PR right now 🚀',
      }),
    });
    const msgBob = await resBobMsg.json();
    console.log(`Bob replies -> Status: ${resBobMsg.status} (Expected: 201)`);

    // Bob fetches messages: Alice's incoming message should be automatically marked as read
    const resGetMessages = await fetch(`${BASE_URL}/api/messages/${chatAliceBob._id}`, {
      headers: { Authorization: `Bearer ${bob.token}` },
    });
    const messageList = await resGetMessages.json();
    console.log(`Bob fetched ${messageList.length} messages (Expected: 2)`);
    if (messageList.length !== 2) throw new Error('Expected 2 messages in conversation history');

    const aliceMsgInList = messageList.find((m) => m._id === msgAlice._id);
    console.log(`Alice message read status after Bob viewed it: "${aliceMsgInList.status}" (Expected: read)`);
    if (aliceMsgInList.status !== 'read') throw new Error('Incoming message was not marked read!');

    // Test nested route compatibility: GET /api/chats/:id/messages
    const resNestedMessages = await fetch(`${BASE_URL}/api/chats/${chatAliceBob._id}/messages`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const nestedList = await resNestedMessages.json();
    console.log(`Alice fetched via nested route /api/chats/:id/messages: ${nestedList.length} messages`);
    if (nestedList.length !== 2) throw new Error('Nested route did not return identical messages!');
    console.log('✅ Message retrieval and read receipts fully functional.\n');

    // -------------------------------------------------------------
    // TEST 7: Conversation Preferences (Pin, Mute, Archive)
    // -------------------------------------------------------------
    console.log('--- TEST 7: Conversation Preferences & Pinned Sorting ---');

    // Alice pins the group conversation
    const resPin = await fetch(`${BASE_URL}/api/chats/${groupChat._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ pinned: true }),
    });
    const pinnedChat = await resPin.json();
    console.log(`Alice pins group chat -> pinned: ${pinnedChat.pinned} (Expected: true)`);
    if (!pinnedChat.pinned) throw new Error('Pinning conversation failed!');

    // Alice retrieves all conversations: pinned group should be listed FIRST
    const resAliceChats = await fetch(`${BASE_URL}/api/chats`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const aliceChats = await resAliceChats.json();
    console.log(`Alice conversation list count: ${aliceChats.length}`);
    console.log(`First conversation in list: "${aliceChats[0].name}" (isGroup: ${aliceChats[0].isGroup})`);
    if (aliceChats[0]._id !== groupChat._id) {
      throw new Error('Pinned conversation did not float to top of directory!');
    }
    console.log('✅ Pinned sorting verified.');

    // Alice archives the direct chat
    await fetch(`${BASE_URL}/api/chats/${chatAliceBob._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ archived: true }),
    });

    // Active view should now only have 1 chat (the unarchived group chat)
    const resActiveChats = await fetch(`${BASE_URL}/api/chats?view=chats`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const activeChats = await resActiveChats.json();
    console.log(`Active chats count after archive: ${activeChats.length} (Expected: 1)`);
    if (activeChats.length !== 1 || activeChats[0]._id !== groupChat._id) {
      throw new Error('Archived conversation was not excluded from active inbox view!');
    }

    // Archived view should have the archived direct chat
    const resArchivedChats = await fetch(`${BASE_URL}/api/chats?view=archived`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const archivedChats = await resArchivedChats.json();
    console.log(`Archived chats count: ${archivedChats.length} (Expected: 1)`);
    if (archivedChats.length !== 1 || archivedChats[0]._id !== chatAliceBob._id) {
      throw new Error('Archived view did not contain the archived conversation!');
    }
    console.log('✅ Archive and active inbox separation verified.\n');

    // -------------------------------------------------------------
    // TEST 8: Group Membership Controls (Add / Remove)
    // -------------------------------------------------------------
    console.log('--- TEST 8: Group Member Management ---');

    // Non-admin (Bob) tries to add Dave
    const resBobAddDave = await fetch(`${BASE_URL}/api/chats/${groupChat._id}/participants`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bob.token}`,
      },
      body: JSON.stringify({ userId: dave.userId, action: 'add' }),
    });
    console.log(`Non-admin attempting to add member -> Status: ${resBobAddDave.status} (Expected: 403)`);
    if (resBobAddDave.status !== 403) throw new Error('Non-admin add participant was not blocked!');

    // Admin (Alice) adds Dave
    const resAliceAddDave = await fetch(`${BASE_URL}/api/chats/${groupChat._id}/participants`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: dave.userId, action: 'add' }),
    });
    const groupWithDave = await resAliceAddDave.json();
    console.log(`Admin adds Dave -> Status: ${resAliceAddDave.status} (Expected: 200), Member count: ${groupWithDave.participants.length}`);
    if (resAliceAddDave.status !== 200 || groupWithDave.participants.length !== 4) {
      throw new Error('Adding participant to group failed!');
    }
    console.log('✅ Group admin participant management verified.\n');

    // -------------------------------------------------------------
    // TEST 9: Message & Conversation Deletion
    // -------------------------------------------------------------
    console.log('--- TEST 9: Message Deletion & Leaving Conversations ---');

    // Bob leaves the group conversation
    const resBobLeave = await fetch(`${BASE_URL}/api/chats/${groupChat._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bob.token}` },
    });
    const bobLeaveData = await resBobLeave.json();
    console.log(`Bob leaves group -> Status: ${resBobLeave.status} (Expected: 200), Message: "${bobLeaveData.message}"`);
    if (resBobLeave.status !== 200) throw new Error('Leaving group failed!');

    // Verify Bob is no longer in group participants
    const resGroupAfterLeave = await fetch(`${BASE_URL}/api/chats/${groupChat._id}`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const groupAfterLeave = await resGroupAfterLeave.json();
    console.log(`Group participants after Bob left: ${groupAfterLeave.participants.length} (Expected: 3)`);
    if (groupAfterLeave.participants.some((p) => (p._id || p).toString() === bob.userId)) {
      throw new Error('User was not removed from group participants!');
    }

    // Alice deletes her message
    const resDelMsg = await fetch(`${BASE_URL}/api/messages/${msgAlice._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    console.log(`Alice deletes message -> Status: ${resDelMsg.status} (Expected: 200)`);
    if (resDelMsg.status !== 200) throw new Error('Message deletion failed!');

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n🧹 Cleaning up temporary test records...');
    const cleanupUserIds = [alice.userId, bob.userId, carol.userId, dave.userId];
    await Message.deleteMany({ sender: { $in: cleanupUserIds } });
    await Conversation.deleteMany({ participants: { $in: cleanupUserIds } });
    await User.deleteMany({ _id: { $in: cleanupUserIds } });
    console.log('✅ Temporary test data cleaned up.');

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL PHASE 5 INTEGRATION TESTS PASSED PERFECTLY!');
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

runTests();
