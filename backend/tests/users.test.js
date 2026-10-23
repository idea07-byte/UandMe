import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Users HTTP API Tests', () => {
  let userA, tokenA;
  let userB, tokenB;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Arun Kumar',
      email: 'arun@campus.edu',
      password: 'Password123!',
    });
    userA = resA.body.user;
    tokenA = resA.body.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@campus.edu',
      password: 'Password123!',
    });
    userB = resB.body.user;
    tokenB = resB.body.token;
  });

  it('1. should search users by name and respect search query limits', async () => {
    const res = await request(app)
      .get('/api/users/search?q=arun')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.users.length).toBeGreaterThan(0);
    expect(res.body.data.users[0].name).toBe('Arun Kumar');

    // Length restriction: query > 50 characters must be rejected
    const longQ = 'A'.repeat(51);
    const resLong = await request(app)
      .get(`/api/users/search?q=${longQ}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resLong.status).toBe(400);
    expect(resLong.body.message).toMatch(/cannot exceed 50 characters/i);
  });

  it('2. should allow authenticated users to update their own profile fields', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Arun K. Updated',
        about: 'Researching distributed systems',
        department: 'Computer Science',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.name).toBe('Arun K. Updated');
    expect(res.body.data.user.about).toBe('Researching distributed systems');
    expect(res.body.data.user.department).toBe('Computer Science');
  });

  it('3. should block unauthorized profile modifications and mass assignment', async () => {
    // Unauthenticated update
    const resUnauth = await request(app)
      .patch('/api/users/me')
      .send({ name: 'Hacker' });
    expect(resUnauth.status).toBe(401);

    // Mass assignment attempt on protected fields
    const resMassAssign = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Arun Kumar',
        role: 'admin', // Protected field
        isVerified: true, // Protected field
      });

    expect(resMassAssign.status).toBe(200);
    expect(resMassAssign.body.data.user.role).toBe('student');
    expect(resMassAssign.body.data.user.isVerified).toBe(false);

    // Cannot modify another user's profile directly
    const resWrongUser = await request(app)
      .get('/api/users/600000000000000000000000')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resWrongUser.status).toBe(404);
  });
});
