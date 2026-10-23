import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Authentication HTTP API Tests', () => {
  const testUser = {
    name: 'Alice Campus',
    email: 'alice.auth@campus.edu',
    password: 'SecurePassword123!',
  };

  it('1. should successfully register a new user account with valid fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.name).toBe(testUser.name);
    // Security check: password hash must never be returned in API response
    expect(res.body.user.password).toBeUndefined();
  });

  it('2. should reject duplicate registration with HTTP 409 Conflict', async () => {
    // Initial registration
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Duplicate registration attempt with identical email
    const resDuplicate = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Clone',
        email: testUser.email.toUpperCase(), // Test case insensitivity
        password: 'AnotherPassword456!',
      });

    expect(resDuplicate.status).toBe(409);
    expect(resDuplicate.body.status).toBe('error');
    expect(resDuplicate.body.message).toMatch(/already exists/i);
  });

  it('3. should successfully log in an existing user with correct credentials', async () => {
    // Register first
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.password).toBeUndefined();
  });

  it('4. should reject login with invalid credentials (wrong password or unregistered email)', async () => {
    // Register user
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Wrong password
    const resWrongPass = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'IncorrectPassword999!',
      });

    expect(resWrongPass.status).toBe(401);
    expect(resWrongPass.body.status).toBe('error');
    expect(resWrongPass.body.message).toMatch(/invalid email or password/i);

    // Non-existent email
    const resUnknownUser = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ghost.user@campus.edu',
        password: 'SomePassword123!',
      });

    expect(resUnknownUser.status).toBe(401);
    expect(resUnknownUser.body.message).toMatch(/invalid email or password/i);
  });

  it('5. should reject access to protected routes without a valid Bearer token', async () => {
    // No authorization header
    const resNoToken = await request(app).get('/api/auth/me');
    expect(resNoToken.status).toBe(401);
    expect(resNoToken.body.status).toBe('error');
    expect(resNoToken.body.message).toMatch(/no authentication token provided/i);

    // Invalid / forged token
    const resInvalidToken = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.tampered.token');
    expect(resInvalidToken.status).toBe(401);
    expect(resInvalidToken.body.message).toMatch(/invalid authentication token/i);

    // Valid token
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    const token = regRes.body.token;

    const resValidToken = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(resValidToken.status).toBe(200);
    expect(resValidToken.body.user.email).toBe(testUser.email.toLowerCase());
  });
});
