import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Messages HTTP API Tests', () => {
  let alice, bob, mallory;
  let tokenA, tokenB, tokenM;
  let conversationId;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice M',
      email: 'alice.msg@campus.edu',
      password: 'Password123!',
    });
    alice = resA.body.user;
    tokenA = resA.body.token;

    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob M',
      email: 'bob.msg@campus.edu',
      password: 'Password123!',
    });
    bob = resB.body.user;
    tokenB = resB.body.token;

    const resM = await request(app).post('/api/auth/register').send({
      name: 'Mallory M',
      email: 'mallory.msg@campus.edu',
      password: 'Password123!',
    });
    mallory = resM.body.user;
    tokenM = resM.body.token;

    // Create 1-on-1 conversation between Alice and Bob
    const resConv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ userId: bob.id });
    conversationId = (resConv.body.id || resConv.body._id || resConv.body.data?.conversation?.id).toString();
  });

  it('1. should create a new message and retrieve history in chronological order', async () => {
    // Alice sends message 1
    const resSend1 = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ text: 'Hello Bob! Message 1', clientMessageId: 'msg_01' });

    expect(resSend1.status).toBe(201);
    const msg1 = resSend1.body.data?.message || resSend1.body;
    expect(msg1.text).toBe('Hello Bob! Message 1');

    // Bob sends message 2
    const resSend2 = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ text: 'Hey Alice! Message 2', clientMessageId: 'msg_02' });
    expect(resSend2.status).toBe(201);

    // Retrieve message history
    const resHistory = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resHistory.status).toBe(200);
    const messages = resHistory.body.data?.messages || resHistory.body;
    expect(messages.length).toBe(2);
    expect(messages[0].text).toBe('Hello Bob! Message 1');
    expect(messages[1].text).toBe('Hey Alice! Message 2');
  });

  it('2. should support cursor-based pagination', async () => {
    // Seed 4 messages
    for (let i = 1; i <= 4; i++) {
      await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ text: `Message #${i}` });
      await new Promise((r) => setTimeout(r, 15));
    }

    // Page 1 with limit 2
    const resPage1 = await request(app)
      .get(`/api/conversations/${conversationId}/messages?limit=2`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resPage1.status).toBe(200);
    expect(resPage1.body.pagination.hasMore).toBe(true);
    expect(resPage1.body.pagination.nextCursor).toBeDefined();

    const cursor = resPage1.body.pagination.nextCursor;

    // Page 2 before cursor
    const resPage2 = await request(app)
      .get(`/api/conversations/${conversationId}/messages?limit=2&before=${encodeURIComponent(cursor)}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resPage2.status).toBe(200);
    expect(resPage2.body.data.messages.length).toBe(2);
  });

  it('3. should reject unauthorized message access and sending from non-members', async () => {
    // Mallory tries to send a message to Alice & Bob's conversation
    const resMallorySend = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenM}`)
      .send({ text: 'Infiltrating conversation' });

    expect(resMallorySend.status).toBe(403);
    expect(resMallorySend.body.message).toMatch(/not part of/i);

    // Mallory tries to inspect message history
    const resMalloryFetch = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenM}`);

    expect(resMalloryFetch.status).toBe(403);
    expect(resMalloryFetch.body.message).toMatch(/not a participant/i);
  });

  it('4. should enforce editing and deletion permissions (author only)', async () => {
    // Alice sends a message
    const resSend = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ text: 'Original Text from Alice' });
    const msgId = (resSend.body.data?.message?._id || resSend.body._id).toString();

    // Bob tries to edit Alice's message
    const resBobEdit = await request(app)
      .patch(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ text: 'Tampered by Bob' });

    expect(resBobEdit.status).toBe(403);
    expect(resBobEdit.body.message).toMatch(/only edit your own/i);

    // Alice edits her own message
    const resAliceEdit = await request(app)
      .patch(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ text: 'Updated Text by Alice' });

    expect(resAliceEdit.status).toBe(200);
    expect(resAliceEdit.body.data.message.isEdited).toBe(true);
    expect(resAliceEdit.body.data.message.text).toBe('Updated Text by Alice');

    // Mallory tries to delete Alice's message
    const resMalloryDel = await request(app)
      .delete(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${tokenM}`);

    expect(resMalloryDel.status).toBe(403);

    // Alice soft-deletes her own message
    const resAliceDel = await request(app)
      .delete(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resAliceDel.status).toBe(200);
    expect(resAliceDel.body.data.mode).toBe('soft');
  });

  it('5. should reject invalid message payloads (empty text or oversized text)', async () => {
    // Empty message
    const resEmpty = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ text: '   ' });

    expect(resEmpty.status).toBe(400);
    expect(resEmpty.body.message).toMatch(/cannot be empty/i);

    // Oversized message > 2000 chars
    const oversizedText = 'M'.repeat(2001);
    const resOversized = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ text: oversizedText });

    expect(resOversized.status).toBe(400);
    expect(resOversized.body.message).toMatch(/cannot exceed 2000 characters/i);
  });
});
