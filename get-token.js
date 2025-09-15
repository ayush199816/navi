const axios = require('axios');

const loginData = {
  email: "admin@navigatio.com",
  password: "Agent@123!"
};

console.log('Logging in to get a fresh token...');

axios.post('http://localhost:5000/api/auth/login', loginData, {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Login successful!');
  console.log('Token:', response.data.token);
  console.log('User:', JSON.stringify(response.data.data, null, 2));
})
.catch(error => {
  console.error('Login failed:', error.response?.data || error.message);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Headers:', error.response.headers);
  }
});
