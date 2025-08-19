const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Generate a test JWT token
const token = jwt.sign(
  { id: 'test-user', role: 'admin' },
  'your_jwt_secret_key_here'
);

async function testUpload() {
  try {
    // Create form data
    const form = new FormData();
    form.append('images', fs.createReadStream(path.join(__dirname, 'test-image.jpg')));

    // Make the request
    console.log('Sending request to upload endpoint...');
    const response = await axios.post(
      'http://localhost:5000/api/guest-sightseeing/upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`,
          'Content-Length': form.getLengthSync(),
        },
        maxBodyLength: Infinity,
      }
    );

    console.log('✅ Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Save the image URL for frontend testing
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📸 Image URL for frontend testing:');
      console.log(response.data.data[0].url);
    }
  } catch (error) {
    console.error('❌ Error:');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
  }
}

testUpload();
