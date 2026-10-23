import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import http from 'http';
import { io as Client } from 'socket.io-client';
import request from 'supertest';
import app from '../src/app.js';
import { initSocket } from '../src/socket/index.js';
import presenceManager from '../src/socket/presenceManager.js';
import Message from '../src/models/Message.js';
import User from '../src/models/User.js';

describe('Socket.IO Real-Time Messaging & Presence Tests', () => {
  let server, ioServer, socketUrl;
  let userAlice, tokenAlice;
  let userBob, tokenBob;
  let userMallory, tokenMallory;
  let conversationId;
  const activeSockets = [];

  beforeAll(async () => {
    // Start native HTTP server with Socket.IO on an ephemeral port (0)
    server = http.createServer(app);
    ioServer = initSocket(server);

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    socketUrl = `http://127.0.0.1:${port}`;
  });

  beforeEach(async () => {
    presenceManager.clear();

    // Register 3 users via HTTP API for each isolated test run
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice Socket',
      email: 'alice.sock@campus.edu',
      password: 'Password123!',
    });
    userAlice = resA.body.user;
    tokenAlice = resA.body.token;

    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob Socket',
      email: 'bob.sock@campus.edu',
      password: 'Password123!',
    });
    userBob = resB.body.user;
    tokenBob = resB.body.token;

    const resM = await request(app).post('/api/auth/register').send({
      name: 'Mallory Socket',
      email: 'mallory.sock@campus.edu',
      password: 'Password123!',
    });
    userMallory = resM.body.user;
    tokenMallory = resM.body.token;

    // Create 1-on-1 conversation
    const resConv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ userId: userBob.id });
    conversationId = (resConv.body.id || resConv.body._id || resConv.body.data?.conversation?.id).toString();
  });

  afterEach(() => {
    while (activeSockets.length > 0) {
      const s = activeSockets.pop();
      try {
        if (s.connected) s.disconnect();
        s.close();
      } catch {
        // Ignore
      }
    }
    presenceManager.clear();
  });

  afterAll(async () => {
    if (ioServer) ioServer.close();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    presenceManager.clear();
  });

  function connectSocket(token) {
    const socket = Client(socketUrl, {
      auth: { token: token ? `Bearer ${token}` : undefined },
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    activeSockets.push(socket);
    return socket;
  }

  it('1. should reject unauthenticated socket connection attempts', async () => {
    // Missing token
    const clientNoToken = connectSocket(null);
    const errNoToken = await new Promise((resolve) => {
      clientNoToken.on('connect_error', resolve);
    });
    expect(errNoToken.message).toMatch(/no authentication token provided/i);
    clientNoToken.disconnect();

    // Invalid token
    const clientInvalid = connectSocket('invalid.tampered.token');
    const errInvalid = await new Promise((resolve) => {
      clientInvalid.on('connect_error', resolve);
    });
    expect(errInvalid.message).toMatch(/invalid authentication token/i);
    clientInvalid.disconnect();
  });

  it('2. should verify authorized room joining and reject unauthorized users', async () => {
    const aliceSocket = connectSocket(tokenAlice);
    const mallorySocket = connectSocket(tokenMallory);

    await Promise.all([
      new Promise((r) => aliceSocket.on('connect', r)),
      new Promise((r) => mallorySocket.on('connect', r)),
    ]);

    // Alice (authorized participant) joins conversation room
    const aliceJoinAck = await new Promise((resolve) => {
      aliceSocket.emit('conversation:join', { conversationId }, resolve);
    });
    expect(aliceJoinAck.status).toBe('ok');
    expect(aliceJoinAck.conversationId).toBe(conversationId);

    // Mallory (unauthorized non-participant) attempts to join room
    const malloryError = await new Promise((resolve) => {
      mallorySocket.on('socket:error', resolve);
      mallorySocket.emit('conversation:join', { conversationId });
    });
    expect(malloryError.code).toBe('FORBIDDEN_ROOM_ACCESS');

    aliceSocket.disconnect();
    mallorySocket.disconnect();
  });

  it('3. should deliver real-time messages and persist them to MongoDB', async () => {
    const aliceSocket = connectSocket(tokenAlice);
    const bobSocket = connectSocket(tokenBob);

    await Promise.all([
      new Promise((r) => aliceSocket.on('connect', r)),
      new Promise((r) => bobSocket.on('connect', r)),
    ]);

    // Both join conversation room
    await Promise.all([
      new Promise((r) => aliceSocket.emit('conversation:join', { conversationId }, r)),
      new Promise((r) => bobSocket.emit('conversation:join', { conversationId }, r)),
    ]);

    // Bob sets up listener for incoming message
    const incomingPromise = new Promise((resolve) => {
      bobSocket.on('receive_message', resolve);
    });

    // Alice sends message with clientMessageId
    const clientMessageId = `p11_msg_${Date.now()}`;
    const sendAck = await new Promise((resolve) => {
      aliceSocket.emit(
        'message:send',
        {
          conversationId,
          text: 'Hello from Vitest Phase 11!',
          clientMessageId,
        },
        resolve
      );
    });

    expect(sendAck.status).toBe('ok');
    expect(sendAck.message.text).toBe('Hello from Vitest Phase 11!');

    // Bob receives real-time broadcast
    const receivedMsg = await incomingPromise;
    expect(receivedMsg.text).toBe('Hello from Vitest Phase 11!');
    expect(receivedMsg.clientMessageId).toBe(clientMessageId);

    // Verify message persistence in MongoDB
    const persisted = await Message.findOne({ clientMessageId });
    expect(persisted).not.toBeNull();
    expect(persisted.text).toBe('Hello from Vitest Phase 11!');
    expect(persisted.conversationId.toString()).toBe(conversationId);

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });

  it('4. should broadcast typing indicators to room members and block non-members', async () => {
    const aliceSocket = connectSocket(tokenAlice);
    const bobSocket = connectSocket(tokenBob);
    const mallorySocket = connectSocket(tokenMallory);

    await Promise.all([
      new Promise((r) => aliceSocket.on('connect', r)),
      new Promise((r) => bobSocket.on('connect', r)),
      new Promise((r) => mallorySocket.on('connect', r)),
    ]);

    await Promise.all([
      new Promise((r) => aliceSocket.emit('conversation:join', { conversationId }, r)),
      new Promise((r) => bobSocket.emit('conversation:join', { conversationId }, r)),
    ]);

    // Bob listens for typing:start and typing:stop
    const startPromise = new Promise((resolve) => bobSocket.on('typing:start', resolve));
    aliceSocket.emit('typing:start', { conversationId });
    const typingStartData = await startPromise;
    expect(typingStartData.userId).toBe(userAlice.id);

    const stopPromise = new Promise((resolve) => bobSocket.on('typing:stop', resolve));
    aliceSocket.emit('typing:stop', { conversationId });
    const typingStopData = await stopPromise;
    expect(typingStopData.userId).toBe(userAlice.id);

    // Mallory tries to emit typing:start
    const malloryTypingErr = await new Promise((resolve) => {
      mallorySocket.on('socket:error', resolve);
      mallorySocket.emit('typing:start', { conversationId });
    });
    expect(malloryTypingErr.code).toBe('FORBIDDEN_TYPING_ACCESS');

    aliceSocket.disconnect();
    bobSocket.disconnect();
    mallorySocket.disconnect();
  });

  it('5. should handle read receipts and update message status in MongoDB', async () => {
    const aliceSocket = connectSocket(tokenAlice);
    const bobSocket = connectSocket(tokenBob);

    await Promise.all([
      new Promise((r) => aliceSocket.on('connect', r)),
      new Promise((r) => bobSocket.on('connect', r)),
    ]);

    await Promise.all([
      new Promise((r) => aliceSocket.emit('conversation:join', { conversationId }, r)),
      new Promise((r) => bobSocket.emit('conversation:join', { conversationId }, r)),
    ]);

    // Alice sends a message
    const sendAck = await new Promise((resolve) => {
      aliceSocket.emit(
        'message:send',
        { conversationId, text: 'Read receipt test message' },
        resolve
      );
    });
    const msgId = sendAck.message._id;

    // Alice listens for Bob's read receipt
    const readReceiptPromise = new Promise((resolve) => {
      aliceSocket.on('message:read', resolve);
    });

    // Bob marks message as read
    const readAck = await new Promise((resolve) => {
      bobSocket.emit('message:read', { conversationId, messageId: msgId }, resolve);
    });
    expect(readAck.status).toBe('ok');

    // Alice receives read receipt broadcast
    const readEvent = await readReceiptPromise;
    expect(readEvent.readBy).toBe(userBob.id);
    expect(readEvent.conversationId).toBe(conversationId);

    // Verify MongoDB state: status='read', readBy includes Bob
    const inDb = await Message.findById(msgId);
    expect(inDb.status).toBe('read');
    expect(inDb.readBy.map((id) => id.toString())).toContain(userBob.id);

    aliceSocket.disconnect();
    bobSocket.disconnect();
  });

  it('6. should track online status across multiple connections and update lastSeen on final disconnect', async () => {
    presenceManager.clear();

    const bobSocket = connectSocket(tokenBob);
    await new Promise((r) => bobSocket.on('connect', r));

    let aliceOnlineCount = 0;
    let aliceOfflineCount = 0;
    bobSocket.on('user:online', (d) => {
      if (d.userId === userAlice.id) aliceOnlineCount++;
    });
    bobSocket.on('user:offline', (d) => {
      if (d.userId === userAlice.id) aliceOfflineCount++;
    });

    // Alice connects Socket Tab 1
    const aliceTab1 = connectSocket(tokenAlice);
    await new Promise((r) => aliceTab1.on('connect', r));
    await new Promise((r) => setTimeout(r, 80));

    expect(aliceOnlineCount).toBe(1);
    expect(presenceManager.getUserSocketCount(userAlice.id)).toBe(1);

    // Alice connects Socket Tab 2 (Multiple devices/tabs)
    const aliceTab2 = connectSocket(tokenAlice);
    await new Promise((r) => aliceTab2.on('connect', r));
    await new Promise((r) => setTimeout(r, 80));

    // No duplicate online event
    expect(aliceOnlineCount).toBe(1);
    expect(presenceManager.getUserSocketCount(userAlice.id)).toBe(2);

    // Close Tab 1 (One of two closes)
    aliceTab1.disconnect();
    await new Promise((r) => setTimeout(r, 80));

    // Alice is still online!
    expect(aliceOfflineCount).toBe(0);
    expect(presenceManager.getUserSocketCount(userAlice.id)).toBe(1);

    // Close Tab 2 (Final connection closes)
    aliceTab2.disconnect();
    await new Promise((r) => setTimeout(r, 120));

    // Alice is now marked offline
    expect(aliceOfflineCount).toBe(1);
    expect(presenceManager.getUserSocketCount(userAlice.id)).toBe(0);

    const userInDb = await User.findById(userAlice.id);
    expect(userInDb.status).toBe('offline');
    expect(userInDb.lastSeen).toBeDefined();

    bobSocket.disconnect();
  });
});
