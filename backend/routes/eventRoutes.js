const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// GET /api/events — Fetch all events (Public or Authenticated)
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({}).sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        console.error('Fetch events error:', err);
        res.status(500).json({ message: 'Server error fetching events' });
    }
});

module.exports = router;
