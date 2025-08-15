const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: {
      type: String,
      required: [true, 'Please add a customer name'],
      trim: true,
    },
    customerEmail: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    customerPhone: {
      type: String,
      required: [true, 'Please add a customer phone'],
      trim: true,
    },
    destination: {
      type: String,
      trim: true,
    },
    travelDates: {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },
    budget: {
      type: Number,
    },
    numberOfTravelers: {
      adults: {
        type: Number,
        default: 0,
      },
      children: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'new',
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'social_media', 'direct', 'other'],
      default: 'other',
    },
    notes: [
      {
        content: {
          type: String,
          required: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastContactDate: {
      type: Date,
    },
    nextFollowUpDate: {
      type: Date,
    },
    quoteSent: {
      type: Boolean,
      default: false,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },
    bookingConverted: {
      type: Boolean,
      default: false,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lead', LeadSchema);
