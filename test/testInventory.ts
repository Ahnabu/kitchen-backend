process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, Inventory } from '../src/models';
import http from 'http';

const TEST_PORT = 3007;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Inventory Management (Step 4.2)...');

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
        name: 'Inventory Admin',
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
    // Test 1: Add Inventory Item (OK Stock)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Add Inventory Item (OK Stock) ---');
    const item1Res = await fetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        item: 'Brioche Buns',
        stock: 100,
        minLevel: 30,
        unit: 'pcs',
      }),
    });
    const item1Data = await item1Res.json();
    console.log(`POST /inventory (1) status: ${item1Res.status}`);
    console.log('Response:', JSON.stringify(item1Data, null, 2));
    if (item1Res.status !== 201) throw new Error('Failed to create inventory item 1');
    if (item1Data.data.item.status !== 'ok') throw new Error('Status should be ok');
    const item1Id = item1Data.data.item.id;

    // -------------------------------------------------------------
    // Test 2: Add Inventory Item (Low Stock)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Add Inventory Item (Low Stock) ---');
    const item2Res = await fetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        item: 'Truffle Sauce',
        stock: 2,
        minLevel: 5,
        unit: 'L',
      }),
    });
    const item2Data = await item2Res.json();
    console.log(`POST /inventory (2) status: ${item2Res.status}`);
    console.log('Response:', JSON.stringify(item2Data, null, 2));
    if (item2Res.status !== 201) throw new Error('Failed to create inventory item 2');
    if (item2Data.data.item.status !== 'low') throw new Error('Status should be low');
    const item2Id = item2Data.data.item.id;

    // -------------------------------------------------------------
    // Test 3: Add Inventory Item (Critical Stock)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Add Inventory Item (Critical Stock) ---');
    const item3Res = await fetch(`${BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        item: 'Smoked Cheddar',
        stock: 0,
        minLevel: 10,
        unit: 'kg',
      }),
    });
    const item3Data = await item3Res.json();
    console.log(`POST /inventory (3) status: ${item3Res.status}`);
    console.log('Response:', JSON.stringify(item3Data, null, 2));
    if (item3Res.status !== 201) throw new Error('Failed to create inventory item 3');
    if (item3Data.data.item.status !== 'critical') throw new Error('Status should be critical');
    const item3Id = item3Data.data.item.id;

    // -------------------------------------------------------------
    // Test 4: Get All Inventory
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Get All Inventory ---');
    const getRes = await fetch(`${BASE_URL}/inventory`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const getData = await getRes.json();
    console.log(`GET /inventory status: ${getRes.status}`);
    console.log('Total count:', getData.data.items.length);
    if (getRes.status !== 200) throw new Error('Failed to get inventory list');
    if (getData.data.items.length !== 3) throw new Error('Inventory count mismatch');

    // -------------------------------------------------------------
    // Test 5: Get Inventory Alerts
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Get Inventory Alerts ---');
    const getAlertsRes = await fetch(`${BASE_URL}/inventory/alerts`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const getAlertsData = await getAlertsRes.json();
    console.log(`GET /inventory/alerts status: ${getAlertsRes.status}`);
    console.log('Alert count:', getAlertsData.data.items.length);
    if (getAlertsRes.status !== 200) throw new Error('Failed to get inventory alerts list');
    if (getAlertsData.data.items.length !== 2) throw new Error('Alert count mismatch');

    // Verify alert contains Truffle Sauce and Smoked Cheddar
    const item2Alert = getAlertsData.data.items.find((i: any) => i.id === item2Id);
    const item3Alert = getAlertsData.data.items.find((i: any) => i.id === item3Id);
    if (!item2Alert || !item3Alert) throw new Error('Expected items not in alerts');

    // -------------------------------------------------------------
    // Test 6: Update Item 1 to low stock
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Update Item 1 Stock to low ---');
    const updateRes = await fetch(`${BASE_URL}/inventory/${item1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        stock: 15, // lower than minLevel of 30
      }),
    });
    const updateData = await updateRes.json();
    console.log(`PUT /inventory/${item1Id} status: ${updateRes.status}`);
    console.log('Response:', JSON.stringify(updateData, null, 2));
    if (updateRes.status !== 200) throw new Error('Failed to update inventory item');
    if (updateData.data.item.status !== 'low') throw new Error('Status should change to low');

    // -------------------------------------------------------------
    // Test 7: Delete Inventory Item
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Delete Inventory Item ---');
    const deleteRes = await fetch(`${BASE_URL}/inventory/${item3Id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    console.log(`DELETE /inventory/${item3Id} status: ${deleteRes.status}`);
    if (deleteRes.status !== 200) throw new Error('Failed to delete inventory item');

    // Verify count in DB is 2
    const checkRes = await Inventory.findAll();
    if (checkRes.length !== 2) throw new Error('DB should only have 2 items left');

    console.log('\n🎉 ALL STEP 4.2 INVENTORY TESTS PASSED SUCCESSFULLY! 🎉');
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
