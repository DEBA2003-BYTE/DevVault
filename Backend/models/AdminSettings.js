const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
    unusualTimeRanges: [{
        startTime: {
            type: String,
            required: true,
            match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/  // HH:MM format validation
        },
        endTime: {
            type: String,
            required: true,
            match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/  // HH:MM format validation
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
