process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, User, LoyaltyTransaction } from '../src/models';
import http from 'http';

const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Auth Module...');

  // Sync Database
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

  let accessToken = '';
  let refreshCookie = '';

  try {
    // -------------------------------------------------------------
    // Test 1: User Registration
    // -------------------------------------------------------------
    console.log('\n--- Test 1: User Registration ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ahmed Al-Farsi',
        email: 'ahmed@example.com',
        password: 'password123',
        phone: '99119100',
      }),
    });

    const regData = await regRes.json();
    console.log(`Status Code: ${regRes.status}`);
    console.log('Response Body:', JSON.stringify(regData, null, 2));

    if (regRes.status !== 201) throw new Error('Registration failed');
    if (regData.data.user.loyaltyPoints !== 500) throw new Error('Loyalty points should start at 500');
    console.log('✅ Test 1 Passed: User registered with 500 loyalty points.');

    // Save tokens and cookies
    accessToken = regData.data.accessToken;
    const cookies = regRes.headers.getSetCookie();
    refreshCookie = cookies.find((c) => c.startsWith('refreshToken=')) || '';
    console.log('Received Refresh Cookie:', refreshCookie);

    // Verify LoyaltyTransaction record in DB
    const dbTx = await LoyaltyTransaction.findOne({ where: { userId: regData.data.user.id } });
    if (!dbTx || dbTx.points !== 500 || dbTx.type !== 'bonus') {
      throw new Error('LoyaltyTransaction record not created or incorrect');
    }
    console.log('✅ Verified LoyaltyTransaction bonus entry exists in DB.');

    // -------------------------------------------------------------
    // Test 2: Duplicate Registration Prevention
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Duplicate Registration Prevention ---');
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ahmed Al-Farsi Duplicate',
        email: 'ahmed@example.com',
        password: 'password456',
      }),
    });

    const dupData = await dupRes.json();
    console.log(`Status Code: ${dupRes.status}`);
    console.log('Response Body:', JSON.stringify(dupData, null, 2));

    if (dupRes.status !== 400) throw new Error('Registration should have failed with 400');
    console.log('✅ Test 2 Passed: Duplicate registration prevented.');

    // -------------------------------------------------------------
    // Test 3: User Login
    // -------------------------------------------------------------
    console.log('\n--- Test 3: User Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ahmed@example.com',
        password: 'password123',
      }),
    });

    const loginData = await loginRes.json();
    console.log(`Status Code: ${loginRes.status}`);
    console.log('Response: Logged in successfully.');

    if (loginRes.status !== 200) throw new Error('Login failed');
    accessToken = loginData.data.accessToken;
    console.log('✅ Test 3 Passed: User login success.');

    // -------------------------------------------------------------
    // Test 4: Access Protected Route (Valid Token)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Access Protected Route (Valid Token) ---');
    const protRes = await fetch(`${BASE_URL}/test-protected`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const protData = await protRes.json();
    console.log(`Status Code: ${protRes.status}`);
    console.log('Response Body:', JSON.stringify(protData, null, 2));

    if (protRes.status !== 200) throw new Error('Protected route access failed');
    console.log('✅ Test 4 Passed: Protected route accessed successfully.');

    // -------------------------------------------------------------
    // Test 5: Token Refresh
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Token Refresh ---');
    const refRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: refreshCookie,
      },
    });

    const refData = await refRes.json();
    console.log(`Status Code: ${refRes.status}`);
    console.log('Response Body:', JSON.stringify(refData, null, 2));

    if (refRes.status !== 200) throw new Error('Token refresh failed');
    if (!refData.accessToken) throw new Error('New access token missing');
    console.log('✅ Test 5 Passed: Token refresh success.');

    // -------------------------------------------------------------
    // Test 6: User Logout
    // -------------------------------------------------------------
    console.log('\n--- Test 6: User Logout ---');
    const outRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
    });

    const outData = await outRes.json();
    console.log(`Status Code: ${outRes.status}`);
    console.log('Response Body:', JSON.stringify(outData, null, 2));

    if (outRes.status !== 200) throw new Error('Logout failed');
    console.log('✅ Test 6 Passed: User logout success.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
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
