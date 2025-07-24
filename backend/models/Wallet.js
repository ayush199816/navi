const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ['credit', 'debit'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        reference: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wallet', WalletSchema);
