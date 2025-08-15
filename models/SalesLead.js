const mongoose = require('mongoose');

const SalesLeadSchema = new mongoose.Schema({
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastContacted: Date,
  nextFollowUp: Date,
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  value: Number,
  source: {
    type: String,
    enum: ['website', 'agent', 'referral', 'other'],
    default: 'agent'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Populate quote and assignedTo by default
SalesLeadSchema.pre('find', function() {
  this.populate('quote', 'quoteId customerName customerEmail customerPhone destination totalAmount status');
  this.populate('assignedTo', 'name email');
  this.populate('createdBy', 'name email');
  this.populate('updatedBy', 'name email');
  this.populate('notes.createdBy', 'name email');
});

module.exports = mongoose.model('SalesLead', SalesLeadSchema);
