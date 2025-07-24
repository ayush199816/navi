const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Import and use routes
const routes = [
  { path: '/api/v1/itinerary-creator', route: require('./routes/itineraryCreator') },
  { path: '/api/auth', route: require('./routes/auth') },
  { path: '/api/users', route: require('./routes/user') },
  { path: '/api/itineraries', route: require('./routes/itinerary') },
  { path: '/api/packages', route: require('./routes/package') },
  { path: '/api/quotes', route: require('./routes/quote') },
  { path: '/api/bookings', route: require('./routes/booking') },
  { path: '/api/guest-sightseeing', route: require('./routes/guestSightseeing') },
  { path: '/api/guest-sightseeing-test', route: require('./routes/guestSightseeingTest') },
  { path: '/api/sales-leads', route: require('./routes/salesLeads') },
  { path: '/api/leads', route: require('./routes/lead') },
  { path: '/api', route: require('./routes/stats') },
  { path: '/api/wallets', route: require('./routes/wallet') },
  { path: '/api/lms', route: require('./routes/lms') },
  { path: '/api/ai', route: require('./routes/ai') },
  { path: '/api/test', route: require('./routes/test') },
  { path: '/api/booking-status', route: require('./routes/bookingStatus') },
  { path: '/api/claims', route: require('./routes/claim') },
  { path: '/api/sellers', route: require('./routes/seller') },
  { path: '/api/suppliers', route: require('./routes/supplierRoutes') },
  { path: '/api/sightseeing', route: require('./routes/sightseeingRoutes') }
];

// Register routes
routes.forEach(({ path, route }) => {
  app.use(path, route);
  console.log(`Registered route: ${path}`);
});

// Root route
app.get('/', (req, res) => {
  res.send('Navigatio API is running...');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectDB();
});
