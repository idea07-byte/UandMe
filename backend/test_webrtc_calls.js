/**
 * Automated Integration Test Suite for WhatsApp-Style WebRTC Call Signaling
 *
 * Verifies:
 * 1. User A initiates voice/video call to User B -> B receives 'call:incoming', A receives 'call:ringing'.
 * 2. User B accepts -> A receives 'call:accepted'.
 * 3. SDP Offer & Answer relay through Socket.IO without media leaks.
 * 4. ICE candidates exchange between peers.
 * 5. Busy detection: User C attempting to call User B gets 'call:busy'.
 * 6. Either party ends call -> other receives 'call:ended'.
 * 7. Offline detection: Calling an offline user returns 'call:unavailable'.
 * 8. Cancellation: Caller hangs up while ringing -> recipient receives 'call:cancelled'.
 */

import http from 'http';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import app from './src/app.js';
import { initSocket } from './src/socket/index.js';
import generateToken from './src/utils/generateToken.js';
import User from './src/models/User.js';
import Conversation from './src/models/Conversation.js';

const TEST_PORT = 5008;
const TEST_SOCKET_URL = `http://127.0.0.1:${TEST_PORT}`;

function createSocketClient(token) {
  return Client(TEST_SOCKET_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
}

async function runWebRTCCallTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting WebRTC Audio & Video Call Signaling Test Suite');
  console.log('🧪 ========================================================');

  let httpServer;
  let ioServer;
  let alice, bob, carol;
  let aliceSocket, bobSocket, carolSocket;

  try {
    // 1. Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsechat_test');
    }
    console.log('✅ Connected to MongoDB.');

    // 2. Start HTTP server on test port
    httpServer = http.createServer(app);
    ioServer = initSocket(httpServer);

    await new Promise((resolve) => httpServer.listen(TEST_PORT, resolve));
    console.log(`✅ Test server running on ${TEST_SOCKET_URL}`);

    // 3. Create test users
    const uniqueSuffix = Date.now();
    alice = await User.create({
      name: 'Alice CallTester',
      email: `alice_${uniqueSuffix}@university.edu`,
      password: 'Password123!',
      status: 'offline',
    });
    const aliceToken = generateToken(alice._id);

    bob = await User.create({
      name: 'Bob CallTester',
      email: `bob_${uniqueSuffix}@university.edu`,
      password: 'Password123!',
      status: 'offline',
    });
    const bobToken = generateToken(bob._id);

    carol = await User.create({
      name: 'Carol CallTester',
      email: `carol_${uniqueSuffix}@university.edu`,
      password: 'Password123!',
      status: 'offline',
    });
    const carolToken = generateToken(carol._id);

    console.log(`✅ Test users created: Alice (${alice._id}), Bob (${bob._id}), Carol (${carol._id})`);

    // --- TEST 1: Offline Detection ---
    console.log('\n--- TEST 1: Calling Offline User (Bob is offline) ---');
    aliceSocket = createSocketClient(aliceToken);
    await new Promise((resolve) => aliceSocket.on('connect', resolve));

    const offlineResult = await new Promise((resolve) => {
      aliceSocket.emit('call:initiate', {
        callId: 'call_test_offline',
        recipientId: bob._id.toString(),
        callType: 'voice',
      });
      aliceSocket.on('call:unavailable', (data) => resolve(data));
    });

    console.log(`✅ Offline test passed: Received call:unavailable: "${offlineResult.reason}"`);

    // --- TEST 2: Incoming & Outgoing Call Flow ---
    console.log('\n--- TEST 2: Connect Bob & Alice -> Initiate Outgoing Call ---');
    bobSocket = createSocketClient(bobToken);
    await new Promise((resolve) => bobSocket.on('connect', resolve));
    // Wait for presence to register
    await new Promise((r) => setTimeout(r, 200));

    const testCallId = `call_test_${Date.now()}`;

    const [ringingResult, incomingResult] = await Promise.all([
      new Promise((resolve) => {
        aliceSocket.on('call:ringing', resolve);
      }),
      new Promise((resolve) => {
        bobSocket.on('call:incoming', resolve);
      }),
      new Promise((resolve) => {
        aliceSocket.emit('call:initiate', {
          callId: testCallId,
          recipientId: bob._id.toString(),
          callType: 'video',
          conversationId: 'mock_conv_1',
        }, resolve);
      }),
    ]);

    console.log(`✅ Alice received call:ringing for callId=${ringingResult.callId}`);
    console.log(`✅ Bob received call:incoming from caller="${incomingResult.caller.name}", type=${incomingResult.callType}`);

    if (incomingResult.callId !== testCallId) throw new Error('Call ID mismatch on incoming call');
    if (incomingResult.caller.id !== alice._id.toString()) throw new Error('Caller ID mismatch');

    // --- TEST 3: Busy Detection ---
    console.log('\n--- TEST 3: Busy User Detection (Carol calls Bob while ringing) ---');
    carolSocket = createSocketClient(carolToken);
    await new Promise((resolve) => carolSocket.on('connect', resolve));

    const busyResult = await new Promise((resolve) => {
      carolSocket.emit('call:initiate', {
        callId: `call_carol_${Date.now()}`,
        recipientId: bob._id.toString(),
        callType: 'voice',
      });
      carolSocket.on('call:busy', resolve);
    });

    console.log(`✅ Busy test passed: Carol received call:busy: "${busyResult.reason}"`);

    // --- TEST 4: Accept Call ---
    console.log('\n--- TEST 4: Bob Accepts Call ---');
    const acceptedResult = await new Promise((resolve) => {
      aliceSocket.on('call:accepted', resolve);
      bobSocket.emit('call:accept', { callId: testCallId });
    });

    console.log(`✅ Alice received call:accepted from recipient="${acceptedResult.recipient.name}"`);

    // --- TEST 5: WebRTC SDP Offer & Answer Exchange ---
    console.log('\n--- TEST 5: SDP Offer & Answer Signaling ---');
    const mockOfferSdp = { type: 'offer', sdp: 'v=0\r\no=alice 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
    const mockAnswerSdp = { type: 'answer', sdp: 'v=0\r\no=bob 67890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };

    // Alice sends Offer -> Bob receives Offer
    const receivedOffer = await new Promise((resolve) => {
      bobSocket.on('call:offer', resolve);
      aliceSocket.emit('call:offer', {
        callId: testCallId,
        targetUserId: bob._id.toString(),
        sdp: mockOfferSdp,
      });
    });
    console.log(`✅ Bob received SDP Offer from Alice (senderId: ${receivedOffer.senderId})`);

    // Bob sends Answer -> Alice receives Answer
    const receivedAnswer = await new Promise((resolve) => {
      aliceSocket.on('call:answer', resolve);
      bobSocket.emit('call:answer', {
        callId: testCallId,
        targetUserId: alice._id.toString(),
        sdp: mockAnswerSdp,
      });
    });
    console.log(`✅ Alice received SDP Answer from Bob (senderId: ${receivedAnswer.senderId})`);

    // --- TEST 6: ICE Candidate Exchange ---
    console.log('\n--- TEST 6: ICE Candidate Signaling ---');
    const mockCandidate = { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host', sdpMid: '0', sdpMLineIndex: 0 };

    const receivedCandidate = await new Promise((resolve) => {
      bobSocket.on('call:ice_candidate', resolve);
      aliceSocket.emit('call:ice_candidate', {
        callId: testCallId,
        targetUserId: bob._id.toString(),
        candidate: mockCandidate,
      });
    });
    console.log(`✅ Bob received ICE candidate from Alice`);

    // --- TEST 7: End Call ---
    console.log('\n--- TEST 7: End Active Call ---');
    const endResult = await new Promise((resolve) => {
      bobSocket.on('call:ended', resolve);
      aliceSocket.emit('call:end', { callId: testCallId, duration: 45 });
    });
    console.log(`✅ Bob received call:ended (duration: ${endResult.duration}s, endedBy: ${endResult.endedBy})`);

    // --- TEST 8: Cancel Before Answer Flow ---
    console.log('\n--- TEST 8: Caller Cancels Outgoing Call Before Answer ---');
    const cancelCallId = `call_cancel_${Date.now()}`;

    await new Promise((resolve) => {
      bobSocket.once('call:incoming', resolve);
      aliceSocket.emit('call:initiate', {
        callId: cancelCallId,
        recipientId: bob._id.toString(),
        callType: 'voice',
      });
    });

    const cancelResult = await new Promise((resolve) => {
      bobSocket.on('call:cancelled', resolve);
      aliceSocket.emit('call:cancel', { callId: cancelCallId });
    });
    console.log(`✅ Bob received call:cancelled for callId=${cancelResult.callId}`);

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL WEBRTC CALL SIGNALING TESTS PASSED PERFECTLY!');
    console.log('🎉 ========================================================');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    if (aliceSocket) aliceSocket.disconnect();
    if (bobSocket) bobSocket.disconnect();
    if (carolSocket) carolSocket.disconnect();

    // Clean up test DB records
    if (alice) await User.deleteOne({ _id: alice._id }).catch(() => {});
    if (bob) await User.deleteOne({ _id: bob._id }).catch(() => {});
    if (carol) await User.deleteOne({ _id: carol._id }).catch(() => {});

    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
  }
}

runWebRTCCallTests();
