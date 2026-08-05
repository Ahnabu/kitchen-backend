process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, NewsletterSubscriber } from '../src/models';
import http from 'http';

const TEST_PORT = 3005;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Newsletter Subscribers (Step 3.5)...');

  // Sync Database & Reset
  console.log('🔌 Syncing database schema...');
  await sequelize.sync({ force: true });
  console.log('✅ Database schema synced.');

  // Start HTTP Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`🚀 Test server listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // Setup: Register Admin
    // -------------------------------------------------------------
    console.log('\n--- Setup: Register Admin ---');
    const adminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manager Admin',
        email: 'admin@example.com',
        password: 'password123',
        phone: '99445566',
        role: 'admin',
      }),
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.data.accessToken;
    console.log(`Admin Token obtained.`);

    // -------------------------------------------------------------
    // Test 1: Subscribe Email 1
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Subscribe Email 1 ---');
    const sub1Res = await fetch(`${BASE_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'subscriber1@example.com' }),
    });
    const sub1Data = await sub1Res.json();
    console.log(`POST /newsletter/subscribe status: ${sub1Res.status}`);
    console.log('Response:', JSON.stringify(sub1Data, null, 2));
    if (sub1Res.status !== 201) throw new Error('Failed to subscribe email 1');
    if (!sub1Data.data.subscriber.active) throw new Error('Subscriber should be active');

    // -------------------------------------------------------------
    // Test 2: Double Subscribe Same Email
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Double Subscribe Same Email ---');
    const subDupRes = await fetch(`${BASE_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'subscriber1@example.com' }),
    });
    const subDupData = await subDupRes.json();
    console.log(`POST /newsletter/subscribe (Duplicate) status: ${subDupRes.status}`);
    console.log('Response:', JSON.stringify(subDupData, null, 2));
    if (subDupRes.status !== 200) throw new Error('Should handle double subscription gracefully');

    // -------------------------------------------------------------
    // Test 3: Subscribe Email 2
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Subscribe Email 2 ---');
    const sub2Res = await fetch(`${BASE_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'subscriber2@example.com' }),
    });
    console.log(`POST /newsletter/subscribe (2) status: ${sub2Res.status}`);
    if (sub2Res.status !== 201) throw new Error('Failed to subscribe email 2');

    // -------------------------------------------------------------
    // Test 4: Get Subscribers (Admin)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Get Subscribers (Admin) ---');
    const getSubRes = await fetch(`${BASE_URL}/newsletter`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const getSubData = await getSubRes.json();
    console.log(`GET /newsletter status: ${getSubRes.status}`);
    console.log('Active Subscribers Count:', getSubData.data.subscribers.length);
    if (getSubRes.status !== 200) throw new Error('Failed to get subscribers list');
    if (getSubData.data.subscribers.length !== 2) throw new Error('Subscribers count mismatch');

    // -------------------------------------------------------------
    // Test 5: Unsubscribe Email 1
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Unsubscribe Email 1 ---');
    const unsubRes = await fetch(`${BASE_URL}/newsletter/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'subscriber1@example.com' }),
    });
    const unsubData = await unsubRes.json();
    console.log(`POST /newsletter/unsubscribe status: ${unsubRes.status}`);
    console.log('Response:', JSON.stringify(unsubData, null, 2));
    if (unsubRes.status !== 200) throw new Error('Failed to unsubscribe');

    // Verify in Admin list (should only show active: true)
    const getSubRes2 = await fetch(`${BASE_URL}/newsletter`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const getSubData2 = await getSubRes2.json();
    console.log('Active Subscribers Count after Unsubscribe:', getSubData2.data.subscribers.length);
    if (getSubData2.data.subscribers.length !== 1) throw new Error('Subscriber 1 should be omitted from active list');
    if (getSubData2.data.subscribers[0].email !== 'subscriber2@example.com') {
      throw new Error('Only Subscriber 2 should be active');
    }

    // -------------------------------------------------------------
    // Test 6: Re-subscribe (Reactivate) Email 1
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Reactivate Email 1 ---');
    const reactivateRes = await fetch(`${BASE_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'subscriber1@example.com' }),
    });
    const reactivateData = await reactivateRes.json();
    console.log(`POST /newsletter/subscribe (Reactivate) status: ${reactivateRes.status}`);
    console.log('Response:', JSON.stringify(reactivateData, null, 2));
    if (reactivateRes.status !== 200) throw new Error('Failed to reactivate subscriber');
    if (!reactivateData.data.subscriber.active) throw new Error('Subscriber should be active again');

    // Active count should be 2 again
    const getSubRes3 = await fetch(`${BASE_URL}/newsletter`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const getSubData3 = await getSubRes3.json();
    if (getSubData3.data.subscribers.length !== 2) throw new Error('Subscribers count should be 2');

    console.log('\n🎉 ALL STEP 3.5 NEWSLETTER TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ Test execution failed with error:', error);
    process.exitCode = 1;
  } finally {
    console.log('🔌 Closing test server...');
    server.close(() => {
      console.log('👋 Test server closed.');
    });
  }
}

runTests();
