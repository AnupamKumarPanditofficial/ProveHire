const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { clean } = require('xss-clean/lib/xss');
const hpp = require('hpp');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const recruiterAuthRoutes = require('./routes/recruiterAuthRoutes');
const eventRoutes = require('./routes/eventRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { handleWebhook } = require('./controllers/paymentController');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Set security HTTP headers
app.use(helmet());

// Prevent XSS attacks
app.use((req, res, next) => {
    if (req.body) req.body = JSON.parse(clean(JSON.stringify(req.body)));
    if (req.query) req.query = JSON.parse(clean(JSON.stringify(req.query)));
    if (req.params) req.params = JSON.parse(clean(JSON.stringify(req.params)));
    next();
});

// Prevent HTTP Param Pollution
app.use(hpp());

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000', 'https://provahire.vercel.app'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Stripe Webhook (MUST be before express.json)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Parse body first (MUST be before XSS)
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/recruiter-auth', recruiterAuthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('ProvaHire API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
