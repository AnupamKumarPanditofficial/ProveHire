const User = require('../models/User');
const Recruiter = require('../models/Recruiter');
const Event = require('../models/Event');

const ADMIN_PASSKEY = 'Hire123';

/**
 * Middleware: verify admin passkey from header
 */
const requireAdmin = (req, res, next) => {
    const key = req.headers['x-admin-key'];
    if (key !== ADMIN_PASSKEY) {
        return res.status(401).json({ message: 'Unauthorized: invalid admin key' });
    }
    next();
};

/**
 * @desc   Get platform stats + recent users (merged candidates + recruiters)
 * @route  GET /api/admin/stats
 * @access Admin only
 */
const getStats = async (req, res) => {
    try {
        console.log('--- ADMIN STATS REQUEST ---');
        const [totalCandidates, totalRecruiters, recentUsers, recentRecruiters] = await Promise.all([
            User.countDocuments({}),
            Recruiter.countDocuments({}),
            User.find({})
                .select('fullName email role createdAt isBlocked isVerified')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            Recruiter.find({})
                .select('fullName email role createdAt isBlocked isVerified')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);

        console.log('Counts:', { totalCandidates, totalRecruiters });
        console.log('Recent Recruiters:', recentRecruiters);

        // Merge and sort by date
        const mergedRecent = [...recentUsers, ...recentRecruiters]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);

        res.json({
            totalUsers: totalCandidates + totalRecruiters,
            candidates: totalCandidates,
            recruiters: totalRecruiters,
            recentUsers: mergedRecent,
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ message: 'Server error fetching admin stats' });
    }
};

/**
 * @desc   Get full user list
 * @route  GET /api/admin/users?role=candidate|recruiter
 */
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let users = [];

        if (!role || role === 'candidate') {
            const candidates = await User.find({})
                .select('fullName email role createdAt isBlocked isVerified')
                .sort({ createdAt: -1 })
                .lean();
            users = [...users, ...candidates];
        }

        if (!role || role === 'recruiter') {
            const recruiters = await Recruiter.find({})
                .select('fullName email role createdAt isBlocked isVerified')
                .sort({ createdAt: -1 })
                .lean();
            users = [...users, ...recruiters];
        }

        // Sort if merged
        if (!role) {
            users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        res.json(users);
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

/**
 * @desc   Delete a user
 * @route  DELETE /api/admin/users/:id?role=candidate|recruiter
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.query;

        if (role === 'recruiter') {
            await Recruiter.findByIdAndDelete(id);
        } else {
            await User.findByIdAndDelete(id);
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Admin delete error:', err);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};

/**
 * @desc   Toggle block status
 * @route  PATCH /api/admin/users/:id/block?role=candidate|recruiter
 */
const toggleBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.query;

        let user;
        if (role === 'recruiter') {
            user = await Recruiter.findById(id);
        } else {
            user = await User.findById(id);
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
    } catch (err) {
        console.error('Admin block error:', err);
        res.status(500).json({ message: 'Server error toggling block status' });
    }
};

/**
 * @desc   Event Management
 */
const getEvents = async (req, res) => {
    try {
        const events = await Event.find({}).sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching events' });
    }
};

const createEvent = async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: 'Server error creating event' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error deleting event' });
    }
};

module.exports = { requireAdmin, getStats, getUsers, deleteUser, toggleBlock, getEvents, createEvent, deleteEvent };
