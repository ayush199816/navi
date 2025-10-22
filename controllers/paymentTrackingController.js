const Payment = require('../models/Payment');
const GuestSightseeingBooking = require('../models/GuestSightseeingBooking');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a new payment record
// @route   POST /api/payments
// @access  Public
exports.createPayment = asyncHandler(async (req, res, next) => {
  const { bookingId, orderId, amount, currency, paymentMethod, paymentDetails, originalUSDAmount } = req.body;

  // Validate required fields
  if (!bookingId || !orderId || !amount) {
    return next(new ErrorResponse('Booking ID, Order ID, and amount are required', 400));
  }

  // Check if booking exists
  const booking = await GuestSightseeingBooking.findById(bookingId);
  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id ${bookingId}`, 404));
  }

  // Check if orderId already exists
  const existingPayment = await Payment.findOne({ orderId });
  if (existingPayment) {
    return next(new ErrorResponse(`Payment record already exists for order ${orderId}`, 409));
  }

  // Create payment record
  const payment = await Payment.create({
    bookingId,
    orderId,
    amount,
    currency: currency || 'INR',
    paymentMethod: paymentMethod || 'cashfree',
    paymentDetails: paymentDetails || {},
    originalUSDAmount: originalUSDAmount || null,
    paymentStatus: 'pending'
  });

  res.status(201).json({
    success: true,
    data: payment
  });
});

// @desc    Get payment by order ID
// @route   GET /api/payments/order/:orderId
// @access  Public
exports.getPaymentByOrderId = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findOne({ orderId: req.params.orderId })
    .populate('bookingId', 'sightseeingName dateOfTravel totalAmount');

  if (!payment) {
    return next(new ErrorResponse(`Payment not found for order ${req.params.orderId}`, 404));
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Get payment by booking ID
// @route   GET /api/payments/booking/:bookingId
// @access  Public
exports.getPaymentByBookingId = asyncHandler(async (req, res, next) => {
  const payments = await Payment.find({ bookingId: req.params.bookingId })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});

// @desc    Update payment status
// @route   PUT /api/payments/:id/status
// @access  Public
exports.updatePaymentStatus = asyncHandler(async (req, res, next) => {
  const { paymentStatus, paymentDetails, cashfreeResponse, verified, failureReason } = req.body;

  if (!paymentStatus) {
    return next(new ErrorResponse('Payment status is required', 400));
  }

  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    {
      paymentStatus,
      paymentDetails: paymentDetails || {},
      cashfreeResponse: cashfreeResponse || {},
      verified: verified || false,
      verificationDate: verified ? new Date() : undefined,
      failureReason: failureReason || undefined
    },
    { new: true, runValidators: true }
  ).populate('bookingId', 'sightseeingName dateOfTravel totalAmount');

  if (!payment) {
    return next(new ErrorResponse(`Payment not found with id ${req.params.id}`, 404));
  }

  // Sync payment status to GuestSightseeingBooking collection
  try {
    let bookingStatus = 'pending';
    let bookingPaymentStatus = 'pending';

    switch (paymentStatus) {
      case 'paid':
        bookingStatus = 'confirmed';
        bookingPaymentStatus = 'paid';
        break;
      case 'failed':
        bookingStatus = 'cancelled';
        bookingPaymentStatus = 'failed';
        break;
      case 'cancelled':
        bookingStatus = 'cancelled';
        bookingPaymentStatus = 'cancelled';
        break;
      case 'refunded':
        bookingStatus = 'refunded';
        bookingPaymentStatus = 'refunded';
        break;
      default:
        bookingStatus = 'pending';
        bookingPaymentStatus = 'pending';
    }

    // Update the corresponding booking
    await GuestSightseeingBooking.findByIdAndUpdate(
      payment.bookingId,
      {
        $set: {
          paymentStatus: bookingPaymentStatus,
          status: bookingStatus,
          // Update payment details if provided
          ...(paymentDetails && {
            'payment.paymentDetails': paymentDetails,
            'payment.status': paymentStatus.toUpperCase(),
            'payment.verified': verified || false,
            'payment.verificationDate': verified ? new Date() : undefined,
            'payment.amount': payment.amount,
            'payment.currency': payment.currency
          }),
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Synced payment status to booking ${payment.bookingId}: ${bookingPaymentStatus}`);
  } catch (bookingUpdateError) {
    console.error('❌ Error syncing payment status to booking:', bookingUpdateError);
    // Don't fail the request if booking update fails - payment record is still updated
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// @desc    Get all payments (admin)
// @route   GET /api/payments
// @access  Private/Admin
exports.getPayments = asyncHandler(async (req, res, next) => {
  // Build query
  let query = {};

  // Filter by payment status if provided
  if (req.query.status) {
    query.paymentStatus = req.query.status;
  }

  // Filter by date range if provided
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) {
      query.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  const payments = await Payment.find(query)
    .populate('bookingId', 'sightseeingName dateOfTravel totalAmount')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments
  });
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private/Admin
exports.getPaymentStats = asyncHandler(async (req, res, next) => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const totalPayments = await Payment.countDocuments();
  const totalAmount = await Payment.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      statusBreakdown: stats,
      totalPayments,
      totalAmount: totalAmount[0]?.total || 0
    }
  });
});
