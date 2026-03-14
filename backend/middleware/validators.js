const { body, validationResult } = require('express-validator');

// Error formatting middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerValidator = [
    body('fullName').trim().notEmpty().withMessage('Full name is required').escape(),
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),
    validateRequest
];

const loginValidator = [
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),
    validateRequest
];

const otpValidator = [
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().escape(),
    body('role').isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),
    validateRequest
];

const forgotPasswordValidator = [
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('role').isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),
    validateRequest
];

const resetPasswordValidator = [
    body('newPassword').notEmpty().withMessage('Password is required'),
    body('role').isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),
    body('token').notEmpty().withMessage('Token is required').escape(),
    validateRequest
];

module.exports = {
    registerValidator,
    loginValidator,
    otpValidator,
    forgotPasswordValidator,
    resetPasswordValidator
};
