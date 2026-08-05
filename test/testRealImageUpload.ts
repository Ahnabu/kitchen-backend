process.env.NODE_ENV = 'test';
import app from '../src/app';
import { sequelize, GalleryImage } from '../src/models';
import http from 'http';
import fs from 'fs';
import path from 'path';

const TEST_PORT = 3011;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

async function runTests() {
  console.log('🔄 Starting Integration Tests for Real Image Upload Verification...');

  const sourceImagePath = path.join(__dirname, '../uploads/image.png');
  
  // 1. Verify source image exists
  if (!fs.existsSync(sourceImagePath)) {
    console.error(`❌ Source image not found at ${sourceImagePath}. Please make sure backend/uploads/image.png exists.`);
    process.exit(1);
  }
  const sourceStats = fs.statSync(sourceImagePath);
  console.log(`✅ Found source image. Size: ${sourceStats.size} bytes.`);

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
    // Test 1: Upload Real Image
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Upload Real Image from Disk ---');
    
    // Read source image file into buffer and wrap in Blob
    const fileBuffer = fs.readFileSync(sourceImagePath);
    const imageBlob = new Blob([fileBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('alt', 'Uploaded Verification Image');
    formData.append('category', 'Smokehouse');
    formData.append('sortOrder', '10');

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
    
    if (addRes.status !== 201) throw new Error('Failed to upload real gallery image');
    
    const imageUrl = addData.data.image.src; // e.g. "/uploads/gallery/image-1785939312708.png"
    const imageId = addData.data.image.id;

    // -------------------------------------------------------------
    // Test 2: Verify File and Database Alignment
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Verify File on Disk and Database alignment ---');
    
    // Check Database record
    const dbRecord = await GalleryImage.findByPk(imageId);
    if (!dbRecord) throw new Error('GalleryImage record not found in Database');
    console.log('✅ Database Record exists.');
    if (dbRecord.src !== imageUrl) throw new Error('Database path mismatch with response');

    // Check physical file on disk
    const physicalPath = path.join(__dirname, '..', imageUrl);
    console.log(`Checking physical file existence at: ${physicalPath}`);
    if (!fs.existsSync(physicalPath)) {
      throw new Error(`Physical file does not exist on disk at path: ${physicalPath}`);
    }
    console.log('✅ Physical file exists on disk.');

    // Verify uploaded file size matches original file size
    const uploadedStats = fs.statSync(physicalPath);
    console.log(`Original Size: ${sourceStats.size} bytes | Uploaded Size: ${uploadedStats.size} bytes`);
    if (uploadedStats.size !== sourceStats.size) {
      throw new Error('Uploaded file size mismatch with original source image');
    }
    console.log('✅ Uploaded file size is identical to original source image.');

    // -------------------------------------------------------------
    // Test 3: Public List Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Public List Verification ---');
    const getRes = await fetch(`${BASE_URL}/gallery`);
    const getData = await getRes.json();
    console.log(`GET /gallery status: ${getRes.status}`);
    if (getRes.status !== 200) throw new Error('Failed to fetch public gallery');
    const found = getData.data.images.find((img: any) => img.id === imageId);
    if (!found) throw new Error('Uploaded image was not returned in the public gallery list');
    console.log('✅ Uploaded image successfully returned in the public gallery list.');

    // -------------------------------------------------------------
    // Test 4: Delete & Clean-up Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Delete and Clean-up Verification ---');
    const deleteRes = await fetch(`${BASE_URL}/gallery/${imageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    console.log(`DELETE /gallery/${imageId} status: ${deleteRes.status}`);
    if (deleteRes.status !== 200) throw new Error('Failed to delete gallery image');

    // Check DB record destroyed
    const checkDb = await GalleryImage.findByPk(imageId);
    if (checkDb !== null) throw new Error('Database record still exists after deletion');
    console.log('✅ Database record successfully destroyed.');

    // Check physical file deleted
    if (fs.existsSync(physicalPath)) {
      throw new Error('Physical file still exists on disk after deletion');
    }
    console.log('✅ Physical file successfully unlinked/deleted from disk.');

    console.log('\n🎉 ALL REAL IMAGE UPLOAD SYNC TESTS PASSED SUCCESSFULLY! 🎉');
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
