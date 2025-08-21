const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getBookings,
  getBooking,
  createGuestSightseeingBooking,
  updateBookingStatus,
  deleteBooking,
  getMyBookings
} = require('../controllers/guestSightseeingBookingController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const GuestSightseeingBooking = require('../models/GuestSightseeingBooking');

// Logged-in user routes
router.use(protect);

// User's own bookings
router.get('/my-bookings', getMyBookings);

// Create booking
router.post('/', createGuestSightseeingBooking);

// Get single booking
router.get('/:id', getBooking);

// Delete booking
router.delete('/:id', deleteBooking);

// Admin routes
router.use(authorize('admin'));

// Get all bookings (admin only)
router.get(
  '/',
  (req, res, next) => {
    // Skip advancedResults middleware and go straight to controller
    return getBookings(req, res, next);
  }
);

// Update booking status (admin only)
router.put('/:id/status', updateBookingStatus);

module.exports = router;
