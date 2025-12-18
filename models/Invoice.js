const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      unique: true,
    },
    quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      // Made optional
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
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please add a valid email',
      ],
    },
    customerPhone: {
      type: String,
      required: [true, 'Please add a customer phone'],
      trim: true,
    },
    customerAddress: {
      type: String,
      trim: true,
    },
    customerGstin: {
      type: String,
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
    numberOfTravelers: {
      adults: {
        type: Number,
        default: 1,
        min: [0, 'Number of adults cannot be negative'],
      },
      children: {
        type: Number,
        default: 0,
        min: [0, 'Number of children cannot be negative'],
      },
    },
    items: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        unitPrice: {
          type: Number,
          required: true,
          min: [0, 'Unit price cannot be negative'],
        },
        total: {
          type: Number,
          required: true,
          min: [0, 'Total cannot be negative'],
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
    },
    // totalAmount is an alias for total, handled in pre-save hook
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP'],
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'pending'],
      default: 'draft',
    },
    dueDate: {
      type: Date,
      required: [true, 'Please add a due date'],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    paidDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'upi', 'other'],
    },
    paymentDetails: {
      transactionId: String,
      bankReference: String,
      notes: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    terms: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sentAt: {
      type: Date,
    },
    remindedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique invoice ID before saving
InvoiceSchema.pre('save', async function (next) {
  if (!this.invoiceId) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.invoiceId = `INV${year}${month}-${random}`;
  }
  
  // Calculate totals if items are provided
  if (this.isModified('items') && this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.totalAmount = this.subtotal + this.tax;
  }
  
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
