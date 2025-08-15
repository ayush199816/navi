const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBookingStats,
  getLeadStats,
  getItineraryStats,
  getRecentActivity,
  getQuoteStats
} = require('../controllers/statsController');

// Protected routes
router.use(protect);

// Agent stats endpoints - these match the frontend's expected paths
router.get('/bookings', authorize('agent'), getBookingStats);
router.get('/leads', authorize('agent'), getLeadStats);
router.get('/itineraries', authorize('agent'), getItineraryStats);
router.get('/quotes', authorize('agent'), getQuoteStats);
router.get('/activity/recent', authorize('agent'), getRecentActivity);

// Backward compatibility with old endpoints (can be removed later)
router.get('/bookings/stats', authorize('agent'), getBookingStats);
router.get('/leads/stats', authorize('agent'), getLeadStats);
router.get('/itineraries/stats', authorize('agent'), getItineraryStats);

module.exports = router;
