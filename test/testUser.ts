process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, User, LoyaltyTransaction, MenuItem } from '../src/models';
import http from 'http';

const TEST_PORT = 3002;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for User Profile & Loyalty (Step 3.1)...');

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
    // Setup: Register a user
    // -------------------------------------------------------------
    console.log('\n--- Setup: Register Customer ---');
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
    const accessToken = regData.data.accessToken;
    console.log(`Customer Registered. Access Token obtained.`);

    // -------------------------------------------------------------
    // Test 1: Get Me Profile
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Get Profile details ---');
    const meRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const meData = await meRes.json();
    console.log(`GET /users/me status: ${meRes.status}`);
    console.log('User Profile:', JSON.stringify(meData.data.user, null, 2));
    if (meRes.status !== 200) throw new Error('Failed to get user profile');
    if (meData.data.user.name !== 'Ahmed Al-Farsi') throw new Error('Profile name mismatch');

    // -------------------------------------------------------------
    // Test 2: Update Profile details
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Update Profile details ---');
    const updateRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'Ahmed Updated',
        phone: '99887766',
        newsletterSubscribed: true,
      }),
    });
    const updateData = await updateRes.json();
    console.log(`PUT /users/me status: ${updateRes.status}`);
    console.log('Updated User:', JSON.stringify(updateData.data.user, null, 2));
    if (updateRes.status !== 200) throw new Error('Failed to update profile');
    if (updateData.data.user.name !== 'Ahmed Updated' || updateData.data.user.phone !== '99887766') {
      throw new Error('Update profile values mismatch');
    }

    // -------------------------------------------------------------
    // Test 3: Get Loyalty details
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Get Loyalty Details ---');
    const loyaltyRes = await fetch(`${BASE_URL}/users/me/loyalty`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const loyaltyData = await loyaltyRes.json();
    console.log(`GET /users/me/loyalty status: ${loyaltyRes.status}`);
    console.log('Loyalty Account:', JSON.stringify(loyaltyData.data, null, 2));
    if (loyaltyRes.status !== 200) throw new Error('Failed to get loyalty details');
    if (loyaltyData.data.points !== 500) throw new Error('Initial loyalty points should be 500');
    if (loyaltyData.data.history.length === 0) throw new Error('Loyalty history should have sign-up bonus');

    // -------------------------------------------------------------
    // Test 4: Redeem Loyalty (Validation - Below Threshold)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Redeem Loyalty (Validation - Below Threshold) ---');
    const redeemThresholdRes = await fetch(`${BASE_URL}/users/me/loyalty/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ points: 100 }), // Under 500 limit
    });
    const redeemThresholdData = await redeemThresholdRes.json();
    console.log(`POST /users/me/loyalty/redeem status: ${redeemThresholdRes.status}`);
    console.log('Response:', JSON.stringify(redeemThresholdData, null, 2));
    if (redeemThresholdRes.status !== 400) {
      throw new Error('Should block redemptions below 500 points');
    }

    // -------------------------------------------------------------
    // Test 5: Redeem Loyalty (Success)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Redeem Loyalty (Success) ---');
    const redeemSuccessRes = await fetch(`${BASE_URL}/users/me/loyalty/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ points: 500 }),
    });
    const redeemSuccessData = await redeemSuccessRes.json();
    console.log(`POST /users/me/loyalty/redeem status: ${redeemSuccessRes.status}`);
    console.log('Response:', JSON.stringify(redeemSuccessData, null, 2));
    if (redeemSuccessRes.status !== 200) throw new Error('Redemption failed');
    if (redeemSuccessData.data.points !== 0) throw new Error('Remaining points should be 0');

    // -------------------------------------------------------------
    // Test 6: Redeem Loyalty (Validation - Insufficient points)
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Redeem Loyalty (Validation - Insufficient points) ---');
    const redeemNoPointsRes = await fetch(`${BASE_URL}/users/me/loyalty/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ points: 500 }),
    });
    const redeemNoPointsData = await redeemNoPointsRes.json();
    console.log(`POST /users/me/loyalty/redeem status: ${redeemNoPointsRes.status}`);
    console.log('Response:', JSON.stringify(redeemNoPointsData, null, 2));
    if (redeemNoPointsRes.status !== 400) {
      throw new Error('Should block redemption when points are insufficient');
    }

    // -------------------------------------------------------------
    // Test 7: Upload Avatar Image
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Upload Avatar Image ---');
    const formData = new FormData();
    formData.append(
      'avatar',
      new Blob(['fake png image data'], { type: 'image/png' }),
      'avatar.png'
    );

    const avatarRes = await fetch(`${BASE_URL}/users/me/avatar`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
    const avatarData = await avatarRes.json();
    console.log(`PUT /users/me/avatar status: ${avatarRes.status}`);
    console.log('Response:', JSON.stringify(avatarData, null, 2));
    if (avatarRes.status !== 200) throw new Error('Avatar upload failed');
    if (!avatarData.data.avatarUrl.includes('avatar-') || !avatarData.data.avatarUrl.endsWith('.png')) {
      throw new Error('Avatar url should reference the uploaded file name pattern');
    }

    // -------------------------------------------------------------
    // Test 7.5: Place Order for Customer Order History
    // -------------------------------------------------------------
    console.log('\n--- Test 7.5: Place Order for Customer Order History ---');
    // Create menu item first
    await MenuItem.create({
      id: 'burger-test',
      name: 'Smokehouse BBQ Burger',
      description: 'Tasty burger',
      price: 15.00,
      category: 'burgers',
      diet: 'non-veg',
      spicy: false,
      imageUrl: '/uploads/menu/burger.png',
      popular: true,
      soldOut: false,
    });

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        customerName: 'Ahmed Updated',
        customerPhone: '99887766',
        customerEmail: 'ahmed@example.com',
        paymentMethod: 'cash',
        deliveryAddress: 'Sliema',
        deliveryArea: 'Sliema',
        deliveryCity: 'Malta',
        items: [
          {
            menuItemId: 'burger-test',
            quantity: 2,
          },
        ],
      }),
    });
    const orderData = await orderRes.json();
    console.log(`POST /orders status: ${orderRes.status}`);
    console.log('Order Response:', JSON.stringify(orderData, null, 2));
    if (orderRes.status !== 201) throw new Error('Failed to place order');

    // -------------------------------------------------------------
    // Test 7.6: Get Customer Order History
    // -------------------------------------------------------------
    console.log('\n--- Test 7.6: Get Customer Order History ---');
    const historyRes = await fetch(`${BASE_URL}/users/me/orders`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const historyData = await historyRes.json();
    console.log(`GET /users/me/orders status: ${historyRes.status}`);
    console.log('Order History:', JSON.stringify(historyData.data, null, 2));
    if (historyRes.status !== 200) throw new Error('Failed to get order history');
    if (historyData.data.orders.length !== 1) throw new Error('Order history should contain 1 order');
    if (historyData.data.orders[0].items[0].menuItemId !== 'burger-test') {
      throw new Error('Order item mismatch in history');
    }

    // -------------------------------------------------------------
    // Test 8: Create Address 1 (Home, isDefault = false)
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Create Address 1 (Home) ---');
    const addr1Res = await fetch(`${BASE_URL}/users/me/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        label: 'Home',
        address: '15, St. Julian\'s Road, Sliema',
        area: 'Sliema',
        isDefault: false,
      }),
    });
    const addr1Data = await addr1Res.json();
    console.log(`POST /users/me/addresses status: ${addr1Res.status}`);
    console.log('Address 1 Response:', JSON.stringify(addr1Data, null, 2));
    if (addr1Res.status !== 201) throw new Error('Failed to create address 1');
    const addr1Id = addr1Data.data.address.id;

    // -------------------------------------------------------------
    // Test 9: Create Address 2 (Work, isDefault = true)
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Create Address 2 (Work - Default) ---');
    const addr2Res = await fetch(`${BASE_URL}/users/me/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        label: 'Work',
        address: 'Valletta Business District, Valletta',
        area: 'Valletta',
        isDefault: true,
      }),
    });
    const addr2Data = await addr2Res.json();
    console.log(`POST /users/me/addresses status: ${addr2Res.status}`);
    console.log('Address 2 Response:', JSON.stringify(addr2Data, null, 2));
    if (addr2Res.status !== 201) throw new Error('Failed to create address 2');
    const addr2Id = addr2Data.data.address.id;

    // -------------------------------------------------------------
    // Test 10: Get Saved Addresses & Verify Defaults
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Get Saved Addresses & Verify Defaults ---');
    const getAddrRes = await fetch(`${BASE_URL}/users/me/addresses`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const getAddrData = await getAddrRes.json();
    console.log(`GET /users/me/addresses status: ${getAddrRes.status}`);
    console.log('Saved Addresses List:', JSON.stringify(getAddrData.data.addresses, null, 2));
    if (getAddrRes.status !== 200) throw new Error('Failed to get saved addresses');
    if (getAddrData.data.addresses.length !== 2) throw new Error('Addresses count mismatch');
    
    // Address 2 (Work) should be default (true), Address 1 (Home) should be updated to false
    const workAddr = getAddrData.data.addresses.find((a: any) => a.id === addr2Id);
    const homeAddr = getAddrData.data.addresses.find((a: any) => a.id === addr1Id);
    if (!workAddr.isDefault) throw new Error('Work address should be default');
    if (homeAddr.isDefault) throw new Error('Home address should have been set to non-default');

    // -------------------------------------------------------------
    // Test 11: Update Address 1 to default
    // -------------------------------------------------------------
    console.log('\n--- Test 11: Update Address 1 to default ---');
    const updateAddrRes = await fetch(`${BASE_URL}/users/me/addresses/${addr1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        label: 'Home Updated',
        address: '15, St. Julian\'s Road, Sliema',
        area: 'Sliema',
        isDefault: true,
      }),
    });
    const updateAddrData = await updateAddrRes.json();
    console.log(`PUT /users/me/addresses/${addr1Id} status: ${updateAddrRes.status}`);
    console.log('Update Address Response:', JSON.stringify(updateAddrData, null, 2));
    if (updateAddrRes.status !== 200) throw new Error('Failed to update address');
    
    // Now verify Home is default, Work is no longer default
    const checkAddrRes = await fetch(`${BASE_URL}/users/me/addresses`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const checkAddrData = await checkAddrRes.json();
    const updatedWork = checkAddrData.data.addresses.find((a: any) => a.id === addr2Id);
    const updatedHome = checkAddrData.data.addresses.find((a: any) => a.id === addr1Id);
    if (updatedWork.isDefault) throw new Error('Work address should no longer be default');
    if (!updatedHome.isDefault) throw new Error('Home address should now be default');

    // -------------------------------------------------------------
    // Test 12: Delete Address 2
    // -------------------------------------------------------------
    console.log('\n--- Test 12: Delete Address 2 ---');
    const deleteAddrRes = await fetch(`${BASE_URL}/users/me/addresses/${addr2Id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const deleteAddrData = await deleteAddrRes.json();
    console.log(`DELETE /users/me/addresses/${addr2Id} status: ${deleteAddrRes.status}`);
    console.log('Delete Address Response:', JSON.stringify(deleteAddrData, null, 2));
    if (deleteAddrRes.status !== 200) throw new Error('Failed to delete address');

    // Verify Address 2 is deleted
    const finalCheckRes = await fetch(`${BASE_URL}/users/me/addresses`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const finalCheckData = await finalCheckRes.json();
    if (finalCheckData.data.addresses.length !== 1) throw new Error('Address count should be 1');
    if (finalCheckData.data.addresses[0].id !== addr1Id) throw new Error('Only Address 1 should remain');

    console.log('\n🎉 ALL STEP 3.1 & 3.2 TESTS PASSED SUCCESSFULLY! 🎉');
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
