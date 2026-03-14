const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const recruiterSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        default: '',
        trim: true,
    },
    companyWebsite: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    industryType: { type: String, default: '' },
    companySize: { type: String, default: '' },
    companyLocation: { type: String, default: '' },
    companyLogo: { type: String, default: '' }, // URL or Base64

    designation: { type: String, default: '' },
    workEmail: { type: String, default: '' },
    phone: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    profilePic: { type: String, default: '' }, // URL or Base64

    hiringRoles: { type: [String], default: [] },
    jobType: { type: [String], default: [] },
    workMode: { type: [String], default: [] },
    experienceLevel: { type: String, default: '' },
    monthlyVolume: { type: String, default: '' },
    aiAutoScreening: { type: Boolean, default: true },

    // Always 'recruiter' — stored explicitly for token payloads
    role: {
        type: String,
        default: 'recruiter',
        immutable: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    sessionId: {
        type: String,
        default: null,
    },
    onboardingDone: {
        type: Boolean,
        default: false,
    },
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
        default: null,
    },
    passwordHistory: {
        type: [String],
        default: [],
    },
    lastActive: {
        type: Date,
        default: null,
    },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    confirmationExpiresAt: { type: Date, default: null },
}, { timestamps: true });

// Hash password on save (only when modified)
recruiterSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
recruiterSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

const Recruiter = mongoose.model('Recruiter', recruiterSchema);
module.exports = Recruiter;
