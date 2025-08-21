const mongoose = require('mongoose');

const guestSightseeingBookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    unique: true,
    trim: true,
    default: function() {
      return `GSB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  },
  sightseeing: {
    type: mongoose.Schema.ObjectId,
    ref: 'GuestSightseeing',
    required: [true, 'Please select a sightseeing tour']
  },
  sightseeingName: {
    type: String,
    required: [true, 'Sightseeing name is required']
  },
  dateOfTravel: {
    type: Date,
    required: [true, 'Date of travel is required']
  },
  numberOfPax: {
    type: Number,
    required: [true, 'Number of pax is required'],
    min: [1, 'At least one person is required']
  },
  leadGuest: {
    name: {
      type: String,
      required: [true, 'Lead guest name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    passportNumber: {
      type: String,
      required: [true, 'Passport number is required']
    },
    panNumber: {
      type: String,
      required: [true, 'PAN number is required']
    }
  },
  additionalGuests: [{
    name: {
      type: String,
      required: [true, 'Guest name is required']
    },
    passportNumber: {
      type: String,
      required: [true, 'Passport number is required']
    }
  }],
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  paymentMethod: String,
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate booking reference before saving if not set
guestSightseeingBookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    this.bookingReference = `GSB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

// Add index for better query performance
guestSightseeingBookingSchema.index({ userId: 1, dateOfTravel: 1 });
guestSightseeingBookingSchema.index({ bookingReference: 1 });

module.exports = mongoose.model('GuestSightseeingBooking', guestSightseeingBookingSchema);
