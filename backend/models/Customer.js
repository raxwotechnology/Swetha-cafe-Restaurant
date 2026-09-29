// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    trim: true
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
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Customer', customerSchema);