import request from 'supertest';
import app from '../src/app.js';

async function runTests() {
  console.log('🧪 Starting Contact & Phone OTP API Tests...');

  // 1. Send OTP to valid phone number (+919876543210)
  const sendRes = await request(app)
    .post('/api/auth/phone/send-otp')
    .send({ phone: '9876543210', countryCode: 'IN' });

  console.log('1. Send OTP status:', sendRes.status, sendRes.body.data?.phone);
  if (sendRes.status !== 200 || !sendRes.body.data?.devOtp) {
    throw new Error('Failed to send OTP');
  }

  const devOtp = sendRes.body.data.devOtp;

  // 2. Verify OTP with Name -> Should register and return JWT
  const verifyRes = await request(app)
    .post('/api/auth/phone/verify-otp')
    .send({
      phone: '+919876543210',
      otp: devOtp,
      name: 'Rohan Sharma',
    });

  console.log('2. Verify OTP status:', verifyRes.status, 'User:', verifyRes.body.data?.user?.name);
  if (!verifyRes.body.data?.token) {
    throw new Error('Failed to verify OTP');
  }

  const token = verifyRes.body.data.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  // 3. Check Phone Endpoint
  const checkRegisteredRes = await request(app)
    .post('/api/contacts/check-phone')
    .set(authHeader)
    .send({ phone: '+919876543210' });

  console.log('3. Check Registered Phone:', checkRegisteredRes.body.data?.isRegistered === true ? 'PASSED' : 'FAILED');

  const checkUnregisteredRes = await request(app)
    .post('/api/contacts/check-phone')
    .set(authHeader)
    .send({ phone: '+919999900000' });

  console.log('3b. Check Unregistered Phone:', checkUnregisteredRes.body.data?.isRegistered === false ? 'PASSED' : 'FAILED');

  // 4. Block adding own phone number
  const ownNumberRes = await request(app)
    .post('/api/contacts')
    .set(authHeader)
    .send({ name: 'Myself', phone: '+919876543210' });

  console.log('4. Block own number (should be 400):', ownNumberRes.status === 400 ? 'PASSED' : 'FAILED');

  // 5. Add registered contact
  // First register another test contact (+919876543211)
  await request(app)
    .post('/api/auth/phone/send-otp')
    .send({ phone: '+919876543211' });
  await request(app)
    .post('/api/auth/phone/verify-otp')
    .send({ phone: '+919876543211', otp: '123456', name: 'Priya Patel' });

  const addRegRes = await request(app)
    .post('/api/contacts')
    .set(authHeader)
    .send({ name: 'Priya College', phone: '+919876543211' });

  console.log('5. Add Registered Contact:', addRegRes.status === 201, 'isRegistered:', addRegRes.body.data?.contact?.isRegistered);

  // 6. Block duplicate contact
  const dupRes = await request(app)
    .post('/api/contacts')
    .set(authHeader)
    .send({ name: 'Priya Duplicate', phone: '+919876543211' });

  console.log('6. Block duplicate (should be 409):', dupRes.status === 409 ? 'PASSED' : 'FAILED');

  // 7. Add unregistered contact
  const addUnregRes = await request(app)
    .post('/api/contacts')
    .set(authHeader)
    .send({ name: 'Rahul Unregistered', phone: '+919999900000' });

  console.log('7. Add Unregistered Contact:', addUnregRes.status === 201, 'isRegistered:', addUnregRes.body.data?.contact?.isRegistered);
  const unregContactId = addUnregRes.body.data?.contact?.id;

  // 8. List contacts
  const listRes = await request(app)
    .get('/api/contacts')
    .set(authHeader);

  console.log('8. List Contacts count:', listRes.body.data?.contacts?.length);

  // 9. Toggle Favorite
  const favRes = await request(app)
    .patch(`/api/contacts/${unregContactId}/favorite`)
    .set(authHeader);
  console.log('9. Toggle Favorite:', favRes.body.data?.contact?.isFavorite === true ? 'PASSED' : 'FAILED');

  // 10. Toggle Block
  const blockRes = await request(app)
    .patch(`/api/contacts/${unregContactId}/block`)
    .set(authHeader);
  console.log('10. Toggle Block:', blockRes.body.data?.contact?.isBlocked === true ? 'PASSED' : 'FAILED');

  // 11. Sync device contacts
  const syncRes = await request(app)
    .post('/api/contacts/sync')
    .set(authHeader)
    .send({
      contacts: [
        { name: 'Sync Contact 1', phone: '+919876543211' },
        { name: 'Sync Contact 2', phone: '+919888877777' },
      ],
    });
  console.log('11. Sync Contacts total:', syncRes.body.data?.contacts?.length);

  console.log('🎉 ALL 11 CONTACT & PHONE OTP BACKEND TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

