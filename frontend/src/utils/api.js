import axios from 'axios';

// Create an axios instance with the backend API URL
const api = axios.create({
  //baseURL: 'https://navi-1.onrender.com/api', 
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Handle unauthorized error (e.g., redirect to login)
        localStorage.removeItem('token');
        window.location.href = '/login';
      } 
      // Don't redirect for 403 Forbidden errors, let the component handle it
      // Other error statuses will be handled by the component that made the request
    }
    
    return Promise.reject(error);
  }
);

export default api;
