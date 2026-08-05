process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, GalleryImage } from '../src/models';
import http from 'http';

const TEST_PORT = 3006;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Gallery Image Management (Step 4.1)...');

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
        name: 'Gallery Admin',
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
    // Test 1: Upload Gallery Image (Admin)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Upload Gallery Image ---');
    const formData = new FormData();
    formData.append(
      'image',
      new Blob(['fake gallery image data'], { type: 'image/png' }),
      'food-plate.png'
    );
    formData.append('alt', 'Delicious Smoked Brisket Plate');
    formData.append('category', 'Smokehouse');
    formData.append('sortOrder', '5');

    const addRes = await fetch(`${BASE_URL}/gallery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });
    const addData = await addRes.json();
    console.log(`POST /gallery status: ${addRes.status}`);
    console.log('Response:', JSON.stringify(addData, null, 2));
    if (addRes.status !== 201) throw new Error('Failed to upload gallery image');
    if (!addData.data.image.src.includes('image-') || !addData.data.image.src.endsWith('.png')) {
      throw new Error('Image URL does not contain correct filename pattern');
    }
    const imageId = addData.data.image.id;

    // -------------------------------------------------------------
    // Test 2: Get Gallery Images (Public)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Get Gallery Images ---');
    const getRes = await fetch(`${BASE_URL}/gallery`);
    const getData = await getRes.json();
    console.log(`GET /gallery status: ${getRes.status}`);
    console.log('Results count:', getData.data.images.length);
    if (getRes.status !== 200) throw new Error('Failed to get gallery images');
    if (getData.data.images.length !== 1) throw new Error('Gallery count mismatch');
    if (getData.data.images[0].alt !== 'Delicious Smoked Brisket Plate') {
      throw new Error('Alt text mismatch');
    }

    // -------------------------------------------------------------
    // Test 3: Update Gallery Image Metadata
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Update Gallery Image Metadata ---');
    const updateRes = await fetch(`${BASE_URL}/gallery/${imageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        alt: 'Delicious BBQ Beef Brisket',
        category: 'Food',
        sortOrder: 1,
        active: true,
      }),
    });
    const updateData = await updateRes.json();
    console.log(`PUT /gallery/${imageId} status: ${updateRes.status}`);
    console.log('Response:', JSON.stringify(updateData, null, 2));
    if (updateRes.status !== 200) throw new Error('Failed to update gallery image metadata');
    if (updateData.data.image.alt !== 'Delicious BBQ Beef Brisket' || updateData.data.image.category !== 'Food') {
      throw new Error('Metadata update mismatch');
    }

    // -------------------------------------------------------------
    // Test 4: Delete Gallery Image
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Delete Gallery Image ---');
    const deleteRes = await fetch(`${BASE_URL}/gallery/${imageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    console.log(`DELETE /gallery/${imageId} status: ${deleteRes.status}`);
    if (deleteRes.status !== 200) throw new Error('Failed to delete gallery image');

    // Double check DB is empty
    const checkRes = await GalleryImage.findByPk(imageId);
    if (checkRes !== null) throw new Error('GalleryImage record should be destroyed in DB');

    console.log('\n🎉 ALL STEP 4.1 GALLERY TESTS PASSED SUCCESSFULLY! 🎉');
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
