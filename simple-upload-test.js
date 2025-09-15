const fs = require('fs');
const https = require('https');
const path = require('path');
const jwt = require('jsonwebtoken');

// Generate token
const token = jwt.sign(
  { id: 'test-user', role: 'admin' },
  'your_jwt_secret_key_here'
);

// Read the test image
const imagePath = path.join(__dirname, 'test-image.jpg');
const imageData = fs.readFileSync(imagePath);

// Create form data
const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
let data = '';

// Add image to form data
data += `--${boundary}\r\n`;
data += 'Content-Disposition: form-data; name="images"; ';
data += `filename="test-image.jpg"\r\n`;
data += 'Content-Type: image/jpeg\r\n\r\n';
const payload = Buffer.concat([
  Buffer.from(data, 'utf8'),
  imageData,
  Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
]);

// Set up request options
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/guest-sightseeing/upload',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': payload.length
  }
};

// Make the request
console.log('Sending request to upload endpoint...');
const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonResponse = JSON.parse(responseData);
      console.log('✅ Upload successful!');
      console.log('Response:', JSON.stringify(jsonResponse, null, 2));
      
      if (jsonResponse.data && jsonResponse.data.length > 0) {
        console.log('\n📸 Image URL for frontend testing:');
        console.log(jsonResponse.data[0].url);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

// Write data to request body
req.write(payload);
req.end();
