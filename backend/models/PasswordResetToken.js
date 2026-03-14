const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    tokenHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['candidate', 'recruiter']
    },
    expiresAt: {
        type: Date,
        required: true
    },
    usedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Ensure fast lookups when validating tokens
passwordResetTokenSchema.index({ tokenHash: 1, usedAt: 1, expiresAt: 1 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
