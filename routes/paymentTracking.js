const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentByOrderId,
  getPaymentByBookingId,
  updatePaymentStatus,
  getPayments,
  getPaymentStats
} = require('../controllers/paymentTrackingController');

const { protect, authorize } = require('../middleware/auth');

// Public routes (for payment callbacks)
router.post('/', createPayment);
router.get('/order/:orderId', getPaymentByOrderId);
router.get('/booking/:bookingId', getPaymentByBookingId);
router.put('/:id/status', updatePaymentStatus);

// Admin routes
router.use(protect);
router.use(authorize('admin', 'operations'));

router.get('/', getPayments);
router.get('/stats', getPaymentStats);

module.exports = router;
