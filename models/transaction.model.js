// backend/models/transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  
  userId: {
    type: String,
    required: true,
    index: true 
  },
  type: { // income / expense
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  date: {
    type: Date,
    required: true
  },
  merchantName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  source: { 
    type: String,
    required: true,
    default: 'manual'
  },
  originalFileName: { 
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.index({ userId: 1, date: -1 });

transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);