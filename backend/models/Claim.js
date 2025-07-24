const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true
    },
    rateOfExchange: {
      type: Number,
      required: true,
      default: 1
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    claimedAmount: {
      type: Number,
      required: true
    },
    leadPaxName: {
      type: String,
      required: true
    },
    travelDate: {
      type: Date,
      required: true
    },
    claimDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Generate a unique transaction ID before saving
ClaimSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionId) {
    const date = new Date();
    const prefix = 'CLM';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const timestamp = date.getTime().toString().slice(-6);
    this.transactionId = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Calculate claimed amount before saving
ClaimSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('rateOfExchange')) {
    this.claimedAmount = this.amount * this.rateOfExchange;
  }
  next();
});

module.exports = mongoose.model('Claim', ClaimSchema);
