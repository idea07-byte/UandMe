import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Conversations HTTP API Tests', () => {
  let userAlice, tokenAlice;
  let userBob, tokenBob;
  let userCarol, tokenCarol;
  let userMallory, tokenMallory;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice C',
      email: 'alice.conv@campus.edu',
      password: 'Password123!',
    });
    userAlice = resA.body.user;
    tokenAlice = resA.body.token;

    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob C',
      email: 'bob.conv@campus.edu',
      password: 'Password123!',
    });
    userBob = resB.body.user;
    tokenBob = resB.body.token;

    const resC = await request(app).post('/api/auth/register').send({
      name: 'Carol C',
      email: 'carol.conv@campus.edu',
      password: 'Password123!',
    });
    userCarol = resC.body.user;
    tokenCarol = resC.body.token;

    const resM = await request(app).post('/api/auth/register').send({
      name: 'Mallory C',
      email: 'mallory.conv@campus.edu',
      password: 'Password123!',
    });
    userMallory = resM.body.user;
    tokenMallory = resM.body.token;
  });

  it('1. should successfully create a direct 1-on-1 conversation', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ userId: userBob.id });

    expect([200, 201]).toContain(res.status);
    const convId = res.body.id || res.body._id || res.body.data?.conversation?.id;
    expect(convId).toBeDefined();
    expect(res.body.isGroup).toBe(false);
  });

  it('2. should prevent duplicate direct conversations and return the existing thread', async () => {
    // 1st Creation
    const res1 = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ userId: userBob.id });
    const id1 = res1.body.id || res1.body._id || res1.body.data?.conversation?.id;

    // 2nd Creation attempt between same pair
    const res2 = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ userId: userBob.id });
    const id2 = res2.body.id || res2.body._id || res2.body.data?.conversation?.id;

    expect(id1.toString()).toBe(id2.toString());
  });

  it('3. should successfully create a group conversation with admin and participants', async () => {
    const res = await request(app)
      .post('/api/chats/group')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        name: 'AI Research Group',
        participants: [userBob.id, userCarol.id],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('AI Research Group');
    expect(res.body.isGroup).toBe(true);
    expect(res.body.participants.length).toBe(3); // Alice + Bob + Carol
  });

  it('4. should reject unauthorized conversation access from non-participants', async () => {
    // Alice creates conversation with Bob
    const resConv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ userId: userBob.id });
    const convId = resConv.body.id || resConv.body._id || resConv.body.data?.conversation?.id;

    // Mallory (non-participant) tries to retrieve the conversation
    const resMallory = await request(app)
      .get(`/api/chats/${convId}`)
      .set('Authorization', `Bearer ${tokenMallory}`);

    expect(resMallory.status).toBe(403);
    expect(resMallory.body.message).toMatch(/not a participant/i);
  });

  it('5. should enforce participant management permissions (admin only)', async () => {
    // Alice creates group with Bob and Carol
    const resGroup = await request(app)
      .post('/api/chats/group')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        name: 'Project Delta',
        participants: [userBob.id, userCarol.id],
      });
    const groupId = resGroup.body._id || resGroup.body.id;

    // Bob (non-admin) tries to add Mallory to the group
    const resBobAdd = await request(app)
      .patch(`/api/chats/${groupId}/participants`)
      .set('Authorization', `Bearer ${tokenBob}`)
      .send({ action: 'add', userId: userMallory.id });

    expect(resBobAdd.status).toBe(403);
    expect(resBobAdd.body.message).toMatch(/admin/i);

    // Alice (admin) successfully adds Mallory
    const resAliceAdd = await request(app)
      .patch(`/api/chats/${groupId}/participants`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ action: 'add', userId: userMallory.id });

    expect(resAliceAdd.status).toBe(200);
    expect(resAliceAdd.body.participants.length).toBe(4);
  });
});
