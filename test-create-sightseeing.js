const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:5000/api/guest-sightseeing';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODlkYjQ5Y2IzZGEyNGYwMzMyOTdiNCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NTU5OTcxNSwiZXhwIjoxNzU2MjA0NTE1fQ.iWo1l0z968utfsVorPU7eJif-shX7AHSv2bmDt7mbTI';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

async function runTest() {
  try {
    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      throw new Error(`Test image not found at: ${TEST_IMAGE_PATH}`);
    }

    // Create form data
    const formData = new FormData();

    // Add text fields
    formData.append('name', 'Test Sightseeing with Cloudinary');
    formData.append('country', 'Test Country');
    formData.append('description', 'This is a test sightseeing with Cloudinary image upload.');
    formData.append('price', '99.99');
    formData.append('priceCurrency', 'USD');
    formData.append('isActive', 'true');
    formData.append('duration', '2 hours');
    formData.append('aboutTour', 'Detailed information about this test tour.');
    formData.append('meetingPoint', 'Hotel lobby');
    formData.append('additionalInfo', 'Additional information about the tour');
    formData.append('cancellationPolicy', 'Free cancellation 24 hours before the tour');
    formData.append('minAge', '12');
    formData.append('maxGroupSize', '15');
    formData.append('instantConfirmation', 'true');
    formData.append('mobileTicket', 'true');
    formData.append('durationHours', '2');
    formData.append('durationMinutes', '0');
    formData.append('isFeatured', 'false');
    formData.append('isPopular', 'false');
    formData.append('isSpecialOffer', 'false');
    formData.append('offerPrice', '79.99');
    formData.append('offerExpiry', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    // Add array fields
    formData.append('inclusions', 'Guided tour,Entrance fees');
    formData.append('exclusions', 'Meals,Transportation');
    formData.append('keywords', 'test,cloudinary,integration');
    formData.append('highlights', 'Test highlight 1,Test highlight 2');
    formData.append('whatToBring', 'Camera,Comfortable shoes');

    // Add image file
    formData.append('images', fs.createReadStream(TEST_IMAGE_PATH), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg',
      knownLength: fs.statSync(TEST_IMAGE_PATH).size
    });

    // Get headers with auth token
    const headers = {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      ...formData.getHeaders()
    };

    console.log('Sending request to create sightseeing with image...');
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Image size:', fs.statSync(TEST_IMAGE_PATH).size, 'bytes');

    // Make the request
    const response = await axios.post(API_URL, formData, {
      headers: {
        ...headers,
        'Content-Length': formData.getLengthSync(),
      },
      maxContentLength: 100 * 1024 * 1024, // 100MB
      maxBodyLength: 100 * 1024 * 1024,    // 100MB
      timeout: 30000 // 30 seconds
    });

    console.log('Success! Response:', JSON.stringify(response.data, null, 2));
    console.log('Check your Cloudinary dashboard for the uploaded image in the navi/guestsightseeing folder');
  } catch (error) {
    console.error('Test failed:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
runTest();
