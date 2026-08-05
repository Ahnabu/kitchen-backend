process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, MenuItem, Order, OrderItem, Reservation } from '../src/models';
import { menuItems } from '../../src/data/menuData';
import http from 'http';
import { io as clientIo } from 'socket.io-client';

const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Core Features (Phase 2)...');

  // Sync Database & Reset
  console.log('🔌 Syncing database schema...');
  await sequelize.sync({ force: true });
  console.log('✅ Database schema synced.');

  // Seed Menu Items
  console.log('🌱 Seeding database with menu items...');
  const itemsToCreate = menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    nameAr: item.nameAr || null,
    description: item.description,
    price: item.price,
    category: item.category,
    diet: item.diet,
    spicy: item.spicy || false,
    soldOut: item.soldOut || false,
    imageUrl: item.image,
    tags: item.tags || null,
    rating: item.rating || 0.0,
    popular: item.popular || false,
  }));
  await MenuItem.bulkCreate(itemsToCreate);
  console.log(`✅ Seeded ${itemsToCreate.length} menu items.`);

  // Start HTTP Server
  const server = http.createServer(app);
  // Re-bind Socket.IO (normally done in server.ts, let's do it in app for integration test)
  const { Server } = require('socket.io');
  const ioServer = new Server(server, {
    cors: { origin: '*' },
  });

  ioServer.on('connection', (socket: any) => {
    socket.on('join_order', ({ orderRef }: { orderRef: string }) => {
      socket.join(`order:${orderRef}`);
    });
  });
  app.set('io', ioServer);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`🚀 Test server listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Retrieve Menu Items (Filter & Popularity)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Get Menu Items ---');
    const menuRes = await fetch(`${BASE_URL}/menu`);
    const menuData = await menuRes.json();
    console.log(`GET /menu status: ${menuRes.status}`);
    console.log(`Total menu items returned: ${menuData.data.items.length}`);
    if (menuRes.status !== 200 || menuData.data.items.length !== menuItems.length) {
      throw new Error('Failed to retrieve all menu items');
    }

    // Category check
    const burgerRes = await fetch(`${BASE_URL}/menu?category=burgers`);
    const burgerData = await burgerRes.json();
    console.log(`GET /menu?category=burgers returned: ${burgerData.data.items.length} items`);
    const allBurgers = burgerData.data.items.every((i: any) => i.category === 'burgers');
    if (!allBurgers) throw new Error('Category filter returned invalid items');

    // Search check
    const searchRes = await fetch(`${BASE_URL}/menu?search=Truffle`);
    const searchData = await searchRes.json();
    console.log(`GET /menu?search=Truffle returned: ${searchData.data.items.length} items`);
    if (searchData.data.items.length === 0) throw new Error('Search did not return items');

    // Popular items
    const popRes = await fetch(`${BASE_URL}/menu/popular`);
    const popData = await popRes.json();
    console.log(`GET /menu/popular returned: ${popData.data.items.length} items`);
    const allPopular = popData.data.items.every((i: any) => i.popular === true || i.popular === 1);
    if (!allPopular) throw new Error('Popular endpoint returned non-popular items');
    console.log('✅ Test 1 Passed: Menu retrieval filters verified.');

    // -------------------------------------------------------------
    // Test 2: Order Placement (Guest checkout)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Guest Order Placement ---');
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Guest User',
        customerPhone: '99119100',
        customerEmail: 'guest@example.com',
        deliveryAddress: '15, St. Julian\'s Road, Sliema',
        deliveryArea: 'Sliema',
        paymentMethod: 'cash',
        items: [
          { menuItemId: 'b1', quantity: 2 }, // Classic Burger
          { menuItemId: 'sd1', quantity: 1 }, // Fries
        ],
      }),
    });

    const orderData = await orderRes.json();
    console.log(`POST /orders status: ${orderRes.status}`);
    console.log('Order Response Body:', JSON.stringify(orderData, null, 2));

    if (orderRes.status !== 201) throw new Error('Order placement failed');
    const orderRef = orderData.data.order.orderRef;
    const orderId = orderData.data.order.id;
    if (!orderRef.startsWith('TK-')) throw new Error('Order reference code should start with TK-');
    console.log(`✅ Test 2 Passed: Order placed successfully. Ref: ${orderRef}`);

    // -------------------------------------------------------------
    // Test 3: Track Order by Reference
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Track Order ---');
    const trackRes = await fetch(`${BASE_URL}/orders/${orderRef}`);
    const trackData = await trackRes.json();
    console.log(`GET /orders/${orderRef} status: ${trackRes.status}`);
    console.log(`Subtotal: €${trackData.data.order.subtotal}`);
    console.log(`Total items in tracked order: ${trackData.data.order.items.length}`);
    if (trackRes.status !== 200) throw new Error('Order tracking failed');
    if (trackData.data.order.items.length !== 2) throw new Error('Line items count mismatch');
    console.log('✅ Test 3 Passed: Order tracking by reference verified.');

    // Register admin user to obtain token for authorization test
    const adminRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      }),
    });
    const adminRegData = await adminRegRes.json();
    const adminAccessToken = adminRegData.data.accessToken;

    // -------------------------------------------------------------
    // Test 4: Live tracking Socket.IO event trigger
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Real-time status update & Socket.IO ---');
    const socket = clientIo(`http://localhost:${TEST_PORT}`);

    // Join order tracking room
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        console.log('🔌 Socket client connected to test server.');
        socket.emit('join_order', { orderRef });
        resolve();
      });
    });

    // Listen to real-time status update
    const socketEventPromise = new Promise<any>((resolve) => {
      socket.on('order:updated', (data) => {
        console.log('📡 WebSocket received order:updated event:', data);
        resolve(data);
      });
    });

    // Trigger status update from Admin API
    const updateRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`,
      },
      body: JSON.stringify({
        status: 'preparing',
        riderName: 'Marco',
        estimatedMinutes: 25,
      }),
    });
    console.log(`PATCH /orders/${orderId}/status: ${updateRes.status}`);

    const socketData = await socketEventPromise;
    if (socketData.status !== 'preparing' || socketData.riderName !== 'Marco') {
      throw new Error('Socket update data mismatch');
    }
    socket.disconnect();
    console.log('✅ Test 4 Passed: Real-time update via WebSockets verified.');

    // -------------------------------------------------------------
    // Test 5: Table Reservations
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Table Reservation Booking ---');
    const resRes = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ahmed Al-Farsi',
        email: 'ahmed@example.com',
        phone: '99119100',
        date: '2026-08-10',
        time: '7:00 PM',
        guests: '4',
        seating: 'outdoor',
        occasion: 'Anniversary',
        notes: 'Terace window seat preferred',
      }),
    });

    const resData = await resRes.json();
    console.log(`POST /reservations status: ${resRes.status}`);
    console.log('Reservation Response:', JSON.stringify(resData, null, 2));

    if (resRes.status !== 201) throw new Error('Reservation placement failed');
    const resRef = resData.data.reservation.ref;
    if (!resRef.startsWith('RES-')) throw new Error('Reservation reference should start with RES-');

    // Retrieve reservation details
    const getRes = await fetch(`${BASE_URL}/reservations/${resRef}`);
    const getResData = await getRes.json();
    console.log(`GET /reservations/${resRef} status: ${getRes.status}`);
    if (getRes.status !== 200 || getResData.data.reservation.name !== 'Ahmed Al-Farsi') {
      throw new Error('Failed to retrieve reservation detail');
    }
    console.log('✅ Test 5 Passed: Reservation booking lifecycle verified.');

    console.log('\n🎉 ALL CORE LIFECYCLE TESTS PASSED SUCCESSFULLY! 🎉');
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
