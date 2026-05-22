const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const envPath = path.join(__dirname, 'config', 'config.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const socialMediaRoutes = require('./routes/socialMediaRoutes');
const aiRoutes = require('./routes/aiRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

const corsOrigins = ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);

app.use(express.json());
app.use(cookieParser());

const uploadsPath = process.env.VERCEL
    ? path.join('/tmp', 'fluenci-uploads')
    : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use(
    cors({
        origin: corsOrigins.length > 0 ? corsOrigins : true,
        credentials: true,
    })
);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health checks without DB (helps debug Vercel deploys)
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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/social', socialMediaRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/messages', messageRoutes);

app.use(errorHandler);

module.exports = app;
