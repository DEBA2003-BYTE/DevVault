const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    riskFactors: {
        locationAnomaly: {
            score: { type: Number, default: 0 },
            maxScore: { type: Number, default: 20 }
        },
        keystrokeAnomaly: {
            score: { type: Number, default: 0 },
            maxScore: { type: Number, default: 30 },
            deleteCount: { type: Number, default: 0 }
        },
        sessionTime: {
            score: { type: Number, default: 0 },
            maxScore: { type: Number, default: 30 },
            duration: { type: Number, default: 0 } // in seconds
        },
        unusualTime: {
            score: { type: Number, default: 0 },
            maxScore: { type: Number, default: 20 }
        }
    },
    totalRiskScore: {
        type: Number,
        required: true
    },
    action: {
        type: String,
        enum: ['access_granted', 'mfa_required', 'blocked'],
        required: true
    },
    mfaCompleted: {
        type: Boolean,
        default: false
    },
    loginSuccess: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('AccessLog', accessLogSchema);
