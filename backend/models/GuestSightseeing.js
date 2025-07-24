const mongoose = require('mongoose');

const guestSightseeingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a sightseeing name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Please add a country'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  priceCurrency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
    enum: {
      values: ['USD'],
      message: 'Only USD currency is supported'
    }
  },
  offerPrice: {
    type: Number,
    min: [0, 'Offer price cannot be negative'],
    default: null,
    validate: {
      validator: function(value) {
        // Only validate if both price and offerPrice are numbers
        if (value === null || value === undefined) return true;
        if (typeof value !== 'number' || isNaN(value) || typeof this.price !== 'number' || isNaN(this.price)) {
          return true; // Let other validators handle type validation
        }
        return value <= this.price;
      },
      message: 'Offer price cannot be greater than regular price'
    }
  },
  offerPriceCurrency: {
    type: String,
    default: 'USD',
    uppercase: true,
    enum: {
      values: ['USD'],
      message: 'Only USD currency is supported'
    },
    trim: true,
    validate: {
      validator: function(value) {
        // If there's an offer price, currency is required
        if (this.offerPrice !== null && this.offerPrice !== undefined) {
          return !!value;
        }
        return true;
      },
      message: 'Currency is required when offer price is specified'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String,
    trim: true
  }],
  duration: {
    type: String,
    trim: true,
    default: 'Not specified',
    set: function(val) {
      return val || 'Not specified';
    }
  },
  inclusions: {
    type: [String],
    default: ['No inclusions specified'],
    set: function(val) {
      if (Array.isArray(val) && val.length > 0) {
        return val;
      }
      return ['No inclusions specified'];
    }
  },
  keywords: {
    type: [String],
    default: []
  },
  aboutTour: {
    type: String,
    default: 'No detailed description available.'
  },
  highlights: {
    type: [String],
    default: ['No highlights available']
  },
  meetingPoint: {
    type: String,
    default: 'To be advised upon booking'
  },
  whatToBring: {
    type: [String],
    default: ['Comfortable walking shoes', 'camera', 'weather-appropriate clothing']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create text index for search
// guestSightseeingSchema.index({ name: 'text', description: 'text', country: 'text' });

// Create model with explicit collection name
const GuestSightseeing = mongoose.model('GuestSightseeing', guestSightseeingSchema, 'guestsightseeings');

module.exports = GuestSightseeing;
