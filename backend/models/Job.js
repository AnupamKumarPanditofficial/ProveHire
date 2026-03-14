const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    department: {
        type: String,
        required: true,
        trim: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        default: 'Full-time',
    },
    experienceRange: {
        type: String,
        enum: ['0-1 yr', '1-3 yrs', '3-5 yrs', '5-8 yrs', '8+ yrs', ''],
        default: '',
    },
    description: {
        type: String,
        required: true,
    },
    skills: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: ['Active', 'Closed', 'Draft'],
        default: 'Draft',
    },
    aiWeights: {
        skillScore: { type: Number, default: 40 },
        resumeScore: { type: Number, default: 30 },
        hireScore: { type: Number, default: 30 },
    },
    lastDateToApply: {
        type: Date,
        default: null,
    },
    postedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
