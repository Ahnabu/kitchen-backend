process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, Review, User } from '../src/models';
import http from 'http';

const TEST_PORT = 3003;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Reviews (Step 3.3)...');

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
    // Setup: Register Customer and Admin
    // -------------------------------------------------------------
    console.log('\n--- Setup: Register Customer & Admin ---');
    const custRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Customer',
        email: 'customer@example.com',
        password: 'password123',
        phone: '99112233',
      }),
    });
    const custData = await custRes.json();
    const custToken = custData.data.accessToken;

    const adminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chef Admin',
        email: 'admin@example.com',
        password: 'password123',
        phone: '99445566',
        role: 'admin',
      }),
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.data.accessToken;
    console.log(`Tokens obtained.`);

    // -------------------------------------------------------------
    // Test 1: Submit Guest Review
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Submit Guest Review ---');
    const guestRevRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Anonymous Guest',
        rating: 4,
        dish: 'Truffle Fries',
        text: 'The fries were crisp, but truffle flavour was a bit light.',
      }),
    });
    const guestRevData = await guestRevRes.json();
    console.log(`POST /reviews (Guest) status: ${guestRevRes.status}`);
    console.log('Response:', JSON.stringify(guestRevData, null, 2));
    if (guestRevRes.status !== 201) throw new Error('Failed to submit guest review');
    if (guestRevData.data.review.status !== 'pending') throw new Error('Review status should be pending');
    if (guestRevData.data.review.verified) throw new Error('Guest review should not be verified');
    const guestRevId = guestRevData.data.review.id;

    // -------------------------------------------------------------
    // Test 2: Submit Authenticated Customer Review
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Submit Authenticated Customer Review ---');
    const custRevRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        dish: 'Smokehouse BBQ Burger',
        text: 'Best burger in Malta! Perfectly smoked and juicy.',
      }),
    });
    const custRevData = await custRevRes.json();
    console.log(`POST /reviews (Customer) status: ${custRevRes.status}`);
    console.log('Response:', JSON.stringify(custRevData, null, 2));
    if (custRevRes.status !== 201) throw new Error('Failed to submit customer review');
    if (custRevData.data.review.name !== 'John Customer') throw new Error('Should use user profile name');
    if (!custRevData.data.review.verified) throw new Error('Customer review should be verified');
    const custRevId = custRevData.data.review.id;

    // -------------------------------------------------------------
    // Test 3: Get Public Reviews (None should show up)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Get Public Reviews (Before Approval) ---');
    const pubRes1 = await fetch(`${BASE_URL}/reviews`);
    const pubData1 = await pubRes1.json();
    console.log(`GET /reviews results count: ${pubData1.data.reviews.length}`);
    if (pubData1.data.reviews.length !== 0) {
      throw new Error('No reviews should be public before admin approval');
    }

    // -------------------------------------------------------------
    // Test 4: Approve Guest Review (Admin authorization check)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Approve Guest Review ---');
    const approveRes = await fetch(`${BASE_URL}/reviews/${guestRevId}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const approveData = await approveRes.json();
    console.log(`PATCH /reviews/${guestRevId}/approve status: ${approveRes.status}`);
    if (approveRes.status !== 200) throw new Error('Failed to approve review');
    if (approveData.data.review.status !== 'published') {
      throw new Error('Status should be updated to published');
    }

    // -------------------------------------------------------------
    // Test 5: Verify Public Reviews contains Approved review
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Verify Approved Review in Public List ---');
    const pubRes2 = await fetch(`${BASE_URL}/reviews`);
    const pubData2 = await pubRes2.json();
    console.log(`GET /reviews results count: ${pubData2.data.reviews.length}`);
    if (pubData2.data.reviews.length !== 1) throw new Error('Should contain exactly 1 public review');
    if (pubData2.data.reviews[0].id !== guestRevId) throw new Error('ID mismatch for public review');

    // -------------------------------------------------------------
    // Test 6: Reject Customer Review
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Reject Customer Review ---');
    const rejectRes = await fetch(`${BASE_URL}/reviews/${custRevId}/reject`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const rejectData = await rejectRes.json();
    console.log(`PATCH /reviews/${custRevId}/reject status: ${rejectRes.status}`);
    if (rejectRes.status !== 200) throw new Error('Failed to reject review');
    if (rejectData.data.review.status !== 'rejected') {
      throw new Error('Status should be updated to rejected');
    }

    // Public list should still be 1
    const pubRes3 = await fetch(`${BASE_URL}/reviews`);
    const pubData3 = await pubRes3.json();
    if (pubData3.data.reviews.length !== 1) {
      throw new Error('Rejected review should not appear in public list');
    }

    // -------------------------------------------------------------
    // Test 7: Delete Rejected Review
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Delete Rejected Review ---');
    const deleteRes = await fetch(`${BASE_URL}/reviews/${custRevId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const deleteData = await deleteRes.json();
    console.log(`DELETE /reviews/${custRevId} status: ${deleteRes.status}`);
    if (deleteRes.status !== 200) throw new Error('Failed to delete review');

    // Double check DB
    const deletedCheck = await Review.findByPk(custRevId);
    if (deletedCheck !== null) throw new Error('Review record should be deleted from DB');

    console.log('\n🎉 ALL STEP 3.3 REVIEWS TESTS PASSED SUCCESSFULLY! 🎉');
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
