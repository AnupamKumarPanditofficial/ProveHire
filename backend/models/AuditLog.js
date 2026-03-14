const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Might be null for failed unknown logins
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'PASSWORD_RESET_REQUESTED',
            'PASSWORD_RESET_COMPLETED',
            'ROLE_MISMATCH_ATTEMPT',
            'SESSION_EXPIRED',
            'LOGOUT',
            'REGISTRATION_SUCCESS',
            'OTP_FAILED',
            'OTP_SUCCESS',
            'TOKEN_REFRESH'
        ]
    },
    role: {
        type: String,
        required: false
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    details: {
        type: String, // Store any extra context stringified
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
