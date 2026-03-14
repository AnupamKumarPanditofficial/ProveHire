const User = require('../models/User');
const OTP = require('../models/OTP');
const PasswordResetToken = require('../models/PasswordResetToken');
const AuditLog = require('../models/AuditLog');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Password Validation Regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Generate JWT Helper
const generateToken = (userId, role, sessionId) => {
    return jwt.sign({ userId, role, sessionId }, process.env.JWT_SECRET, {
        expiresIn: '24h',
    });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register a new user & send OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Note: Password validation moved to express-validator but checking regex for safety
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one digit, and one special character.'
            });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            if (!userExists.isVerified) {
                // Resend OTP
                const otpCode = generateOTP();
                await OTP.create({ email, otp: otpCode });
                sendEmail({
                    email,
                    subject: 'ProvaHire - Verify Your Account',
                    message: `Your OTP for ProvaHire account verification is: ${otpCode}. It is valid for 5 minutes.`,
                    htmlMessage: `<h3>Welcome to ProvaHire!</h3><p>Your OTP for account verification is: <strong>${otpCode}</strong></p><p>It is valid for 5 minutes.</p>`,
                }).catch(err => console.error('Background email error:', err));
            } else {
                // To prevent enumeration, we act like it worked but send a warning email
                sendEmail({
                    email,
                    subject: 'ProvaHire - Registration Attempted',
                    message: `Someone tried to register an account with this email, but you already have a verified account.`,
                    htmlMessage: `<p>Someone tried to register a ProvaHire account with this email, but you already have a verified account. If this was you, please login.</p>`,
                }).catch(err => console.error('Background email error:', err));
            }

            // Always return identical success message to prevent enumeration
            return res.status(200).json({
                message: 'Registration process initiated. Please check your email for the OTP.',
                email
            });
        }

        // Create User — password hashing is handled by the pre-save hook in User.js
        const user = await User.create({
            fullName,
            email,
            password,           // plain text — pre-save hook will hash it once
            role: role || 'candidate',
            passwordHistory: [], // will be populated after pre-save hash
        });

        if (user) {
            const otpCode = generateOTP();
            await OTP.create({ email: user.email, otp: otpCode });

            await AuditLog.create({
                userId: user._id,
                action: 'REGISTRATION_SUCCESS',
                role: user.role,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            res.status(201).json({
                message: 'Registration process initiated. Please check your email for the OTP.',
                email: user.email,
            });
            sendEmail({
                email: user.email,
                subject: 'Welcome to ProvaHire - Verify Your Account',
                message: `Your OTP for ProvaHire account verification is: ${otpCode}. It is valid for 5 minutes.`,
                htmlMessage: `<h3>Welcome to ProvaHire!</h3><p>Your OTP for account verification is: <strong>${otpCode}</strong></p><p>It is valid for 5 minutes.</p>`,
            }).catch(err => console.error('Background OTP email error:', err));
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp, role } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // OTP Role Gate Validation
        if (role && user.role !== role) {
            await AuditLog.create({
                userId: user._id,
                action: 'ROLE_MISMATCH_ATTEMPT',
                role: role,
                details: 'OTP verification attempted with wrong role gate.'
            });
            return res.status(403).json({ message: `These credentials do not belong to a ${role} account.` });
        }

        const otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            // Track OTP failures
            await AuditLog.create({
                userId: user._id,
                action: 'OTP_FAILED',
                role: role || user.role,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;

        // Ticket #16: Set Confirmation Expiry (1 hour)
        user.confirmationExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await OTP.deleteOne({ _id: otpRecord._id });

        // Generate Session ID & Tokens
        const sessionId = crypto.randomUUID();
        user.sessionId = sessionId;
        user.lastActive = new Date();
        user.ipAddress = req.ip;
        user.userAgent = req.headers['user-agent'];
        await user.save();

        await AuditLog.create({
            userId: user._id,
            action: 'OTP_SUCCESS',
            role: user.role,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Generate Tokens
        const accessToken = jwt.sign(
            { userId: user._id, role: user.role, sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id, role: user.role, sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            message: 'Email verified successfully',
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            accessToken
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

/**
 * @desc    Auth user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const user = await User.findOne({ email });

        // Timing Attack Prevention
        if (!user) {
            // Run a dummy bcrypt compare to normalize response time
            await bcrypt.compare(password, '$2a$10$DUMMYHASHFORPASSWORDCOMPARISONTOSLOWHACKERDOWN1234');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Account Lockout Check
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(403).json({ message: `Account locked. Try again in ${minutesLeft} minutes` });
        }

        // Helper to handle failures and lockouts
        const handleLoginFailure = async (failureReason, status) => {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
            }
            await user.save();
            await AuditLog.create({
                userId: user._id,
                action: 'LOGIN_FAILED',
                role: role || 'unknown',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                details: failureReason
            });
            return res.status(status).json({ message: failureReason.includes('credentials') ? failureReason : 'Invalid email or password' });
        };

        // Role Isolation Check
        if (role && user.role !== role) {
            return await handleLoginFailure(`These credentials do not belong to a ${role} account.`, 403);
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return await handleLoginFailure('Invalid password', 401);
        }

        // Verified Check
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email address through the OTP sent.' });
        }

        // Success Flow
        user.failedLoginAttempts = 0;
        user.lockUntil = null;

        const sessionId = crypto.randomUUID();
        user.sessionId = sessionId;
        user.lastActive = new Date();
        user.ipAddress = req.ip;
        user.userAgent = req.headers['user-agent'];
        await user.save();

        // Audit Log
        await AuditLog.create({
            userId: user._id,
            action: 'LOGIN_SUCCESS',
            role: user.role,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Generate Tokens
        const accessToken = jwt.sign(
            { userId: user._id, role: user.role, sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // 15 mins
        );

        const refreshToken = jwt.sign(
            { userId: user._id, role: user.role, sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // 7 days
        );

        // Put Refresh Token in HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send Access Token to memory
        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            onboardingDone: user.onboardingDone,
            accessToken
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

/**
 * @desc    Forgot Password (Generate & Send Secure Reset Link)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
    try {
        const { email, role } = req.body;

        if (role !== 'candidate' && role !== 'recruiter') {
            return res.status(400).json({ message: 'Bad Request' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(403).json({ message: 'No account found. Please check your email and try again.' });
        }

        if (user.role !== role) {
            return res.status(403).json({ message: 'No account found. Please check your email and try again.' });
        }

        // Generate Secure OTP
        const otpCode = generateOTP();

        // Clear any old OTPs for this email safely
        await OTP.deleteMany({ email });
        await OTP.create({ email, otp: otpCode });

        // Audit Logging
        await AuditLog.create({
            userId: user._id,
            action: 'PASSWORD_RESET_REQUESTED',
            role: user.role,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Immediately respond to allow direct UI jump
        res.status(200).json({ message: 'If a matching account exists, you will receive an email shortly.' });

        // Send Email Async
        sendEmail({
            email: user.email,
            subject: 'ProvaHire - Password Reset OTP',
            message: `Your OTP to reset your password is: ${otpCode}`,
            htmlMessage: `<h3>ProvaHire Password Reset</h3><p>Your OTP to reset your password is: <strong>${otpCode}</strong></p><p>This OTP is valid for 5 minutes.</p><p>If you did not request this, please ignore this email.</p>`,
        }).catch(err => console.error('Background forgot-password email error:', err));

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during forgot password' });
    }
};

/**
 * @desc    Reset Password (Verify Token Hash & Update Password via History check)
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, role, newPassword } = req.body;

        if (role !== 'candidate' && role !== 'recruiter') {
            return res.status(400).json({ message: 'Bad Request' });
        }

        // Note: Password validation moved to express-validator but checking regex for safety
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one digit, and one special character.'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(403).json({ message: 'No account found. Please check your email and try again.' });
        }

        if (user.role !== role) {
            return res.status(403).json({ message: 'No account found. Please check your email and try again.' });
        }

        // Verify OTP strictly matching email
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Password History Check (Prevent reuse of last 5)
        if (user.passwordHistory && user.passwordHistory.length > 0) {
            for (let oldHash of user.passwordHistory) {
                const isMatch = await bcrypt.compare(newPassword, oldHash);
                if (isMatch) {
                    return res.status(400).json({ message: 'You cannot reuse a recent password. Please choose a different one.' });
                }
            }
        }

        // Clear lockouts 
        user.failedLoginAttempts = 0;
        user.lockUntil = null;

        // Hash the new password natively to insert seamlessly
        const salt = await bcrypt.genSalt(10);
        const finalHash = await bcrypt.hash(newPassword, salt);
        user.password = finalHash;

        // Push to history securely without exceeding 5
        let currentHistory = user.passwordHistory || [];
        currentHistory.unshift(finalHash);
        if (currentHistory.length > 5) currentHistory = currentHistory.slice(0, 5);
        user.passwordHistory = currentHistory;

        // Session invalidation immediately on reset
        user.sessionId = crypto.randomUUID();

        await user.save();

        // Mark OTP as used by deleting
        await OTP.deleteOne({ _id: otpRecord._id });

        // Audit Log
        await AuditLog.create({
            userId: user._id,
            action: 'PASSWORD_RESET_COMPLETED',
            role: user.role,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ message: 'Password has been reset successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

/**
 * @desc    Logout User / clear cookie & session
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
    try {
        if (req.user) {
            req.user.sessionId = null;
            await req.user.save();
            await AuditLog.create({
                userId: req.user._id,
                action: 'LOGOUT',
                role: req.userRole,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
        }
        res.cookie('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 0
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};

/**
 * @desc    Get Current Logged in User
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
    if (req.user) {
        res.status(200).json({
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.userRole,
        });
    } else {
        res.status(401).json({ message: 'Not authorized' });
    }
};

/**
 * @desc    Refresh Access Token
 * @route   POST /api/auth/refresh
 * @access  Public (needs HttpOnly cookie)
 */
const refreshToken = async (req, res) => {
    try {
        const tokenVal = req.cookies.refreshToken;

        if (!tokenVal) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        const decoded = jwt.verify(tokenVal, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (user.sessionId !== decoded.sessionId) {
            return res.status(401).json({ message: 'Session invalidated' });
        }

        const newAccessToken = jwt.sign(
            { userId: user._id, role: user.role, sessionId: user.sessionId },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Optional: Reset Idle timeout on refresh
        user.lastActive = new Date();
        await user.save();

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Refresh Token error:', error);
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

/**
 * @desc    Complete Onboarding (Mark onboardingDone = true)
 * @route   POST /api/auth/complete-onboarding
 * @access  Private
 */
const completeOnboarding = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        req.user.onboardingDone = true;
        await req.user.save();

        await AuditLog.create({
            userId: req.user._id,
            action: 'ONBOARDING_COMPLETED',
            role: req.user.role,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ message: 'Onboarding completed successfully' });
    } catch (error) {
        console.error('Complete onboarding error:', error);
        res.status(500).json({ message: 'Server error during onboarding completion' });
    }
};

module.exports = {
    registerUser,
    verifyOTP,
    loginUser,
    forgotPassword,
    resetPassword,
    logoutUser,
    getCurrentUser,
    refreshToken,
    completeOnboarding
};
