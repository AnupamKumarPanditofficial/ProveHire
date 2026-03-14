const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { registerUser, verifyOTP, loginUser, forgotPassword, resetPassword, logoutUser, getCurrentUser, refreshToken, completeOnboarding } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator, otpValidator, forgotPasswordValidator, resetPasswordValidator } = require('../middleware/validators');

// Rate Limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 forgot password requests per hour
    message: { message: 'Too many password reset requests, please try again later' }
});

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { message: 'Too many password reset attempts, please try again later' }
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many OTP attempts, please try again later' }
});

// POST /api/auth/register
router.post('/register', registerValidator, registerUser);

// POST /api/auth/verify-otp
router.post('/verify-otp', otpLimiter, otpValidator, verifyOTP);

// POST /api/auth/login
router.post('/login', loginLimiter, loginValidator, loginUser);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidator, resetPassword);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/logout
router.post('/logout', verifyToken, logoutUser);

// POST /api/auth/complete-onboarding
router.post('/complete-onboarding', verifyToken, completeOnboarding);

// GET /api/auth/me
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
