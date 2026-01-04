const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  accessLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessLog',
    required: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-delete after 10 minutes (TTL index)
  }
});

// Index for automatic cleanup
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
