process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, Order, OrderItem, Reservation, Review, MenuItem } from '../src/models';
import http from 'http';

const TEST_PORT = 3009;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Business Analytics (Step 4.4)...');

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
        name: 'Stats Manager',
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
    // Setup: Seed transactional data for analytics
    // -------------------------------------------------------------
    console.log('\n--- Setup: Seeding Transactional Data ---');
    
    // 0. Create menu items first to satisfy foreign key constraints
    await MenuItem.create({
      id: 'burger-1',
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
    await MenuItem.create({
      id: 'fries-1',
      name: 'Truffle Fries',
      description: 'Tasty fries',
      price: 6.00,
      category: 'sides',
      diet: 'veg',
      spicy: false,
      imageUrl: '/uploads/menu/fries.png',
      popular: true,
      soldOut: false,
    });

    // 1. Create published review
    await Review.create({
      name: 'Happy Diner',
      rating: 5,
      dish: 'Smokehouse BBQ Burger',
      text: 'This was the best burger ever! Highly recommended.',
      verified: true,
      status: 'published',
      date: 'August 5, 2026',
    });

    // 2. Create reservation for today
    const todayDateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await Reservation.create({
      ref: 'RES-9999',
      name: 'Zack Vella',
      email: 'zack@example.com',
      phone: '99228811',
      date: todayDateStr,
      time: '20:00',
      guests: '4',
      status: 'confirmed',
      occasion: 'Birthday',
    });

    // 3. Create delivered order for today
    const order = await Order.create({
      userId: null,
      customerName: 'Zack Guest',
      customerEmail: 'zackguest@example.com',
      customerPhone: '99887711',
      paymentMethod: 'cash',
      deliveryAddress: '12, Triq il-Kbira',
      deliveryArea: 'Sliema',
      deliveryCity: 'Malta',
      deliveryFee: 2.50,
      subtotal: 147.50,
      total: 150.00,
      status: 'delivered',
      paymentStatus: 'paid',
      orderRef: 'TK-1234',
    });

    // 4. Create order items for the order
    await OrderItem.create({
      orderId: order.id,
      menuItemId: 'burger-1',
      itemName: 'Smokehouse BBQ Burger',
      itemPrice: 15.00,
      quantity: 5,
      subtotal: 75.00,
    });
    await OrderItem.create({
      orderId: order.id,
      menuItemId: 'fries-1',
      itemName: 'Truffle Fries',
      itemPrice: 6.00,
      quantity: 10,
      subtotal: 60.00,
    });

    console.log('Transactional seeding completed.');

    // -------------------------------------------------------------
    // Test 1: Get Overview (Admin)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Get Analytics Overview ---');
    const overviewRes = await fetch(`${BASE_URL}/analytics/overview`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const overviewData = await overviewRes.json();
    console.log(`GET /analytics/overview status: ${overviewRes.status}`);
    console.log('Overview Stats:', JSON.stringify(overviewData.data, null, 2));
    if (overviewRes.status !== 200) throw new Error('Failed to get overview stats');
    if (overviewData.data.revenueToday !== 150.00) throw new Error('Revenue today should be 150.00');
    if (overviewData.data.ordersToday !== 1) throw new Error('Orders today should be 1');
    if (overviewData.data.coversTonight !== 4) throw new Error('Covers tonight should be 4');
    if (overviewData.data.averageRating !== 5.0) throw new Error('Average rating should be 5.0');

    // -------------------------------------------------------------
    // Test 2: Get Weekly Stats (Admin)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Get Weekly Stats ---');
    const weeklyRes = await fetch(`${BASE_URL}/analytics/weekly`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const weeklyData = await weeklyRes.json();
    console.log(`GET /analytics/weekly status: ${weeklyRes.status}`);
    console.log('Weekly Grouped Stats:', JSON.stringify(weeklyData.data, null, 2));
    if (weeklyRes.status !== 200) throw new Error('Failed to get weekly stats');
    
    // Today's day block should have 1 order and 150.00 revenue
    const todayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    const todayBlock = weeklyData.data.find((b: any) => b.day === todayLabel);
    if (!todayBlock) throw new Error('Could not find today block in weekly stats');
    if (todayBlock.orders !== 1 || todayBlock.revenue !== 150.00) {
      throw new Error('Today stats mismatch in weekly results');
    }

    // -------------------------------------------------------------
    // Test 3: Get Top Dishes (Admin)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Get Top Dishes ---');
    const topRes = await fetch(`${BASE_URL}/analytics/top-dishes`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const topData = await topRes.json();
    console.log(`GET /analytics/top-dishes status: ${topRes.status}`);
    console.log('Top Dishes:', JSON.stringify(topData.data, null, 2));
    if (topRes.status !== 200) throw new Error('Failed to get top dishes');
    if (topData.data.length !== 2) throw new Error('Should list exactly 2 items');
    
    // Truffle Fries (10) should be #1, Burger (5) should be #2
    if (topData.data[0].name !== 'Truffle Fries' || topData.data[0].quantitySold !== 10) {
      throw new Error('Truffle Fries should be top dish with 10 quantity');
    }
    if (topData.data[1].name !== 'Smokehouse BBQ Burger' || topData.data[1].quantitySold !== 5) {
      throw new Error('Burger should be second dish with 5 quantity');
    }

    console.log('\n🎉 ALL STEP 4.4 ANALYTICS TESTS PASSED SUCCESSFULLY! 🎉');
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
