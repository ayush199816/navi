const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema(
  {
    quoteId: {
      type: String,
      unique: true,
    },
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
      required: [true, 'Please add a customer email'],
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // More permissive email validation
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
      required: [true, 'Please add a destination'],
      trim: true,
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
    numberOfTravelers: {
      adults: {
        type: Number,
        required: [true, 'Please add number of adults'],
        min: [1, 'At least one adult is required'],
      },
      children: {
        type: Number,
        default: 0,
      },
    },
    budget: {
      type: Number,
      required: [true, 'Please add a budget'],
    },
    requirements: {
      type: String,
      trim: true,
    },
    hotelRequired: {
      type: Boolean,
      default: false,
    },
    flightBooked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'quoted', 'accepted', 'rejected', 'expired', 'responded'],
      default: 'pending',
    },
    salesStatus: {
      type: String,
      enum: [null, 'converted_to_lead', 'in_progress', 'won', 'lost'],
      default: null,
    },
    quotedPrice: {
      type: Number,
      default: 0,
    },
    quotedDetails: {
      type: String,
      trim: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiryDate: {
      type: Date,
    },
    response: {
      type: String,
      trim: true
    },
    itinerary: {
      type: String,
      trim: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    },
    discussion: [
      {
        message: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        user: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['response', 'price_update', 'status_change', 'system', 'agent'],
          default: 'system'
        }
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Generate unique quote ID before saving
QuoteSchema.pre('save', async function (next) {
  if (!this.quoteId) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.quoteId = `Q${year}${month}-${random}`;
  }
  
  // Only proceed with lead creation if the document is new or status is being updated
  if (this.isNew || this.isModified('status')) {
    // If this is a new quote or status is being set to a value that should create a lead
    const shouldCreateLead = this.isNew || ['pending', 'processing', 'quoted', 'accepted'].includes(this.status);
    
    if (shouldCreateLead && this.agent) {
      try {
        const SalesLead = require('./SalesLead');
        const User = require('./User');
        
        // Check if a lead already exists for this quote
        const existingLead = await SalesLead.findOne({ quote: this._id });
        
        if (!existingLead) {
          // Get the first available sales user or admin to assign the lead to
          const assignee = await User.findOne({
            role: { $in: ['admin', 'sales'] },
            isActive: true
          }).sort({ createdAt: 1 });
          
          if (assignee) {
            await SalesLead.create({
              quote: this._id,
              assignedTo: assignee._id,
              createdBy: this.agent, // Original agent who created the quote
              value: this.quotedPrice || 0,
              source: 'agent',
              status: 'new',
              notes: [{
                content: `Automatically created from quote (Status: ${this.status})`,
                createdBy: this.agent
              }]
            });
            
            // Update the sales status to indicate it's been converted to a lead
            this.salesStatus = 'converted_to_lead';
            console.log(`Created new sales lead for quote ${this.quoteId}`);
          }
        }
      } catch (error) {
        console.error('Error creating sales lead:', error);
        // Don't fail the save operation if lead creation fails
      }
    }
  }
  
  next();
});

module.exports = mongoose.model('Quote', QuoteSchema);
