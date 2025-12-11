const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler'); // <-- MUST BE 'errorHandler'

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes'); // <-- NEW IMPORT
const userRoutes = require('./routes/userRoutes'); // <-- NEW IMPORT
const transactionRoutes = require('./routes/transactionRoutes'); // <-- NEW IMPORT
const socialMediaRoutes = require('./routes/socialMediaRoutes'); // <-- NEW IMPORT
const aiRoutes = require('./routes/aiRoutes'); // <-- NEW IMPORT FOR AI CHAT
const messageRoutes = require('./routes/messageRoutes'); // <-- NEW IMPORT FOR MESSAGING

const app = express();

// Body parser (for JSON data)
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enable CORS (Cross-Origin Resource Sharing)
// This allows your frontend (running on a different port/domain) to connect.
app.use(cors({
    origin: 'http://localhost:3000', // Allow only your React frontend
    credentials: true
}));

// Dev logging middleware (using morgan)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Mount Routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/data', dataRoutes); // <-- NEW ROUTE MOUNTED FOR DASHBOARD DATA
app.use('/api/v1/users', userRoutes); // <-- NEW ROUTE MOUNTED
app.use('/api/v1/transactions', transactionRoutes); // <-- NEW ROUTE MOUNTED
app.use('/api/v1/social', socialMediaRoutes); // <-- NEW ROUTE MOUNTED FOR SOCIAL MEDIA CONNECTIONS
app.use('/api/v1/ai', aiRoutes); // <-- NEW ROUTE MOUNTED FOR AI CHAT
app.use('/api/v1/messages', messageRoutes); // <-- NEW ROUTE MOUNTED FOR MESSAGING

// Must be after mounting routes
app.use(errorHandler); // <-- Uses the imported function

const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
);

// Handle unhandled promise rejections (e.g., bad MongoDB connection string)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err?.message || 'Unhandled Promise Rejection'}`.red);
    // Close server & exit process
    server.close(() => process.exit(1));
});