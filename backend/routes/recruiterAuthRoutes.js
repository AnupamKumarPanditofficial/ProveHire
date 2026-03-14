const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
    registerRecruiter,
    verifyRecruiterOTP,
    loginRecruiter,
    logoutRecruiter,
    getCurrentRecruiter,
    refreshRecruiterToken,
    updateRecruiterProfile,
} = require('../controllers/recruiterAuthController');
const { verifyRecruiterToken } = require('../middleware/authMiddleware');

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
});

// Validators (inline — lightweight, dedicated to recruiter)
const registerVal = [
    body('fullName').trim().notEmpty().withMessage('Full name is required').escape(),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
];
const otpVal = [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
];
const loginVal = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

// POST /api/recruiter-auth/register
router.post('/register', registerVal, registerRecruiter);

// POST /api/recruiter-auth/verify-otp
router.post('/verify-otp', loginLimiter, otpVal, verifyRecruiterOTP);

// POST /api/recruiter-auth/login
router.post('/login', loginLimiter, loginVal, loginRecruiter);

// POST /api/recruiter-auth/logout
router.post('/logout', verifyRecruiterToken, logoutRecruiter);

// GET /api/recruiter-auth/me
router.get('/me', verifyRecruiterToken, getCurrentRecruiter);

// PATCH /api/recruiter-auth/profile
router.patch('/profile', verifyRecruiterToken, updateRecruiterProfile);

// POST /api/recruiter-auth/refresh
router.post('/refresh', refreshRecruiterToken);

module.exports = router;
