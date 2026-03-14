const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/paymentController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

router.post('/create-checkout-session', verifyToken, authorizeRole('candidate'), createCheckoutSession);

module.exports = router;
