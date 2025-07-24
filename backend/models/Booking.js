const mongoose = require('mongoose');

// Define traveler details schema for the old structure
const TravelerDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  age: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false,
    default: 'other'
  },
  idType: {
    type: String,
    enum: ['passport', 'aadhar', 'driving_license', 'voter_id', 'other'],
    required: false
  },
  idNumber: {
    type: String,
    required: false
  }
}, { _id: false });

// Define travelers schema to support multiple formats
const TravelersSchema = new mongoose.Schema({
  // New structure (simple count)
  adults: {
    type: Number,
    default: 1,
    min: 0
  },
  children: {
    type: Number,
    default: 0,
    min: 0
  },
  infants: {
    type: Number,
    default: 0,
    min: 0
  },
  // Detailed travelers
  details: {
    type: [TravelerDetailsSchema],
    default: undefined
  }
}, { _id: false });

const BookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    customItinerary: {
      title: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      items: [
        {
          name: String,
          description: String,
          duration: String,
          location: String,
          price: Number,
          type: {
            type: String,
            enum: ['sightseeing', 'hotel', 'transport', 'activity', 'other'],
            default: 'sightseeing',
          },
          date: Date,
        },
      ],
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      // Making package optional when booking is created from a quote or custom itinerary
      required: function() { return !this.isCustom; },
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },
    destination: {
      type: String,
      trim: true,
    },
    customerDetails: {
      name: {
        type: String,
        required: [true, 'Please add a customer name'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Please add a customer email'],
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email',
        ],
      },
      phone: {
        type: String,
        required: [true, 'Please add a customer phone'],
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
    },
    travelDates: {
      startDate: {
        type: Date,
        required: [true, 'Please add a start date'],
      },
      endDate: {
        type: Date,
        required: [true, 'Please add an end date'],
      },
    },
    // Travelers information with support for both old and new formats
    travelers: TravelersSchema,
    pricing: {
      packagePrice: {
        type: Number,
        required: function() { return !this.isCustom && this.bookingType !== 'custom'; },
        default: 0
      },
      agentPrice: {
        type: Number,
        required: function() { return !this.isCustom && this.bookingType !== 'custom'; },
        default: 0
      },
      totalAmount: {
        type: Number,
        required: [true, 'Please add total amount'],
        default: 0
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    // Legacy fields for backward compatibility
    totalAmount: {
      type: Number,
      required: false,
    },
    agentCommission: {
      type: Number,
      required: false,
    },
    // Legacy payment status field - no longer used
    // Replaced by the paymentStatus field below
    paymentDetails: [
      {
        amount: {
          type: Number,
          required: true,
        },
        method: {
          type: String,
          enum: ['wallet', 'bank_transfer', 'credit_card', 'other'],
          required: true,
        },
        transactionId: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'completed', 'failed'],
          default: 'pending',
        },
      },
    ],
    bookingType: {
      type: String,
      enum: ['package', 'custom'],
      default: 'package',
      required: true
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled', 'completed', 'processing', 'booked'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'partially_paid', 'paid', 'refunded', 'failed', 'unpaid'],
      default: 'unpaid',
    },
    paymentClaimed: {
      type: Boolean,
      default: false,
    },
    paymentClaimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paymentClaimedAt: {
      type: Date,
    },
    specialRequirements: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Suppliers for this booking
    suppliers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    }],

    // Legacy single seller field - kept for backward compatibility
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
    },
    sellerAssignedAt: {
      type: Date,
    },
    // New field for multiple sellers
    sellers: [{
      seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
      },
      assignedAt: {
        type: Date,
        default: Date.now
      },
      services: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      }
    }],
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
    invoiceNumber: {
      type: String,
    },
    finalItinerary: {
      type: String,
      trim: true,
    },
    hotelDetails: [{
      name: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      checkIn: {
        type: Date,
      },
      checkOut: {
        type: Date,
      },
      roomType: {
        type: String,
        trim: true,
      },
      confirmationNumber: {
        type: String,
        trim: true,
      },
    }],
    flightDetails: [{
      airline: {
        type: String,
        trim: true,
      },
      flightNumber: {
        type: String,
        trim: true,
      },
      departureCity: {
        type: String,
        trim: true,
      },
      arrivalCity: {
        type: String,
        trim: true,
      },
      departureTime: {
        type: Date,
      },
      arrivalTime: {
        type: Date,
      },
      pnr: {
        type: String,
        trim: true,
      },
      class: {
        type: String,
        trim: true,
      },
    }],
    activities: [{
      sightseeingName: {
        type: String,
        trim: true,
        required: [true, 'Please add a sightseeing name'],
      },
      date: {
        type: Date,
        required: [true, 'Please add a date for the activity'],
      },
      pickupTime: {
        type: String,
      },
      dropTime: {
        type: String,
      },
      pickupLocation: {
        type: String,
        trim: true,
      },
      dropLocation: {
        type: String,
        trim: true,
      },
      isSameAsPickup: {
        type: Boolean,
        default: false,
      },
      isConnectingActivity: {
        type: Boolean,
        default: false,
      },
      nextActivityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
      },
      notes: {
        type: String,
        trim: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Generate unique booking ID before saving
BookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingId = `B${year}${month}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
