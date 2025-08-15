const mongoose = require('mongoose');

const LmsContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    contentType: {
      type: String,
      enum: ['video', 'document', 'quiz', 'presentation', 'other'],
      required: [true, 'Please specify content type'],
    },
    contentUrl: {
      type: String,
    },
    contentFile: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    category: {
      type: String,
      enum: ['sales', 'operations', 'product', 'destination', 'marketing', 'other'],
      required: [true, 'Please specify a category'],
    },
    targetAudience: {
      type: String,
      enum: ['agent', 'sales', 'all'],
      required: [true, 'Please specify target audience'],
      default: 'all',
    },
    duration: {
      type: Number, // in minutes
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
    quiz: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            text: {
              type: String,
              required: true,
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
          },
        ],
        explanation: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LmsContent', LmsContentSchema);
