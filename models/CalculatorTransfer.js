const mongoose = require('mongoose');

const CalculatorTransferSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a transfer name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    transferType: {
      type: String,
      enum: ['SIC', 'PVT', 'SHARED', 'PRIVATE'],
      default: 'SIC',
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'van', 'bus', 'coach', 'other'],
      default: 'sedan',
    },
    fromLocation: {
      type: String,
      required: [true, 'From location is required'],
      trim: true,
      maxlength: [100, 'From location cannot be more than 100 characters'],
    },
    toLocation: {
      type: String,
      required: [true, 'To location is required'],
      trim: true,
      maxlength: [100, 'To location cannot be more than 100 characters'],
    },
    distance: {
      type: Number, // in kilometers
      min: [0, 'Distance cannot be negative'],
    },
    duration: {
      type: Number, // in minutes
      min: [0, 'Duration cannot be negative'],
    },
    price: {
      type: Number,
      required: [true, 'Transfer price is required'],
      min: [0, 'Transfer price cannot be negative'],
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'SGD', 'AED', 'IDR', 'THB', 'VND', 'EUR', 'MYR', 'USD'],
      trim: true,
    },
    maxPassengers: {
      type: Number,
      min: [1, 'Max passengers must be at least 1'],
      default: 4,
    },
    includes: {
      type: [String],
      default: [],
    },
    excludes: {
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

module.exports = mongoose.model('CalculatorTransfer', CalculatorTransferSchema);
