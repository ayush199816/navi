const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test upload function
async function testUpload() {
  try {
    console.log('Testing Cloudinary upload...');
    
    // Path to a test image (you might need to adjust this)
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    // Check if test image exists
    if (!fs.existsSync(testImagePath)) {
      console.error('Test image not found. Please create a test-image.jpg in the project root.');
      return;
    }

    // Upload the image
    const result = await cloudinary.uploader.upload(testImagePath, {
      folder: 'navi/guestsightseeing',
      transformation: [
        { width: 800, height: 600, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('✅ Upload successful!');
    console.log('Image URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    // Test deletion
    // Uncomment to test deletion after upload
    // await cloudinary.uploader.destroy(result.public_id);
    // console.log('✅ Test image deleted from Cloudinary');
    
  } catch (error) {
    console.error('❌ Error during upload:', error.message);
  }
}

testUpload();
