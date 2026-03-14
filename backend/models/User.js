const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['candidate', 'recruiter'],
        default: 'candidate',
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
    ipAddress: {
        type: String,
        default: null,
    },
    userAgent: {
        type: String,
        default: null,
    },
    lastActive: {
        type: Date,
        default: null,
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    passwordHistory: {
        type: [String],
        default: []
    },
    confirmationExpiresAt: {
        type: Date,
        default: null
    },
    onboardingDone: {
        type: Boolean,
        default: false
    },
    // --- Skill Zone AI Metrics ---
    targetRole: {
        type: String,
        default: null, // The role they specify before testing
    },
    verifiedSkills: [{
        skillName: String,
        score: Number, // Percentage 0-100
        verifiedAt: Date
    }],
    scores: {
        resumeScore: { type: Number, default: 0 },
        skillScore: { type: Number, default: 0 }, // Average of verifiedSkills
        testScore: { type: Number, default: 0 },  // Score from the Main Role Test
        hireScore: { type: Number, default: 0 },  // Final calculated aggregate
    },
    assessmentHistory: [{
        testName: String,
        testType: { type: String, enum: ['skill', 'role'] },
        score: Number,
        passed: Boolean,
        date: { type: Date, default: Date.now },
        violationsCount: Number
    }],
    // --- Detailed Profile Data ---
    education: {
        fullName: String,
        degree: String,
        university: String,
        passingYear: String
    },
    careerPreferences: {
        engagement: { type: String, enum: ['job', 'internship'], default: 'job' },
        preferredRole: String,
        preferredLocation: String,
        industries: [String]
    },
    certificates: [{
        name: String,
        link: String,
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    consentAgreed: {
        type: Boolean,
        default: false
    },
    subscriptionPlan: {
        type: String,
        enum: ['Free', 'Basic', 'Pro', 'Elite'],
        default: 'Free'
    },
    stripeCustomerId: {
        type: String,
        default: null
    },
    planExpiry: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Hash password before saving (modern async pattern — no `next` needed)
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
