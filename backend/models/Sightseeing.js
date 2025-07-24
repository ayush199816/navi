const mongoose = require('mongoose');

const SightseeingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a sightseeing name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    type: {
      type: String,
      enum: ['transfer', 'activity'],
      default: 'activity',
      required: true
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    transferType: {
      type: String,
      enum: ['SIC', 'PVT'],
      default: 'SIC',
    },
    sellingPrice: {
      type: Number,
      min: [0, 'Selling price cannot be negative'],
      default: 0,
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
      default: 0,
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // in minutes
      min: [0, 'Duration cannot be negative'],
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
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
    picture: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'SGD', 'AED', 'IDR', 'THB', 'VND', 'EUR', 'MYR', 'USD'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sightseeing', SightseeingSchema);
