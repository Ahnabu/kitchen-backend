process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, Staff } from '../src/models';
import http from 'http';

const TEST_PORT = 3008;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Staff Management (Step 4.3)...');

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
        name: 'Staff Manager',
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
    // Test 1: Add Staff Member
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Add Staff Member ---');
    const addRes = await fetch(`${BASE_URL}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Ahmed Hassan',
        role: 'Bartender',
        shift: '5 PM – 1 AM',
        status: 'on-duty',
      }),
    });
    const addData = await addRes.json();
    console.log(`POST /staff status: ${addRes.status}`);
    console.log('Response:', JSON.stringify(addData, null, 2));
    if (addRes.status !== 201) throw new Error('Failed to create staff member');
    if (addData.data.staff.status !== 'on-duty') throw new Error('Status mismatch');
    const staffId = addData.data.staff.id;

    // -------------------------------------------------------------
    // Test 2: Get Staff Roster
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Get Staff Roster ---');
    const getRes = await fetch(`${BASE_URL}/staff`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const getData = await getRes.json();
    console.log(`GET /staff status: ${getRes.status}`);
    console.log('Roster count:', getData.data.staff.length);
    if (getRes.status !== 200) throw new Error('Failed to get staff roster');
    if (getData.data.staff.length !== 1) throw new Error('Staff count mismatch');
    if (getData.data.staff[0].name !== 'Ahmed Hassan') throw new Error('Staff name mismatch');

    // -------------------------------------------------------------
    // Test 3: Update Staff Shift & Status
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Update Staff Shift & Status ---');
    const updateRes = await fetch(`${BASE_URL}/staff/${staffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'off-duty',
        shift: '12 PM – 8 PM',
      }),
    });
    const updateData = await updateRes.json();
    console.log(`PUT /staff/${staffId} status: ${updateRes.status}`);
    console.log('Response:', JSON.stringify(updateData, null, 2));
    if (updateRes.status !== 200) throw new Error('Failed to update staff member');
    if (updateData.data.staff.status !== 'off-duty' || updateData.data.staff.shift !== '12 PM – 8 PM') {
      throw new Error('Updated data mismatch');
    }

    // -------------------------------------------------------------
    // Test 4: Delete Staff Member
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Delete Staff Member ---');
    const deleteRes = await fetch(`${BASE_URL}/staff/${staffId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    console.log(`DELETE /staff/${staffId} status: ${deleteRes.status}`);
    if (deleteRes.status !== 200) throw new Error('Failed to delete staff member');

    // Verify roster is empty
    const checkRes = await Staff.findAll();
    if (checkRes.length !== 0) throw new Error('Roster should be empty in DB');

    console.log('\n🎉 ALL STEP 4.3 STAFF TESTS PASSED SUCCESSFULLY! 🎉');
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
