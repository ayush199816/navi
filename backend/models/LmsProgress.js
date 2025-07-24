const mongoose = require('mongoose');

const LmsProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LmsContent',
      required: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    progress: {
      type: Number, // percentage
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    quizScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    quizAttempts: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can only have one progress record per content
LmsProgressSchema.index({ user: 1, content: 1 }, { unique: true });

module.exports = mongoose.model('LmsProgress', LmsProgressSchema);
