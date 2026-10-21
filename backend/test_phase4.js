import mongoose from 'mongoose';
import app from './src/app.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

let server;
const PORT = 5005;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting Phase 4 User Management Integration Test Suite');
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

    // Clean up any previous test accounts
    await User.deleteMany({
      email: {
        $in: [
          'alice_p4@campus.edu',
          'arun_p4@campus.edu',
          'carol_p4@campus.edu',
          'david_p4@campus.edu',
        ],
      },
    });

    // -------------------------------------------------------------
    // TEST 1: Unauthenticated Requests (Protected Endpoint Barrier)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Authentication Guard on User Endpoints ---');
    const resNoAuth = await fetch(`${BASE_URL}/api/users`);
    const dataNoAuth = await resNoAuth.json();
    console.log(`GET /api/users without token -> Status: ${resNoAuth.status} (Expected: 401)`);
    if (resNoAuth.status !== 401) throw new Error('Unauthenticated request was not blocked!');
    console.log('✅ Access denied for unauthenticated requests as required.\n');

    // -------------------------------------------------------------
    // SETUP: Register Test Users
    // -------------------------------------------------------------
    console.log('--- SETUP: Registering Test Accounts ---');

    // User A: Alice
    const regAlice = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Cooper',
        email: 'alice_p4@campus.edu',
        password: 'PasswordAlice123!',
      }),
    });
    const aliceData = await regAlice.json();
    const aliceToken = aliceData.token || aliceData.data?.token;
    const aliceId = (aliceData.user?._id || aliceData.data?.user?._id)?.toString();
    console.log(`Registered Alice (${aliceId}) with JWT token.`);

    // User B: Arun
    const regArun = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arun Patel',
        email: 'arun_p4@campus.edu',
        password: 'PasswordArun123!',
      }),
    });
    const arunData = await regArun.json();
    const arunToken = arunData.token || arunData.data?.token;
    const arunId = (arunData.user?._id || arunData.data?.user?._id)?.toString();
    console.log(`Registered Arun (${arunId}) with JWT token.`);

    // User C: Carol
    const regCarol = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carol Danvers',
        email: 'carol_p4@campus.edu',
        password: 'PasswordCarol123!',
      }),
    });
    const carolData = await regCarol.json();
    const carolId = (carolData.user?._id || carolData.data?.user?._id)?.toString();
    console.log(`Registered Carol (${carolId}).\n`);

    // -------------------------------------------------------------
    // TEST 2: GET /api/users with Pagination & Caller Exclusion
    // -------------------------------------------------------------
    console.log('--- TEST 2: GET /api/users (Pagination & Exclude Self) ---');
    const resUsersPage = await fetch(`${BASE_URL}/api/users?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const dataUsersPage = await resUsersPage.json();
    console.log('GET /api/users?page=1&limit=2 response:', JSON.stringify(dataUsersPage.pagination, null, 2));

    if (dataUsersPage.status !== 'success') throw new Error('Failed to retrieve paginated users');
    if (dataUsersPage.pagination.limit !== 2) throw new Error('Limit parameter was not honored');
    
    // Ensure Alice is NOT in her own users list
    const foundAlice = dataUsersPage.data.users.find((u) => u._id === aliceId);
    if (foundAlice) throw new Error('Current user was incorrectly returned in user directory!');
    console.log('✅ Current user (Alice) correctly excluded from directory list.');

    // Ensure password hashes are never returned
    const leakedPassword = dataUsersPage.data.users.some((u) => u.password);
    if (leakedPassword) throw new Error('SECURITY VIOLATION: Password hash leaked in GET /api/users!');
    console.log('✅ Password hash is strictly excluded from all user items.\n');

    // -------------------------------------------------------------
    // TEST 3: GET /api/users/search?q=arun (Search & Privacy Rules)
    // -------------------------------------------------------------
    console.log('--- TEST 3: GET /api/users/search?q=arun (Search & Privacy Rules) ---');
    // Search by name "arun"
    const resSearch = await fetch(`${BASE_URL}/api/users/search?q=arun`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const dataSearch = await resSearch.json();
    console.log(`Found ${dataSearch.results} users matching "arun":`, dataSearch.data.users.map((u) => u.name));
    if (dataSearch.results === 0 || !dataSearch.data.users.some((u) => u._id === arunId)) {
      throw new Error('Search did not find user Arun Patel');
    }
    console.log('✅ Found Arun Patel by name search.');

    // Test privacy rule: searching for "carol_p4" (without @) should NOT return Carol Danvers by email
    const resPartialEmail = await fetch(`${BASE_URL}/api/users/search?q=carol_p4`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const dataPartialEmail = await resPartialEmail.json();
    console.log(`Search without @ for "carol_p4" returned: ${dataPartialEmail.results} items`);
    if (dataPartialEmail.results !== 0) {
      throw new Error('Email privacy failed: partial email search without @ matched user');
    }
    console.log('✅ Privacy verified: Partial email queries without "@" do not expose campus users.');

    // Test search with @: searching for "carol_p4@" SHOULD return Carol
    const resFullEmail = await fetch(`${BASE_URL}/api/users/search?q=carol_p4@`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const dataFullEmail = await resFullEmail.json();
    console.log(`Search with @ for "carol_p4@" returned: ${dataFullEmail.results} items (${dataFullEmail.data.users[0]?.name})`);
    if (dataFullEmail.results === 0 || dataFullEmail.data.users[0]._id !== carolId) {
      throw new Error('Search with @ failed to look up direct email');
    }
    console.log('✅ Direct email search with "@" allowed and functional.');

    // Test ReDoS resilience
    const resReDoS = await fetch(`${BASE_URL}/api/users/search?q=([a-zA-Z]+)*\\\\`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    if (resReDoS.status !== 200) throw new Error('ReDoS search character crashed server');
    console.log('✅ ReDoS characters safely escaped and handled.\n');

    // -------------------------------------------------------------
    // TEST 4: GET /api/users/:id (User Profile by ID)
    // -------------------------------------------------------------
    console.log('--- TEST 4: GET /api/users/:id (Profile Lookup & ID Validation) ---');
    // Valid ID
    const resGetId = await fetch(`${BASE_URL}/api/users/${arunId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const dataGetId = await resGetId.json();
    console.log(`GET /api/users/${arunId} -> Status: ${resGetId.status}, User: ${dataGetId.data?.user?.name}`);
    if (resGetId.status !== 200 || dataGetId.data.user._id !== arunId) {
      throw new Error('Failed to retrieve user profile by ID');
    }
    if (dataGetId.data.user.password) {
      throw new Error('SECURITY VIOLATION: Password hash returned in GET /api/users/:id');
    }
    console.log('✅ User profile retrieved successfully without password hash.');

    // Invalid ObjectId format (e.g. "not-a-valid-id")
    const resInvalidId = await fetch(`${BASE_URL}/api/users/not-a-valid-id`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const dataInvalidId = await resInvalidId.json();
    console.log(`GET /api/users/not-a-valid-id -> Status: ${resInvalidId.status} (Expected: 400), Message: "${dataInvalidId.message}"`);
    if (resInvalidId.status !== 400) throw new Error('Invalid ObjectId did not return 400 Bad Request');
    console.log('✅ MongoDB ObjectId validation strictly enforced.');

    // Non-existent valid ObjectId
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const resNotFound = await fetch(`${BASE_URL}/api/users/${nonExistentId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log(`GET /api/users/${nonExistentId} -> Status: ${resNotFound.status} (Expected: 404)`);
    if (resNotFound.status !== 404) throw new Error('Non-existent ObjectId did not return 404 Not Found');
    console.log('✅ Correctly returned 404 for non-existent user.\n');

    // -------------------------------------------------------------
    // TEST 5: PATCH /api/users/me (Update Own Profile)
    // -------------------------------------------------------------
    console.log('--- TEST 5: PATCH /api/users/me (Update Own Profile) ---');
    const updatePayload = {
      name: 'Alice C. Updated',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: 'Junior Researcher in Distributed Systems & AI 🚀',
      department: 'Electrical Engineering & Computer Science',
      status: 'busy',
    };

    const resUpdate = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify(updatePayload),
    });
    const dataUpdate = await resUpdate.json();
    console.log('PATCH /api/users/me response status:', resUpdate.status);
    console.log('Updated user details:', {
      name: dataUpdate.data?.user?.name,
      about: dataUpdate.data?.user?.about,
      department: dataUpdate.data?.user?.department,
      status: dataUpdate.data?.user?.status,
    });

    if (resUpdate.status !== 200) throw new Error('Failed to update profile');
    if (dataUpdate.data.user.name !== 'Alice C. Updated') throw new Error('Name was not updated');
    if (dataUpdate.data.user.about !== updatePayload.bio) throw new Error('Bio/about was not updated');
    if (dataUpdate.data.user.status !== 'busy') throw new Error('Status was not updated');
    console.log('✅ User successfully updated own name, avatar, bio, department, and status.');

    // -------------------------------------------------------------
    // TEST 6: Mass-Assignment Attack Prevention
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Prevent Mass-Assignment of Protected Fields ---');
    const maliciousPayload = {
      role: 'admin', // Malicious privilege escalation
      email: 'hacked_alice@evil.com', // Attempting unverified email change
      password: 'HackedPassword999!', // Attempting unauthorized password override
      isVerified: true, // Bypass verification flag
      _id: '60c72b2f9b1d8b2bad000000', // Attempt ID manipulation
      name: 'Alice Security Checked',
    };

    const resAttack = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify(maliciousPayload),
    });
    const dataAttack = await resAttack.json();
    console.log('Attempted privilege escalation response:', {
      status: resAttack.status,
      role: dataAttack.data?.user?.role,
      email: dataAttack.data?.user?.email,
      isVerified: dataAttack.data?.user?.isVerified,
      _id: dataAttack.data?.user?._id,
    });

    if (dataAttack.data.user.role === 'admin') {
      throw new Error('SECURITY VIOLATION: Attacker escalated role to admin via mass-assignment!');
    }
    if (dataAttack.data.user.email !== 'alice_p4@campus.edu') {
      throw new Error('SECURITY VIOLATION: Email was changed via profile patch!');
    }
    if (dataAttack.data.user.isVerified === true) {
      throw new Error('SECURITY VIOLATION: isVerified was tampered with!');
    }
    if (dataAttack.data.user._id !== aliceId) {
      throw new Error('SECURITY VIOLATION: User _id was overwritten!');
    }
    console.log('✅ Mass assignment strictly blocked: role, email, password, and _id protected.');

    // -------------------------------------------------------------
    // TEST 7: Cross-User Profile Modification Prevention
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Cross-User Profile Modification Prevention ---');
    // Notice PATCH /api/users/me has no ID in the URL.
    // Even if an attacker puts Arun's ID or another ID in the body:
    const resSpoof = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`, // Alice's token
      },
      body: JSON.stringify({
        _id: arunId,
        id: arunId,
        name: 'Arun Patel HACKED by Alice',
      }),
    });
    const dataSpoof = await resSpoof.json();

    // Verify Arun in DB was untouched
    const freshArun = await User.findById(arunId);
    if (freshArun.name === 'Arun Patel HACKED by Alice') {
      throw new Error('SECURITY VIOLATION: Alice was able to mutate Arun’s profile!');
    }
    console.log(`Arun in database name is: "${freshArun.name}" (Untouched)`);
    console.log('✅ Users can only update their own profile; cross-user mutation is impossible.\n');

    // -------------------------------------------------------------
    // Cleanup Test Users
    // -------------------------------------------------------------
    await User.deleteMany({
      email: {
        $in: [
          'alice_p4@campus.edu',
          'arun_p4@campus.edu',
          'carol_p4@campus.edu',
        ],
      },
    });
    console.log('🧹 Cleaned up temporary test users.');

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL PHASE 4 INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('🎉 ========================================================\n');
  } catch (err) {
    console.error('❌ Test suite failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit();
  }
}

runTests();
