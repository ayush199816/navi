const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());
app.disable('x-powered-by');

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || false 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
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
  { path: '/api/quotes', route: require('./routes/quote') },
  { path: '/api/leads', route: require('./routes/lead') },
  { path: '/api/bookings', route: require('./routes/booking') },
  { path: '/api/packages', route: require('./routes/package') },
  { path: '/api/itineraries', route: require('./routes/itinerary') },
  { path: '/api/booking-status', route: require('./routes/bookingStatus') },
  { path: '/api/claims', route: require('./routes/claim') },
  { path: '/api/sellers', route: require('./routes/seller') },
  { path: '/api/suppliers', route: require('./routes/supplierRoutes') },
  { path: '/api/sightseeing', route: require('./routes/sightseeingRoutes') },
  { path: '/api/notifications', route: require('./routes/notificationRoutes') },
  { path: '/api/guest-sightseeing', route: require('./routes/guestSightseeing') },
  { path: '/api/guest-sightseeing-test', route: require('./routes/guestSightseeingTest') },
  { path: '/api/sales-leads', route: require('./routes/salesLeads') },
  { path: '/api', route: require('./routes/stats') },
  { path: '/api/wallets', route: require('./routes/wallet') },
  { path: '/api/lms', route: require('./routes/lms') },
  { path: '/api/ai', route: require('./routes/ai') },
  { path: '/api/test', route: require('./routes/test') }
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

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  const staticPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(staticPath));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) return next();
    
    const indexPath = path.join(staticPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error loading the application');
      }
    });
  });
}

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

// Handle SIGTERM (for Heroku, etc.)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
