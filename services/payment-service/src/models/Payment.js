'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  seekerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
