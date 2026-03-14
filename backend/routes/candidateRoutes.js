const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const Event = require('../models/Event');

// Subscription plans config (static product catalogue)
const SUBSCRIPTION_PLANS = [
    {
        name: 'Basic',
        priceMonthly: 100,
        features: ['AI Resume Builder', '5 Skill Tests/mo'],
        isPopular: false,
    },
    {
        name: 'Pro',
        priceMonthly: 150,
        features: ['AI Resume Builder', 'Unlimited Skill Tests', 'Direct Recruiter Access', 'Priority Support'],
        isPopular: true,
    },
];

// GET /api/candidate/dashboard — batch fetch for dashboard
router.get('/dashboard', verifyToken, authorizeRole('candidate'), async (req, res) => {
    try {
        const u = req.user;

        // Fetch events (max 4, newest first)
        const events = await Event.find({}).sort({ createdAt: -1 }).limit(4).lean();

        // Determine hireScoreExists: true only if at least one sub-score is set
        const { resumeScore, skillScore, testScore, hireScore } = u.scores || {};
        const hireScoreExists = !!(hireScore && hireScore > 0 && (resumeScore > 0 || skillScore > 0 || testScore > 0));

        // Determine score percentile labels (rough buckets)
        const getPercentileLabel = (score) => {
            if (score >= 90) return 'Top 5%';
            if (score >= 80) return 'Top 10%';
            if (score >= 70) return 'Top 25%';
            return 'Top 50%';
        };
        const getRoleRankLabel = (score) => {
            if (score >= 90) return 'Top 5';
            if (score >= 80) return 'Top 10';
            if (score >= 70) return 'Top 25';
            return 'Top 50';
        };

        // Verified skills — map to simpler shape for dashboard
        const verifiedSkills = (u.verifiedSkills || []).map(s => ({
            name: s.skillName,
            score: s.score,
            verified: s.score >= 70,
        }));

        // Static assessments list (since there's no assessments DB table)
        const availableAssessments = [
            { title: 'Comprehensive Role Test', durationMinutes: 60, iconType: 'role' },
            { title: 'Targeted Skill Snippets', durationMinutes: 30, iconType: 'skill' },
        ];

        // Add isCurrentPlan flag to each plan
        const currentPlan = u.subscriptionPlan || 'Free';
        const plans = SUBSCRIPTION_PLANS.map(p => ({
            ...p,
            isCurrentPlan: p.name === currentPlan,
        }));

        res.status(200).json({
            user: {
                createdAt: u.createdAt || new Date()
            },
            scores: {
                hireScore: hireScore || 0,
                resumeScore: resumeScore || 0,
                skillScore: skillScore || 0,
                testScore: testScore || 0,
                hireScoreExists,
                resumeVerified: (resumeScore || 0) >= 70,
                skillPercentileLabel: getPercentileLabel(skillScore || 0),
                roleRankLabel: getRoleRankLabel(testScore || 0),
                scoreStatus: hireScoreExists ? 'ACTIVE' : 'PENDING',
            },
            verifiedSkills,
            assessmentHistoryCount: (u.assessmentHistory || []).length,
            availableAssessments,
            events: events.map(ev => ({
                id: ev._id,
                title: ev.heading || ev.title || 'Tech Event',
                date: ev.deadline || ev.createdAt,
                type: ev.type || 'WEBINAR',
            })),
            plans,
            currentPlan,
            applications: { applied: 0, shortlisted: 0, interviews: 0, archived: 0 },
        });
    } catch (err) {
        console.error('Dashboard fetch error:', err);
        res.status(500).json({ message: 'Server error fetching dashboard data' });
    }
});

// PUT /api/candidate/subscription — update subscription plan
router.put('/subscription', verifyToken, authorizeRole('candidate'), async (req, res) => {
    try {
        const { plan } = req.body;
        const validPlans = ['Free', ...SUBSCRIPTION_PLANS.map(p => p.name)];
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ message: 'Invalid plan name' });
        }
        req.user.subscriptionPlan = plan;
        await req.user.save();
        res.status(200).json({ message: 'Subscription updated', plan });
    } catch (err) {
        console.error('Subscription update error:', err);
        res.status(500).json({ message: 'Server error updating subscription' });
    }
});



// GET /api/candidate/confirmation
router.get('/confirmation', verifyToken, authorizeRole('candidate'), (req, res) => {
    // Check confirmation expiry
    if (req.user.confirmationExpiresAt && new Date() > req.user.confirmationExpiresAt) {
        req.user.confirmationExpiresAt = null; // Clear it
        req.user.save(); // Save asynchronously
        return res.status(403).json({ message: 'Confirmation period expired. Please log in again.' });
    }
    res.status(200).json({ message: 'Confirmation active' });
});

// --- Skill Zone AI API Routes ---

// POST /api/candidate/profile/setup-role
router.post('/profile/setup-role', verifyToken, authorizeRole('candidate'), async (req, res) => {
    try {
        const { targetRole, resumeScore } = req.body;
        if (!targetRole) return res.status(400).json({ message: 'targetRole is required.' });

        // Calculate and save the initial setup
        req.user.targetRole = targetRole;
        if (resumeScore !== undefined) {
            req.user.scores.resumeScore = resumeScore;
            // Update total Hire Score immediately if previous scores exist
            const s = req.user.scores;
            // Simple formula example: Resume (20%), Skills (30%), Main Test (50%)
            const wResume = (s.resumeScore || 0) * 0.2;
            const wSkill = (s.skillScore || 0) * 0.3;
            const wTest = (s.testScore || 0) * 0.5;
            req.user.scores.hireScore = Math.round(wResume + wSkill + wTest);
        }

        await req.user.save();
        res.status(200).json({ message: 'Role and resume score initialized successfully.', user: req.user });
    } catch (error) {
        console.error("Setup role error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/candidate/assessment/save
router.post('/assessment/save', verifyToken, authorizeRole('candidate'), async (req, res) => {
    try {
        const { testName, testType, score, passed, violationsCount } = req.body;

        if (!testName || !testType || score === undefined) {
            return res.status(400).json({ message: 'Invalid assessment payload.' });
        }

        // 1. Add to history
        req.user.assessmentHistory.push({
            testName, testType, score, passed, violationsCount
        });

        // 2. Update Verified Skills logic for 'skill' test type
        if (testType === 'skill' && passed) {
            // Check if skill already exists in verified array to update or push
            const existingSkillIndex = req.user.verifiedSkills.findIndex(s => s.skillName === testName);
            if (existingSkillIndex > -1) {
                // Keep highest score or overwrite? Overwrite for now
                req.user.verifiedSkills[existingSkillIndex].score = score;
                req.user.verifiedSkills[existingSkillIndex].verifiedAt = new Date();
            } else {
                req.user.verifiedSkills.push({
                    skillName: testName,
                    score: score,
                    verifiedAt: new Date()
                });
            }

            // Recalculate Average Skill Score
            if (req.user.verifiedSkills.length > 0) {
                const totalSkillScore = req.user.verifiedSkills.reduce((acc, curr) => acc + curr.score, 0);
                req.user.scores.skillScore = Math.round(totalSkillScore / req.user.verifiedSkills.length);
            }
        }

        // 3. Update Main Test logic for 'role' test type
        else if (testType === 'role') {
            // Always take the latest main role test score (or highest)
            req.user.scores.testScore = score;
        }

        // 4. Update Final Hire Score
        const s = req.user.scores;
        // Basic weighting: Resume 20%, Verified Skills Average 30%, Final Role Test 50%
        const wResume = (s.resumeScore || 0) * 0.2;
        const wSkill = (s.skillScore || 0) * 0.3;
        const wTest = (s.testScore || 0) * 0.5;
        req.user.scores.hireScore = Math.round(wResume + wSkill + wTest);

        await req.user.save();
        res.status(200).json({ message: 'Assessment saved successfully', scores: req.user.scores });
    } catch (error) {
        console.error("Save assessment error:", error);
        res.status(500).json({ message: 'Server error saving assessment.' });
    }
});

// GET /api/candidate/assessment/history
router.get('/assessment/history', verifyToken, authorizeRole('candidate'), (req, res) => {
    // Return the required fields for the user
    res.status(200).json({
        assessmentHistory: req.user.assessmentHistory,
        verifiedSkills: req.user.verifiedSkills,
        scores: req.user.scores,
        targetRole: req.user.targetRole
    });
});

// GET /api/candidate/profile
router.get('/profile', verifyToken, authorizeRole('candidate'), async (req, res) => {
    try {
        // req.user is already populated by verifyToken
        res.status(200).json({
            profile: {
                fullName: req.user.fullName,
                email: req.user.email,
                targetRole: req.user.targetRole,
                education: req.user.education,
                careerPreferences: req.user.careerPreferences,
                certificates: req.user.certificates,
                consentAgreed: req.user.consentAgreed,
                scores: req.user.scores,
                verifiedSkills: req.user.verifiedSkills
            }
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

// PUT /api/candidate/profile
router.put('/profile', verifyToken, authorizeRole('candidate'), async (req, res) => {
    try {
        const { education, careerPreferences, certificates, consentAgreed } = req.body;

        if (education) req.user.education = { ...req.user.education, ...education };
        if (careerPreferences) req.user.careerPreferences = { ...req.user.careerPreferences, ...careerPreferences };
        if (certificates) req.user.certificates = certificates; // Replace or append logic? User requested "name, link, file" in step 4
        if (consentAgreed !== undefined) req.user.consentAgreed = consentAgreed;

        await req.user.save();
        res.status(200).json({ message: 'Profile updated successfully', profile: req.user });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

module.exports = router;
