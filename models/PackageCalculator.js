const mongoose = require('mongoose');

const PackageCalculatorSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: [true, 'Please add a trip ID'],
      trim: true,
      maxlength: [100, 'Trip ID cannot be more than 100 characters'],
    },
    adults: {
      type: Number,
      min: [0, 'Adults cannot be negative'],
      default: 0,
    },
    children: {
      type: Number,
      min: [0, 'Children cannot be negative'],
      default: 0,
    },
    daysCount: {
      type: Number,
      min: [1, 'Days must be at least 1'],
      default: 1,
    },
    travelTriangle: {
      type: Boolean,
      default: false,
    },
    isAgent: {
      type: Boolean,
      default: false,
    },
    adultSightseeings: [{
      sightseeingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CalculatorSightseeing',
        required: true
      },
      day: {
        type: Number,
        min: [1, 'Day must be at least 1'],
        default: 1,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
      },
      adultPrice: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      }
    }],
    childSightseeings: [{
      sightseeingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CalculatorSightseeing',
        required: true
      },
      day: {
        type: Number,
        min: [1, 'Day must be at least 1'],
        default: 1,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
      },
      childPrice: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      }
    }],
    transfers: [{
      transferId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CalculatorTransfer',
        required: true
      },
      day: {
        type: Number,
        min: [1, 'Day must be at least 1'],
        default: 1,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
      },
      transferPrice: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      }
    }],
    hotelPrices: [{
      hotelName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Hotel name cannot be more than 100 characters']
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
      },
      checkIn: {
        type: Date,
        required: true
      },
      checkOut: {
        type: Date,
        required: true
      }
    }],
    totalAdultCost: {
      type: Number,
      min: [0, 'Total cost cannot be negative'],
      default: 0
    },
    totalChildCost: {
      type: Number,
      min: [0, 'Total cost cannot be negative'],
      default: 0
    },
    totalTransferCost: {
      type: Number,
      min: [0, 'Total cost cannot be negative'],
      default: 0
    },
    totalHotelCost: {
      type: Number,
      min: [0, 'Total cost cannot be negative'],
      default: 0
    },
    grandTotal: {
      type: Number,
      min: [0, 'Grand total cannot be negative'],
      default: 0
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'SGD', 'AED', 'IDR', 'THB', 'VND', 'EUR', 'MYR', 'USD'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
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

// Calculate totals before saving
PackageCalculatorSchema.pre('save', function(next) {
  // Calculate adult sightseeing total
  this.totalAdultCost = this.adultSightseeings.reduce((total, item) => {
    return total + (item.adultPrice * item.quantity);
  }, 0);

  // Calculate child sightseeing total
  this.totalChildCost = this.childSightseeings.reduce((total, item) => {
    return total + (item.childPrice * item.quantity);
  }, 0);

  // Calculate transfer total
  this.totalTransferCost = this.transfers.reduce((total, item) => {
    return total + (item.transferPrice * item.quantity);
  }, 0);

  // Calculate hotel total
  this.totalHotelCost = this.hotelPrices.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Calculate grand total
  if (!this.isModified('grandTotal')) {
    this.grandTotal = this.totalAdultCost + this.totalChildCost + this.totalTransferCost + this.totalHotelCost;
  }

  next();
});

module.exports = mongoose.model('PackageCalculator', PackageCalculatorSchema);
