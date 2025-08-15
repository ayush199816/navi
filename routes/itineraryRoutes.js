const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createBookingFromItinerary,
  createQuoteFromItinerary
} = require('../controllers/itineraryController');

const router = express.Router();

// Protect all routes with authentication
router.use(protect);

// Create booking from itinerary
router.post(
  '/book',
  authorize('agent', 'admin'),
  createBookingFromItinerary
);

// Create quote from itinerary
router.post(
  '/quote',
  authorize('agent', 'admin'),
  createQuoteFromItinerary
);

module.exports = router;
