const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  registeredLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: ''
    }
  },
  otpEmail: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedUntil: {
    type: Date,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  filesUploaded: {
    type: Number,
    default: 0
  },
  storageUsed: {
    type: Number,
    default: 0 // in bytes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
