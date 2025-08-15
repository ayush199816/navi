const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a package name'],
      trim: true,
      maxlength: [100, 'Package name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    destination: {
      type: String,
      required: [true, 'Please add a destination'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Please add duration in days'],
      min: [1, 'Duration must be at least 1 day'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    agentPrice: {
      type: Number,
      required: [true, 'Please add an agent price'],
      min: [0, 'Agent price cannot be negative'],
    },
    offerPrice: {
      type: Number,
      min: [0, 'Offer price cannot be negative'],
    },
    endDate: {
      type: Date,
    },
    inclusions: [String],
    exclusions: [String],
    itinerary: [
      {
        day: {
          type: Number,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        activities: [String],
        meals: {
          breakfast: {
            type: Boolean,
            default: false,
          },
          lunch: {
            type: Boolean,
            default: false,
          },
          dinner: {
            type: Boolean,
            default: false,
          },
        },
        accommodation: {
          type: String,
        },
      },
    ],
    images: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Package', PackageSchema);
