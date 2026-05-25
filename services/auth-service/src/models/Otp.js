const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 50 // Automatically delete document after 50 seconds
  }
});

// Index to ensure only one active OTP per phone
otpSchema.index({ phone: 1, isUsed: 1 });

module.exports = mongoose.model('Otp', otpSchema);
