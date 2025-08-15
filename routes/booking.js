const express = require('express');
const router = express.Router();
const {
  getBookings,
  getMyBookings,
  getBooking,
  createBooking,
  updateBooking,
  updateBookingStatus,
  generateInvoice,
  cancelBooking,
  claimPayment,
  getGuestBookings
} = require('../controllers/bookingController');
const { protect, authorize, isApprovedAgent } = require('../middleware/auth');

// Protected routes
router.use(protect);

// Special routes for my-bookings - must be defined before the :id route
// This ensures these routes are not treated as ID parameters
router.get('/my-bookings', authorize('agent'), isApprovedAgent, getMyBookings);
router.get('/guest/my-bookings', authorize('user'), getGuestBookings);

// Routes for all authenticated users
router.post('/', authorize('agent'), isApprovedAgent, createBooking);
router.post('/custom', authorize('agent'), isApprovedAgent, createBooking); // For custom itineraries

// Routes for operations team and admin
router.get('/', authorize('admin', 'operations'), getBookings);

// Routes with ID parameter - these must come after all specific routes
router.get('/:id', getBooking);
router.put('/:id', authorize('agent', 'admin', 'operations'), updateBooking);
router.put('/:id/cancel', authorize('agent'), isApprovedAgent, cancelBooking);
router.put('/:id/status', authorize('admin', 'operations'), updateBookingStatus);
router.put('/:id/invoice', authorize('agent', 'admin', 'operations'), generateInvoice);
router.post('/:id/claim-payment', authorize('admin', 'operations'), claimPayment);

module.exports = router;
