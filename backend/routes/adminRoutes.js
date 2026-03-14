const express = require('express');
const router = express.Router();
const { requireAdmin, getStats, getUsers, deleteUser, toggleBlock } = require('../controllers/adminController');

// GET /api/admin/stats — total users, candidates, recruiters, recent activity
router.get('/stats', requireAdmin, getStats);

// GET /api/admin/users?role=candidate|recruiter — full user list
router.get('/users', requireAdmin, getUsers);

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', requireAdmin, deleteUser);

// PATCH /api/admin/users/:id/block — toggle block
router.patch('/users/:id/block', requireAdmin, toggleBlock);

// Event Management
const { getEvents, createEvent, deleteEvent } = require('../controllers/adminController');
router.get('/events', requireAdmin, getEvents);
router.post('/events', requireAdmin, createEvent);
router.delete('/events/:id', requireAdmin, deleteEvent);

module.exports = router;
