const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.ObjectId,
    ref: 'GuestSightseeingBooking',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cashfree', 'card', 'upi', 'netbanking', 'wallet'],
    default: 'cashfree'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  originalUSDAmount: {
    type: Number,
    required: false
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  cashfreeResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date
  },
  failureReason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient lookups
PaymentSchema.index({ bookingId: 1 });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ paymentStatus: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
