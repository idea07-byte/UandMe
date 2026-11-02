/**
 * End-to-End Voice & Video Call Signaling Test Suite.
 * Validates full WebRTC signaling flow against the active Supabase/Mongo environment.
 */

import http from 'http';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { initSocket } from '../src/socket/index.js';
import generateToken from '../src/utils/generateToken.js';
import { supabaseService } from '../src/services/supabaseService.js';

const TEST_PORT = 5022;
const TEST_SOCKET_URL = `http://127.0.0.1:${TEST_PORT}`;

function createSocketClient(token) {
  return Client(TEST_SOCKET_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
}

async function runVoiceCallTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Voice & Video WebRTC Call Signaling Tests');
  console.log('🧪 ========================================================');

  let httpServer;
  let ioServer;
  let alice, bob, carol;
  let aliceSocket, bobSocket, carolSocket;

  try {
    // 1. Get or create test users
    async function getOrCreateTestUser(name, phone, email) {
      let user = await supabaseService.findUserByPhone(phone);
      if (!user) user = await supabaseService.findUserByEmail(email);
      if (!user) {
        user = await supabaseService.createUser({
          name,
          phone,
          email,
          password: 'Password123!',
        });
      }
      return user;
    }

    alice = await getOrCreateTestUser('Alice Caller', '+919876500010', 'alice.caller@uandi.local');
    bob = await getOrCreateTestUser('Bob Receiver', '+919876500020', 'bob.receiver@uandi.local');
    carol = await getOrCreateTestUser('Carol BusyCheck', '+919876500030', 'carol.busy@uandi.local');

    console.log(`✅ Test users ready: Alice (${alice.id}), Bob (${bob.id}), Carol (${carol.id})`);

    const aliceToken = generateToken(alice.id);
    const bobToken = generateToken(bob.id);
    const carolToken = generateToken(carol.id);

    // 2. Start test server
    httpServer = http.createServer(app);
    ioServer = initSocket(httpServer);
    await new Promise((resolve) => httpServer.listen(TEST_PORT, resolve));
    console.log(`✅ Test server running on ${TEST_SOCKET_URL}`);

    // --- TEST 1: Offline check ---
    console.log('\n--- TEST 1: Calling Offline User (Bob is offline) ---');
    aliceSocket = createSocketClient(aliceToken);
    await new Promise((resolve) => aliceSocket.on('connect', resolve));

    const offlineResult = await new Promise((resolve) => {
      aliceSocket.emit('call:initiate', {
        callId: 'call_test_offline',
        recipientId: bob.id,
        callType: 'voice',
      });
      aliceSocket.on('call:unavailable', resolve);
    });
    console.log(`✅ 1. Offline check passed: "${offlineResult.reason}"`);

    // --- TEST 2: Connect Bob & Place Voice Call ---
    console.log('\n--- TEST 2: Alice places voice call to Bob ---');
    bobSocket = createSocketClient(bobToken);
    await new Promise((resolve) => bobSocket.on('connect', resolve));
    await new Promise((r) => setTimeout(r, 200));

    const callId = `call_test_${Date.now()}`;

    const [ringingResult, incomingResult] = await Promise.all([
      new Promise((resolve) => aliceSocket.on('call:ringing', resolve)),
      new Promise((resolve) => bobSocket.on('call:incoming', resolve)),
      new Promise((resolve) => {
        aliceSocket.emit('call:initiate', {
          callId,
          recipientId: bob.id,
          callType: 'voice',
        }, resolve);
      }),
    ]);

    console.log(`✅ 2. Alice received call:ringing for callId=${ringingResult.callId}`);
    console.log(`✅ 2b. Bob received call:incoming from caller="${incomingResult.caller.name}", type=${incomingResult.callType}`);

    // --- TEST 3: Busy Detection ---
    console.log('\n--- TEST 3: Busy user detection (Carol calls Bob while Bob is ringing) ---');
    carolSocket = createSocketClient(carolToken);
    await new Promise((resolve) => carolSocket.on('connect', resolve));

    const busyResult = await new Promise((resolve) => {
      carolSocket.emit('call:initiate', {
        callId: `call_carol_${Date.now()}`,
        recipientId: bob.id,
        callType: 'voice',
      });
      carolSocket.on('call:busy', resolve);
    });
    console.log(`✅ 3. Busy detection passed: Carol received call:busy: "${busyResult.reason}"`);

    // --- TEST 4: Accept Call ---
    console.log('\n--- TEST 4: Bob accepts call ---');
    const acceptedResult = await new Promise((resolve) => {
      aliceSocket.on('call:accepted', resolve);
      bobSocket.emit('call:accept', { callId });
    });
    console.log(`✅ 4. Alice received call:accepted from recipient="${acceptedResult.recipient.name}"`);

    // --- TEST 5: SDP Offer & Answer Exchange ---
    console.log('\n--- TEST 5: WebRTC SDP Offer & Answer signaling ---');
    const mockOfferSdp = { type: 'offer', sdp: 'v=0\r\no=alice 1111 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
    const mockAnswerSdp = { type: 'answer', sdp: 'v=0\r\no=bob 2222 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };

    const receivedOffer = await new Promise((resolve) => {
      bobSocket.on('call:offer', resolve);
      aliceSocket.emit('call:offer', { callId, targetUserId: bob.id, sdp: mockOfferSdp });
    });
    console.log(`✅ 5a. Bob received SDP Offer from Alice`);

    const receivedAnswer = await new Promise((resolve) => {
      aliceSocket.on('call:answer', resolve);
      bobSocket.emit('call:answer', { callId, targetUserId: alice.id, sdp: mockAnswerSdp });
    });
    console.log(`✅ 5b. Alice received SDP Answer from Bob`);

    // --- TEST 6: ICE Candidate Relay ---
    console.log('\n--- TEST 6: ICE candidate relay ---');
    const mockCandidate = { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host', sdpMid: '0', sdpMLineIndex: 0 };
    const receivedCandidate = await new Promise((resolve) => {
      bobSocket.on('call:ice_candidate', resolve);
      aliceSocket.emit('call:ice_candidate', { callId, targetUserId: bob.id, candidate: mockCandidate });
    });
    console.log(`✅ 6. Bob received ICE candidate from Alice`);

    // --- TEST 7: Switch to Video Call ---
    console.log('\n--- TEST 7: Switch voice call to video call ---');
    const videoSwitched = await new Promise((resolve) => {
      bobSocket.on('call:video_switched', resolve);
      aliceSocket.emit('call:switch_video', { callId, enabled: true });
    });
    console.log(`✅ 7. Bob received call:video_switched (enabled: ${videoSwitched.enabled})`);

    // --- TEST 8: End Connected Call ---
    console.log('\n--- TEST 8: End connected call with duration tracking ---');
    const endResult = await new Promise((resolve) => {
      bobSocket.on('call:ended', resolve);
      aliceSocket.emit('call:end', { callId, duration: 42 });
    });
    console.log(`✅ 8. Bob received call:ended (duration: ${endResult.duration}s, endedBy: ${endResult.endedBy})`);

    // --- TEST 9: Cancel Outgoing Call & Trigger Missed Call ---
    console.log('\n--- TEST 9: Caller cancels outgoing call & triggers missed call notification ---');
    const cancelCallId = `call_cancel_${Date.now()}`;

    await new Promise((resolve) => {
      bobSocket.once('call:incoming', resolve);
      aliceSocket.emit('call:initiate', {
        callId: cancelCallId,
        recipientId: bob.id,
        callType: 'voice',
      });
    });

    const [cancelResult, missedResult] = await Promise.all([
      new Promise((resolve) => bobSocket.on('call:cancelled', resolve)),
      new Promise((resolve) => bobSocket.on('call:missed', resolve)),
      new Promise((resolve) => aliceSocket.emit('call:cancel', { callId: cancelCallId }, resolve)),
    ]);

    console.log(`✅ 9a. Bob received call:cancelled for callId=${cancelResult.callId}`);
    console.log(`✅ 9b. Bob received call:missed notification from caller="${missedResult.caller?.name}"`);

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL VOICE & VIDEO CALL SIGNALING TESTS PASSED PERFECTLY!');
    console.log('🎉 ========================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Voice call test failed:', err);
    process.exit(1);
  } finally {
    if (aliceSocket) aliceSocket.disconnect();
    if (bobSocket) bobSocket.disconnect();
    if (carolSocket) carolSocket.disconnect();
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  }
}

runVoiceCallTests();
