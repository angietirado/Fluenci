const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Local dev: load config.env. Vercel/production: use dashboard env vars.
const envPath = path.join(__dirname, 'config', 'config.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Route files
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const socialMediaRoutes = require('./routes/socialMediaRoutes');
const aiRoutes = require('./routes/aiRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

const corsOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || corsOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS blocked for origin: ${origin}`));
            }
        },
        credentials: true,
    })
);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Ensure MongoDB is connected before API routes (required on Vercel serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error(err.message);
        res.status(503).json({
            success: false,
            message: 'Database connection failed',
        });
    }
});

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Fluenci API is running',
        health: '/api/health',
        apiBase: '/api/v1',
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/social', socialMediaRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/messages', messageRoutes);

app.use(errorHandler);

// Vercel serverless: export the app (no app.listen). Local: start HTTP server.
module.exports = app;

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(
            `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold
        );
    });

    process.on('unhandledRejection', (err) => {
        console.log(`Error: ${err?.message || 'Unhandled Promise Rejection'}`.red);
        server.close(() => process.exit(1));
    });
}
