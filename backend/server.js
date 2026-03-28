const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const reviewRoutes = require('./routes/reviewRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- CORS ---
// Restrict origin in production via ALLOWED_ORIGIN env var; fall back to * in dev
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(
    cors({
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-language'],
    })
);

// --- BODY PARSERS (must come before rate limiters so bodies are readable) ---
app.use(express.json({ limit: '5mb', strict: false }));
app.use(express.text({ type: 'text/plain', limit: '5mb' }));

// --- LOGGING ---
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- RATE LIMITERS ---
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP. Please try again later.' },
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please slow down.' },
});

app.use(globalLimiter);
app.use('/api', apiLimiter);

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.json({
        status: true,
        uptime: process.uptime(),                 // seconds server has been running
        timestamp: new Date().toISOString(),       // standard ISO format for monitoring tools
    });
});

// --- ERROR HANDLER (must be last middleware) ---
app.use(errorHandler);

// --- DATABASE + SERVER START ---
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        const server = app.listen(PORT, HOST, () => {
            console.log(`Server is running on http://${HOST}:${PORT}`);
        });

        // Graceful shutdown — prevents abrupt kills on Ctrl+C or deployment restarts
        const shutdown = (signal) => {
            console.log(`\n${signal} received. Closing server gracefully...`);
            server.close(() => {
                mongoose.connection.close(false, () => {
                    console.log('MongoDB connection closed. Exiting.');
                    process.exit(0);
                });
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
        // Fatal: if DB can't connect, don't run the server at all
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    });