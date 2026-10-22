import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app.js';
import User from './src/models/User.js';

dotenv.config();

let server;
const PORT = 5007;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runPhase3Tests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 3 User Authentication Integration Tests');
  console.log('🧪 ========================================================\n');

  try {
    // 1. Connect to MongoDB
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulsechat';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB.');

    // Start test server
    await new Promise((resolve) => {
      server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`✅ Test server running at ${BASE_URL}\n`);
        resolve();
      });
    });

    // Cleanup previous test users
    const testEmails = [
      'auth_test_1@campus.edu',
      'auth_test_2@campus.edu',
      'normalized.user@campus.edu',
    ];
    await User.deleteMany({ email: { $in: testEmails } });

    // -------------------------------------------------------------
    // TEST 1: Registration Validation (Missing or Invalid Fields)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Registration Input Validation ---');

    // Short password (<6 chars)
    const resShortPass = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: 'auth_test_1@campus.edu',
        password: '123',
      }),
    });
    console.log(`Short password (<6 chars) -> Status: ${resShortPass.status} (Expected: 400)`);
    if (resShortPass.status !== 400) throw new Error('Short password was not rejected!');

    // Invalid email format
    const resBadEmail = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: 'invalid-email-format',
        password: 'Password123!',
      }),
    });
    console.log(`Invalid email format -> Status: ${resBadEmail.status} (Expected: 400)`);
    if (resBadEmail.status !== 400) throw new Error('Invalid email format was not rejected!');

    // Short name (<2 chars)
    const resShortName = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'T',
        email: 'auth_test_1@campus.edu',
        password: 'Password123!',
      }),
    });
    console.log(`Short name (<2 chars) -> Status: ${resShortName.status} (Expected: 400)`);
    if (resShortName.status !== 400) throw new Error('Short name was not rejected!');
    console.log('✅ Input validation properly blocks invalid requests.\n');

    // -------------------------------------------------------------
    // TEST 2: Successful User Registration
    // -------------------------------------------------------------
    console.log('--- TEST 2: Successful Registration & Password Hashing ---');
    const resRegister = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Rostova',
        email: 'auth_test_1@campus.edu',
        password: 'SecurePassword123!',
      }),
    });
    const regData = await resRegister.json();
    console.log(`Register valid user -> Status: ${resRegister.status} (Expected: 201)`);
    if (resRegister.status !== 201) throw new Error('Registration failed!');
    if (!regData.token) throw new Error('JWT token was not returned in registration response!');
    if (regData.user.password) throw new Error('SECURITY VIOLATION: Password hash leaked in response!');
    console.log(`✅ Registration returned user: ${regData.user.name} (${regData.user.email})`);
    console.log(`✅ Signed JWT received: ${regData.token.substring(0, 20)}...`);

    // Verify bcrypt hash directly in MongoDB
    const userInDb = await User.findOne({ email: 'auth_test_1@campus.edu' }).select('+password');
    console.log(`Database stored password: ${userInDb.password.substring(0, 15)}...`);
    if (!userInDb.password.startsWith('$2b$')) {
      throw new Error('Stored password is NOT a valid bcrypt hash!');
    }
    console.log('✅ Password securely hashed with bcrypt (never plain text).\n');

    // -------------------------------------------------------------
    // TEST 3: Duplicate Email Rejection
    // -------------------------------------------------------------
    console.log('--- TEST 3: Reject Duplicate Email Registration ---');
    const resDuplicate = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Clone',
        email: 'auth_test_1@campus.edu',
        password: 'DifferentPassword123!',
      }),
    });
    console.log(`Duplicate email attempt -> Status: ${resDuplicate.status} (Expected: 409)`);
    if (resDuplicate.status !== 409) throw new Error('Duplicate email was not rejected with 409!');
    console.log('✅ Duplicate email registration rejected with HTTP 409 Conflict.\n');

    // -------------------------------------------------------------
    // TEST 4: Email Address Normalization
    // -------------------------------------------------------------
    console.log('--- TEST 4: Email Normalization ---');
    const resNorm = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal User',
        email: '  NoRmAlIzEd.UsEr@CaMpUs.EdU  ',
        password: 'Password123!',
      }),
    });
    const normData = await resNorm.json();
    console.log(`Stored email: "${normData.user.email}" (Expected: "normalized.user@campus.edu")`);
    if (normData.user.email !== 'normalized.user@campus.edu') {
      throw new Error('Email normalization failed!');
    }
    console.log('✅ Email normalized to lowercase and trimmed.\n');

    // -------------------------------------------------------------
    // TEST 5: User Login (Valid & Invalid Credentials)
    // -------------------------------------------------------------
    console.log('--- TEST 5: Authentication Login Verification ---');

    // Valid login
    const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'auth_test_1@campus.edu',
        password: 'SecurePassword123!',
      }),
    });
    const loginData = await resLogin.json();
    console.log(`Valid login -> Status: ${resLogin.status} (Expected: 200)`);
    if (resLogin.status !== 200) throw new Error('Valid login failed!');
    if (!loginData.token) throw new Error('Token not returned on login!');
    if (loginData.user.password) throw new Error('SECURITY VIOLATION: Password hash leaked in login!');
    console.log(`✅ Login succeeded for: ${loginData.user.name}`);

    // Invalid password
    const resWrongPass = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'auth_test_1@campus.edu',
        password: 'WrongPassword!',
      }),
    });
    console.log(`Invalid password -> Status: ${resWrongPass.status} (Expected: 401)`);
    if (resWrongPass.status !== 401) throw new Error('Invalid password was not rejected!');

    // Non-existent email
    const resWrongEmail = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'does_not_exist@campus.edu',
        password: 'Password123!',
      }),
    });
    console.log(`Non-existent email -> Status: ${resWrongEmail.status} (Expected: 401)`);
    if (resWrongEmail.status !== 401) throw new Error('Non-existent email was not rejected!');
    console.log('✅ Invalid credentials securely rejected with HTTP 401 Unauthorized.\n');

    // -------------------------------------------------------------
    // TEST 6: Protected Route (GET /api/auth/me) & Auth Middleware
    // -------------------------------------------------------------
    console.log('--- TEST 6: Protected Route & Auth Middleware ---');

    // Access without token
    const resNoToken = await fetch(`${BASE_URL}/api/auth/me`);
    console.log(`GET /api/auth/me without token -> Status: ${resNoToken.status} (Expected: 401)`);
    if (resNoToken.status !== 401) throw new Error('Unauthenticated request was not blocked!');

    // Access with malformed/tampered token
    const resBadToken = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer this-is-not-a-valid-jwt' },
    });
    console.log(`GET /api/auth/me with bad token -> Status: ${resBadToken.status} (Expected: 401)`);
    if (resBadToken.status !== 401) throw new Error('Tampered token was not blocked!');

    // Access with valid token
    const resMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const meData = await resMe.json();
    console.log(`GET /api/auth/me with valid token -> Status: ${resMe.status} (Expected: 200)`);
    if (resMe.status !== 200) throw new Error('Accessing /api/auth/me failed with valid token!');
    if (meData.user.email !== 'auth_test_1@campus.edu') throw new Error('Wrong user returned!');
    if (meData.user.password) throw new Error('SECURITY VIOLATION: Password hash leaked in /api/auth/me!');
    console.log(`✅ Successfully retrieved profile for: ${meData.user.name}\n`);

    // -------------------------------------------------------------
    // TEST 7: Logout Strategy
    // -------------------------------------------------------------
    console.log('--- TEST 7: Logout Strategy ---');
    const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    console.log(`POST /api/auth/logout -> Status: ${resLogout.status} (Expected: 200)`);
    if (resLogout.status !== 200) throw new Error('Logout endpoint failed!');
    console.log('✅ Logout endpoint verified.\n');

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('🧹 Cleaning up test accounts...');
    await User.deleteMany({ email: { $in: testEmails } });
    console.log('✅ Test data cleaned up.');

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL PHASE 3 INTEGRATION TESTS PASSED PERFECTLY!');
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

runPhase3Tests();
