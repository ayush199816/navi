const mongoose = require('mongoose');

const ItinerarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title for the itinerary'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Please add a destination'],
      trim: true,
    },
    arrivalDate: {
      type: Date,
      required: [true, 'Please add arrival date'],
    },
    departureDate: {
      type: Date,
      required: [true, 'Please add departure date'],
    },
    adults: {
      type: Number,
      required: [true, 'Please specify number of adults'],
      min: [1, 'There must be at least 1 adult'],
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Number of children cannot be negative'],
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hotels: [{
      name: {
        type: String,
        required: [true, 'Please add hotel name'],
      },
      checkIn: {
        type: Date,
        required: [true, 'Please add check-in date'],
      },
      checkOut: {
        type: Date,
        required: [true, 'Please add check-out date'],
      },
      confirmationNumber: String,
    }],
    
    flights: [{
      flightNumber: {
        type: String,
        required: [true, 'Please add flight number'],
      },
      from: {
        type: String,
        required: [true, 'Please add departure location'],
      },
      to: {
        type: String,
        required: [true, 'Please add arrival location'],
      },
      departure: {
        type: Date,
        required: [true, 'Please add departure time'],
      },
      arrival: {
        type: Date,
        required: [true, 'Please add arrival time'],
      },
    }],

    days: [
      {
        date: {
          type: Date,
          required: true,
        },
        activities: [
          {
            name: {
              type: String,
              required: [true, 'Activity name is required'],
            },
            description: String,
            pickupLocation: String,
            dropLocation: String,
            pickupTime: {
              type: String,
              default: '09:00',
            },
            transferType: {
              type: String,
              enum: ['private', 'shared', 'self'],
              default: 'private',
            },
            images: [String],
            notes: String,
          },
        ],
        meals: {
          breakfast: {
            included: {
              type: Boolean,
              default: false,
            },
            recommendation: String,
          },
          lunch: {
            included: {
              type: Boolean,
              default: false,
            },
            recommendation: String,
          },
          dinner: {
            included: {
              type: Boolean,
              default: false,
            },
            recommendation: String,
          },
        },
        accommodation: {
          name: String,
          type: String,
          location: String,
          description: String,
        },
        transportation: {
          type: String,
          details: String,
        },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Itinerary', ItinerarySchema);
