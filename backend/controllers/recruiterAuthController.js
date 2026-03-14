const Recruiter = require('../models/Recruiter');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Register ────────────────────────────────────────────────────────────────
const registerRecruiter = async (req, res) => {
    try {
        const { fullName, email, password, company } = req.body;

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Password must be 8+ chars with uppercase, lowercase, digit, and special character.'
            });
        }

        const existing = await Recruiter.findOne({ email });
        if (existing) {
            if (!existing.isVerified) {
                // Resend OTP
                const otpCode = generateOTP();
                await OTP.create({ email, otp: otpCode });
                sendEmail({
                    email,
                    subject: 'ProvaHire — Verify Your Recruiter Account',
                    message: `Your OTP is: ${otpCode}. Valid for 5 minutes.`,
                    htmlMessage: `<h3>ProvaHire Recruiter Verification</h3><p>OTP: <strong>${otpCode}</strong> — valid 5 minutes.</p>`,
                }).catch(console.error);
            }
            // Always return same response to prevent enumeration
            return res.status(200).json({ message: 'Registration initiated. Check your email for the OTP.', email });
        }

        // Create recruiter — pre-save hook hashes password
        const recruiter = await Recruiter.create({
            fullName,
            email,
            password,   // plain — pre-save hook hashes it
            company: company || '',
        });

        const otpCode = generateOTP();
        await OTP.create({ email: recruiter.email, otp: otpCode });

        res.status(201).json({ message: 'Registration initiated. Check your email for the OTP.', email: recruiter.email });

        sendEmail({
            email: recruiter.email,
            subject: 'Welcome to ProvaHire — Verify Your Recruiter Account',
            message: `Your OTP is: ${otpCode}. Valid for 5 minutes.`,
            htmlMessage: `<h3>Welcome to ProvaHire!</h3><p>Your recruiter verification OTP is: <strong>${otpCode}</strong></p><p>Valid for 5 minutes.</p>`,
        }).catch(console.error);

    } catch (err) {
        console.error('Recruiter register error:', err);
        res.status(500).json({ message: 'Server error during recruiter registration' });
    }
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
const verifyRecruiterOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const recruiter = await Recruiter.findOne({ email });
        if (!recruiter) return res.status(404).json({ message: 'Recruiter account not found' });

        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) return res.status(400).json({ message: 'Invalid or expired OTP' });

        recruiter.isVerified = true;
        recruiter.confirmationExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await OTP.deleteOne({ _id: otpRecord._id });

        const sessionId = crypto.randomUUID();
        recruiter.sessionId = sessionId;
        recruiter.lastActive = new Date();
        await recruiter.save();

        const accessToken = jwt.sign(
            { userId: recruiter._id, role: 'recruiter', sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        const refreshToken = jwt.sign(
            { userId: recruiter._id, role: 'recruiter', sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('recruiterRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: 'Email verified successfully',
            _id: recruiter._id,
            fullName: recruiter.fullName,
            email: recruiter.email,
            role: 'recruiter',
            onboardingDone: recruiter.onboardingDone,
            accessToken,
        });

    } catch (err) {
        console.error('Recruiter OTP error:', err);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginRecruiter = async (req, res) => {
    try {
        const { email, password } = req.body;

        const recruiter = await Recruiter.findOne({ email });

        // Timing attack prevention
        if (!recruiter) {
            await bcrypt.compare(password, '$2a$10$DUMMYHASHFORPASSWORDCOMPARISONTOSLOWHACKERDOWN1234');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Lockout check
        if (recruiter.lockUntil && recruiter.lockUntil > Date.now()) {
            const mins = Math.ceil((recruiter.lockUntil - Date.now()) / 60000);
            return res.status(403).json({ message: `Account locked. Try again in ${mins} minutes` });
        }

        const isMatch = await recruiter.matchPassword(password);
        if (!isMatch) {
            recruiter.failedLoginAttempts += 1;
            if (recruiter.failedLoginAttempts >= 5) {
                recruiter.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            await recruiter.save();
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!recruiter.isVerified) {
            return res.status(401).json({ message: 'Please verify your email via the OTP sent.' });
        }

        recruiter.failedLoginAttempts = 0;
        recruiter.lockUntil = null;
        const sessionId = crypto.randomUUID();
        recruiter.sessionId = sessionId;
        recruiter.lastActive = new Date();
        recruiter.ipAddress = req.ip;
        recruiter.userAgent = req.headers['user-agent'];
        await recruiter.save();

        const accessToken = jwt.sign(
            { userId: recruiter._id, role: 'recruiter', sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        const refreshToken = jwt.sign(
            { userId: recruiter._id, role: 'recruiter', sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('recruiterRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            _id: recruiter._id,
            fullName: recruiter.fullName,
            email: recruiter.email,
            role: 'recruiter',
            onboardingDone: recruiter.onboardingDone,
            accessToken,
        });

    } catch (err) {
        console.error('Recruiter login error:', err);
        res.status(500).json({ message: 'Server error during recruiter login' });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutRecruiter = async (req, res) => {
    try {
        if (req.recruiter) {
            req.recruiter.sessionId = null;
            await req.recruiter.save();
        }
        res.cookie('recruiterRefreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 0,
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Recruiter logout error:', err);
        res.status(500).json({ message: 'Server error during logout' });
    }
};

// ─── Get Current Recruiter ────────────────────────────────────────────────────
const getCurrentRecruiter = async (req, res) => {
    if (req.recruiter) {
        return res.status(200).json({
            _id: req.recruiter._id,
            fullName: req.recruiter.fullName,
            email: req.recruiter.email,
            company: req.recruiter.company,
            companyWebsite: req.recruiter.companyWebsite,
            companyEmail: req.recruiter.companyEmail,
            industryType: req.recruiter.industryType,
            companySize: req.recruiter.companySize,
            companyLocation: req.recruiter.companyLocation,
            companyLogo: req.recruiter.companyLogo,
            designation: req.recruiter.designation,
            phone: req.recruiter.phone,
            linkedIn: req.recruiter.linkedIn,
            workEmail: req.recruiter.workEmail,
            profilePic: req.recruiter.profilePic,
            hiringRoles: req.recruiter.hiringRoles,
            jobType: req.recruiter.jobType,
            workMode: req.recruiter.workMode,
            experienceLevel: req.recruiter.experienceLevel,
            monthlyVolume: req.recruiter.monthlyVolume,
            aiAutoScreening: req.recruiter.aiAutoScreening,
            role: 'recruiter',
            onboardingDone: req.recruiter.onboardingDone,
        });
    }
    res.status(401).json({ message: 'Not authorized' });
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────
const refreshRecruiterToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.recruiterRefreshToken;
        if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const recruiter = await Recruiter.findById(decoded.userId);

        if (!recruiter || recruiter.sessionId !== decoded.sessionId) {
            return res.status(401).json({ message: 'Invalid session' });
        }

        const accessToken = jwt.sign(
            { userId: recruiter._id, role: 'recruiter', sessionId: recruiter.sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.status(200).json({ accessToken });
    } catch (err) {
        console.error('Recruiter refresh error:', err);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// ─── Update Profile ────────────────────────────────────────────────────────────
const updateRecruiterProfile = async (req, res) => {
    try {
        const recruiter = req.recruiter;
        if (!recruiter) return res.status(401).json({ message: 'Not authorized' });

        const allowedUpdates = [
            'fullName', 'company', 'companyWebsite', 'companyEmail', 'industryType', 'companySize',
            'companyLocation', 'companyLogo', 'designation', 'phone', 'linkedIn',
            'workEmail', 'profilePic', 'hiringRoles', 'jobType', 'workMode', 'experienceLevel',
            'monthlyVolume', 'aiAutoScreening', 'onboardingDone'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                recruiter[field] = req.body[field];
            }
        });

        await recruiter.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            recruiter: {
                _id: recruiter._id,
                fullName: recruiter.fullName,
                email: recruiter.email,
                company: recruiter.company,
                onboardingDone: recruiter.onboardingDone,
            }
        });
    } catch (err) {
        console.error('Update recruiter profile error:', err);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

module.exports = {
    registerRecruiter,
    verifyRecruiterOTP,
    loginRecruiter,
    logoutRecruiter,
    getCurrentRecruiter,
    refreshRecruiterToken,
    updateRecruiterProfile,
};
