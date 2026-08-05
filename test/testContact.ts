process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, ContactMessage, User } from '../src/models';
import http from 'http';

const TEST_PORT = 3004;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Contact Messages (Step 3.4)...');

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
    // Test 1: Submit Contact Message 1 (Guest)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Submit Contact Message 1 ---');
    const msg1Res = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sam Borg',
        email: 'sam@example.com',
        subject: 'Reservation Enquiry',
        message: 'Looking to book a private event for 20 people.',
      }),
    });
    const msg1Data = await msg1Res.json();
    console.log(`POST /contact (1) status: ${msg1Res.status}`);
    console.log('Response:', JSON.stringify(msg1Data, null, 2));
    if (msg1Res.status !== 201) throw new Error('Failed to submit contact message 1');
    if (msg1Data.data.contact.status !== 'new') throw new Error('Status should be new');
    const msg1Id = msg1Data.data.contact.id;

    // -------------------------------------------------------------
    // Test 2: Submit Contact Message 2 (Guest)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Submit Contact Message 2 ---');
    const msg2Res = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Maria Zammit',
        email: 'maria@example.com',
        subject: 'Feedback',
        message: 'The food was absolutely wonderful! Thank you so much.',
      }),
    });
    const msg2Data = await msg2Res.json();
    console.log(`POST /contact (2) status: ${msg2Res.status}`);
    const msg2Id = msg2Data.data.contact.id;

    // -------------------------------------------------------------
    // Test 3: Get Contact Messages (Guest - should fail)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Get Contact Messages (Guest - should fail) ---');
    const getGuestRes = await fetch(`${BASE_URL}/contact`);
    console.log(`GET /contact (Guest) status: ${getGuestRes.status}`);
    if (getGuestRes.status !== 401) throw new Error('Should block guest viewing of contact messages');

    // -------------------------------------------------------------
    // Test 4: Get Contact Messages (Admin - should succeed)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Get Contact Messages (Admin) ---');
    const getAdminRes = await fetch(`${BASE_URL}/contact`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const getAdminData = await getAdminRes.json();
    console.log(`GET /contact (Admin) status: ${getAdminRes.status}`);
    console.log('Results count:', getAdminData.data.messages.length);
    if (getAdminRes.status !== 200) throw new Error('Failed to get contact messages');
    if (getAdminData.data.messages.length !== 2) throw new Error('Contact messages count mismatch');

    // -------------------------------------------------------------
    // Test 5: Update Message 1 Status
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Update Message 1 Status to read ---');
    const updateRes = await fetch(`${BASE_URL}/contact/${msg1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'read' }),
    });
    const updateData = await updateRes.json();
    console.log(`PATCH /contact/${msg1Id}/status status: ${updateRes.status}`);
    console.log('Response:', JSON.stringify(updateData, null, 2));
    if (updateRes.status !== 200) throw new Error('Failed to update status');
    if (updateData.data.contact.status !== 'read') throw new Error('Status mismatch');

    // -------------------------------------------------------------
    // Test 6: Delete Message 2
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Delete Message 2 ---');
    const deleteRes = await fetch(`${BASE_URL}/contact/${msg2Id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    console.log(`DELETE /contact/${msg2Id} status: ${deleteRes.status}`);
    if (deleteRes.status !== 200) throw new Error('Failed to delete contact message');

    // Verify count is 1
    const checkRes = await fetch(`${BASE_URL}/contact`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const checkData = await checkRes.json();
    if (checkData.data.messages.length !== 1) throw new Error('Message count should be 1');
    if (checkData.data.messages[0].id !== msg1Id) throw new Error('Remaining message should be message 1');

    console.log('\n🎉 ALL STEP 3.4 CONTACT TESTS PASSED SUCCESSFULLY! 🎉');
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
