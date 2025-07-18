const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  clerkUserId: {
    type: String, 
    required: false, 
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['expense', 'income', 'both'],
    default: 'expense'
  },
  icon: { 
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

categorySchema.index(
  { name: 1, clerkUserId: 1 },
  { unique: true, partialFilterExpression: { clerkUserId: { $exists: true } } }
);
categorySchema.index(
  { name: 1, clerkUserId: 1 },
  { unique: true, partialFilterExpression: { clerkUserId: null } }
);

categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', categorySchema);
