const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['Applied', 'Shortlisted', 'Interview', 'Hired', 'Rejected'],
        default: 'Applied',
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Ensure a candidate can only apply to a job once
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
