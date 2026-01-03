const mongoose = require('mongoose');

const CalculatorSightseeingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a sightseeing name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot be more than 100 characters'],
    },
    duration: {
      type: Number, // in minutes
      min: [0, 'Duration cannot be negative'],
    },
    adultPrice: {
      type: Number,
      required: [true, 'Adult price is required'],
      min: [0, 'Adult price cannot be negative'],
      default: 0,
    },
    childPrice: {
      type: Number,
      required: [true, 'Child price is required'],
      min: [0, 'Child price cannot be negative'],
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'SGD', 'AED', 'IDR', 'THB', 'VND', 'EUR', 'MYR', 'USD'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['adventure', 'cultural', 'religious', 'nature', 'entertainment', 'shopping', 'dining', 'other'],
      default: 'other',
    },
    inclusions: {
      type: [String],
      default: [],
    },
    exclusions: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot be more than 1000 characters'],
    },
    picture: {
      type: String,
      trim: true,
    },
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

module.exports = mongoose.model('CalculatorSightseeing', CalculatorSightseeingSchema);
