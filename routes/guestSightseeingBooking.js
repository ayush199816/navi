const express = require('express');
const router = express.Router();
const {
  createGuestSightseeingBooking,
  getMyBookings,
  getBooking,
  updateBookingStatus,
  deleteBooking,
  getBookings,
  updateBookingStatusAdminOperations,
  updateBookingPaymentStatus
} = require('../controllers/guestSightseeingBookingController');

const { protect,authorize,auth } = require('../middleware/auth');  // Make sure this is the correct path to your auth middleware

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

// Admin and Operations routes
router.use(authorize('admin', 'operations'));

// Get all bookings (admin only)
router.get(
  '/',
  (req, res, next) => {
    // Skip advancedResults middleware and go straight to controller
    return getBookings(req, res, next);
  }
);


// ... other routes

// Update payment status after successful payment (public for payment callbacks)
router.put(
  '/:id/payment-success',
  // No authentication required - payment verification is handled in controller
  updateBookingPaymentStatus
);

// Update booking status (admin only)
router.put('/:id/status', updateBookingStatus);

module.exports = router;
