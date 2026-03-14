const express = require('express');
const router = express.Router();
const { generateContent } = require('../controllers/geminiController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// POST /api/gemini/generate
router.post('/generate', verifyToken, authorizeRole('candidate'), generateContent);

module.exports = router;
