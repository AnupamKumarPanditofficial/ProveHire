const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT from cookie and check sessionId for invalidation
 */
const verifyToken = async (req, res, next) => {
    try {
        let token = req.cookies.token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // Check if session is valid (Role Isolation & Session Cleanup Bug #2 & #3)
        if (user.sessionId !== decoded.sessionId) {
            return res.status(401).json({ message: 'Session expired or invalidated. Please log in again.' });
        }



        // Idle Timeout Check (Bug #3) - 30 minutes
        const now = new Date();
        const lastActive = user.lastActive ? new Date(user.lastActive) : now;
        const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

        if (diffMinutes > 30) {
            // Nullify session to force logout
            user.sessionId = null;
            await user.save();
            return res.status(401).json({ message: 'Session expired due to inactivity' });
        }

        // Update lastActive
        user.lastActive = now;
        await user.save();

        req.user = user;
        req.userRole = decoded.role; // Extract role from token
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

/**
 * Middleware to strictly authorize based on extracted role
 */
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.userRole)) {
            return res.status(403).json({ message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}` });
        }
        next();
    };
};

/**
 * Verify JWT for Recruiter-specific routes.
 * Looks up the Recruiter collection — completely separate from User/candidate.
 */
const Recruiter = require('../models/Recruiter');

const verifyRecruiterToken = async (req, res, next) => {
    try {
        let token = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'recruiter') {
            return res.status(403).json({ message: 'Access denied. Recruiter token required.' });
        }

        const recruiter = await Recruiter.findById(decoded.userId).select('-password');
        if (!recruiter) {
            return res.status(401).json({ message: 'Recruiter account not found' });
        }

        if (recruiter.sessionId !== decoded.sessionId) {
            return res.status(401).json({ message: 'Session expired or invalidated. Please log in again.' });
        }

        req.recruiter = recruiter;
        next();
    } catch (error) {
        console.error('Recruiter token verification error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = {
    verifyToken,
    authorizeRole,
    verifyRecruiterToken,
};

