import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import app from './src/app.js';
import { initSocket } from './src/socket/index.js';
import User from './src/models/User.js';

dotenv.config();

const PORT = 5011;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

let httpServer;
let ioServer;

async function runPhase10Tests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 10 Security Hardening Test Suite');
  console.log('🧪 ========================================================\n');

  try {
    // 1. Connect MongoDB
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsechat';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB successfully.');

    // 2. Start HTTP server
    httpServer = http.createServer(app);
    ioServer = initSocket(httpServer);

    await new Promise((resolve) => {
      httpServer.listen(PORT, '127.0.0.1', () => {
        console.log(`✅ Test server running at ${SERVER_URL}\n`);
        resolve();
      });
    });

    // 3. Clean up test users
    const testEmail = 'sec_user_p10@campus.edu';
    await User.deleteMany({ email: testEmail });

    // =========================================================
    // TEST 1: Helmet Security Headers
    // =========================================================
    console.log('--- TEST 1: Helmet HTTP Security Headers ---');
    const healthRes = await fetch(`${SERVER_URL}/api/health`);
    const xContentType = healthRes.headers.get('x-content-type-options');
    const xFrameOptions = healthRes.headers.get('x-frame-options');
    const csp = healthRes.headers.get('content-security-policy');

    console.log(`X-Content-Type-Options: ${xContentType}`);
    console.log(`X-Frame-Options: ${xFrameOptions}`);
    console.log(`Content-Security-Policy: ${csp ? 'Present' : 'Missing'}`);

    if (xContentType !== 'nosniff') {
      throw new Error('Expected X-Content-Type-Options to be "nosniff"');
    }
    if (xFrameOptions !== 'SAMEORIGIN') {
      throw new Error('Expected X-Frame-Options to be "SAMEORIGIN"');
    }
    if (!csp) {
      throw new Error('Expected Content-Security-Policy header to be present');
    }
    console.log('✅ Helmet security headers verified (nosniff, SAMEORIGIN, CSP).\n');

    // =========================================================
    // TEST 2: CORS Whitelist Protection
    // =========================================================
    console.log('--- TEST 2: CORS Configuration & Whitelist Validation ---');
    // Allowed origin
    const allowedRes = await fetch(`${SERVER_URL}/api/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    const allowOriginHeader = allowedRes.headers.get('access-control-allow-origin');
    const allowCredsHeader = allowedRes.headers.get('access-control-allow-credentials');
    console.log(`Allowed Origin Response -> AC-Allow-Origin: ${allowOriginHeader}, AC-Allow-Credentials: ${allowCredsHeader}`);
    if (allowOriginHeader !== 'http://localhost:5173' || allowCredsHeader !== 'true') {
      throw new Error('CORS failed to validate authorized origin!');
    }

    // Malicious origin preflight/request
    const maliciousRes = await fetch(`${SERVER_URL}/api/health`, {
      headers: { Origin: 'https://evil-hacker-site.com' },
    });
    const maliciousAllowHeader = maliciousRes.headers.get('access-control-allow-origin');
    if (maliciousAllowHeader === 'https://evil-hacker-site.com' || maliciousAllowHeader === '*') {
      throw new Error('CORS reflected unauthorized origin!');
    }
    console.log('✅ CORS verified: Whitelisted origin allowed; unauthorized origin blocked.\n');

    // =========================================================
    // TEST 3: NoSQL Injection Sanitization
    // =========================================================
    console.log('--- TEST 3: NoSQL Query Injection Protection (mongoSanitize) ---');
    const injectedRes = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: { $gt: '' }, // NoSQL operator injection attempt
        password: 'Pass',
      }),
    });
    const injectedData = await injectedRes.json();
    console.log(`Injected payload response -> Status: ${injectedRes.status}, Message: "${injectedData.message}"`);
    // Because mongoSanitize strips '$gt', email becomes empty object or empty string, caught by input validation
    if (injectedRes.status !== 400 && injectedRes.status !== 401) {
      throw new Error(`Expected NoSQL injection to be rejected with 400 or 401, got ${injectedRes.status}`);
    }
    console.log('✅ NoSQL injection operators sanitized and rejected.\n');

    // =========================================================
    // TEST 4: Request-Body Size Limit (HTTP 413)
    // =========================================================
    console.log('--- TEST 4: Request-Body Size Limit Enforcement (HTTP 413) ---');
    // Generate an oversized payload exceeding 500kb
    const oversizedString = 'A'.repeat(600 * 1024);
    const oversizedRes = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Spam', email: 'spam@campus.edu', password: oversizedString }),
    });
    const oversizedData = await oversizedRes.json();
    console.log(`Oversized payload response -> Status: ${oversizedRes.status} (Expected: 413), Code: "${oversizedData.code}"`);
    if (oversizedRes.status !== 413 || oversizedData.code !== 'PAYLOAD_TOO_LARGE') {
      throw new Error(`Expected 413 Payload Too Large, received status ${oversizedRes.status}`);
    }
    console.log('✅ Request size limit strictly enforced: 413 PAYLOAD_TOO_LARGE returned.\n');

    // =========================================================
    // TEST 5: Password Length Bounds (Hash DoS Protection)
    // =========================================================
    console.log('--- TEST 5: Password Length Restrictions (Hash DoS Protection) ---');
    // Attempt registration with 129-character password
    const longPassword = 'P'.repeat(129);
    const longPassRes = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Long Pass User', email: testEmail, password: longPassword }),
    });
    const longPassData = await longPassRes.json();
    console.log(`Long password registration -> Status: ${longPassRes.status} (Expected: 400), Message: "${longPassData.message}"`);
    if (longPassRes.status !== 400 || !longPassData.message.includes('128 characters')) {
      throw new Error('Expected 400 rejection for password exceeding 128 characters!');
    }
    console.log('✅ Max password length bound (128 chars) verified.\n');

    // =========================================================
    // TEST 6: User Registration & Mass Assignment Protection
    // =========================================================
    console.log('--- TEST 6: User Registration & Mass Assignment Protection ---');
    const validRegRes = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Secured User',
        email: testEmail,
        password: 'ValidPassword123!',
      }),
    });
    const regData = await validRegRes.json();
    if (validRegRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    const token = regData.token;
    console.log(`✅ User registered successfully. Default role: "${regData.user.role}", isVerified: ${regData.user.isVerified}`);

    // Attempt mass assignment: try setting role='admin' and isVerified=true
    const massAssignRes = await fetch(`${SERVER_URL}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Secured User Renamed',
        role: 'admin',
        isVerified: true,
      }),
    });
    const massAssignData = await massAssignRes.json();
    console.log(`Mass assignment attempt -> Status: ${massAssignRes.status}`);
    const updatedUser = massAssignData.data.user;
    if (updatedUser.role === 'admin' || updatedUser.isVerified === true) {
      throw new Error('Mass assignment vulnerability detected! Protected fields were modified.');
    }
    if (updatedUser.name !== 'Secured User Renamed') {
      throw new Error('Whitelisted field "name" was not updated properly.');
    }
    console.log('✅ Mass assignment strictly blocked: role remains "student", isVerified remains false.\n');

    // =========================================================
    // TEST 7: Search Query Length Bound (ReDoS Protection)
    // =========================================================
    console.log('--- TEST 7: Search Query Length Bounds ---');
    const longQuery = 'A'.repeat(51);
    const searchLongRes = await fetch(`${SERVER_URL}/api/users/search?q=${longQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchLongData = await searchLongRes.json();
    console.log(`51-character search query -> Status: ${searchLongRes.status} (Expected: 400), Message: "${searchLongData.message}"`);
    if (searchLongRes.status !== 400 || !searchLongData.message.includes('50 characters')) {
      throw new Error('Search query exceeding 50 characters was not rejected!');
    }
    console.log('✅ Search length limitation verified (max 50 chars).\n');

    // =========================================================
    // TEST 8: JWT Algorithm Whitelisting (HS256 Guard)
    // =========================================================
    console.log('--- TEST 8: JWT Algorithm Whitelisting (HS256 Guard) ---');
    // Forged token using 'none' algorithm
    const forgedNoneToken = jwt.sign({ id: regData.user.id }, '', { algorithm: 'none' });
    const forgedRes = await fetch(`${SERVER_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${forgedNoneToken}` },
    });
    console.log(`Algorithm "none" token attempt -> Status: ${forgedRes.status} (Expected: 401)`);
    if (forgedRes.status !== 401) {
      throw new Error('Server accepted JWT with unverified/none algorithm!');
    }

    // Valid HS256 token
    const validAuthRes = await fetch(`${SERVER_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`Valid HS256 token -> Status: ${validAuthRes.status} (Expected: 200)`);
    if (validAuthRes.status !== 200) {
      throw new Error('Valid HS256 token rejected!');
    }
    console.log('✅ JWT cryptographic algorithm whitelisting verified.\n');

    // =========================================================
    // TEST 9: Rate Limit Headers on Auth
    // =========================================================
    console.log('--- TEST 9: Rate Limit Headers Inspection ---');
    const loginAttemptRes = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword123!' }),
    });
    const hasRateLimitHeader =
      loginAttemptRes.headers.has('ratelimit-limit') ||
      loginAttemptRes.headers.has('x-ratelimit-limit');
    console.log(`Rate limit headers present on /api/auth/login: ${hasRateLimitHeader}`);
    if (!hasRateLimitHeader) {
      throw new Error('Expected RateLimit headers on authentication endpoints!');
    }
    console.log('✅ Rate limiting headers active on authentication endpoints.\n');

    // =========================================================
    // TEST 10: Database Readiness Guard
    // =========================================================
    console.log('--- TEST 10: Safe Handling of Database Failures (dbGuard) ---');
    // Disconnect Mongoose temporarily
    await mongoose.disconnect();

    const degradedHealthRes = await fetch(`${SERVER_URL}/api/health`);
    const degradedData = await degradedHealthRes.json();
    console.log(`Disconnected DB Health Check -> Status: ${degradedHealthRes.status} (Expected: 503), Message: "${degradedData.message}"`);
    if (degradedHealthRes.status !== 503 || degradedData.status !== 'degraded') {
      throw new Error('Health check failed to report degraded status on DB disconnection!');
    }

    // Regular protected API query while DB is down
    const disconnectedQueryRes = await fetch(`${SERVER_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const disconnectedData = await disconnectedQueryRes.json();
    console.log(`API Query during DB outage -> Status: ${disconnectedQueryRes.status} (Expected: 503), Code: "${disconnectedData.code}"`);
    if (disconnectedQueryRes.status !== 503 || disconnectedData.code !== 'DATABASE_UNAVAILABLE') {
      throw new Error('dbGuard failed to intercept requests during DB outage with 503 DATABASE_UNAVAILABLE!');
    }
    console.log('✅ Database readiness guard verified: Handled database outage with clean 503 without crashing.\n');

    // Reconnect to clean up
    await mongoose.connect(dbUri);
    await User.deleteMany({ email: testEmail });
    console.log('✅ Cleaned up temporary test data.');

    console.log('🎉 ========================================================');
    console.log('🎉 ALL PHASE 10 SECURITY HARDENING TESTS PASSED PERFECTLY!');
    console.log('🎉 ========================================================\n');
  } catch (error) {
    console.error('❌ PHASE 10 TEST RUNNER FAILED:', error);
    process.exitCode = 1;
  } finally {
    if (ioServer) ioServer.close();
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log('🛑 Closed HTTP server and MongoDB connection.\n');
  }
}

runPhase10Tests();
