// backend/controllers/dataController.js
const asyncHandler = require('../middleware/async'); // Ensure this is imported
const Transaction = require('../models/Transaction'); // <-- NEW IMPORT
const ErrorResponse = require('../utils/errorResponse'); // Ensure this is imported
/**
 * @desc    Get dashboard metrics for the logged-in user
 * @route   GET /api/v1/data/dashboard
 * @access  Private
 */

exports.getRecentActivities = asyncHandler(async (req, res, next) => {
    // CRITICAL: Fetch only transactions belonging to the logged-in user
    const activities = await Transaction.find({ user: req.user.id })
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(5); // Get only the 5 most recent

    // If no transactions are found, we can return an empty array
    res.status(200).json({
        success: true,
        count: activities.length,
        data: activities
    });
});

exports.getDashboardData = async (req, res, next) => {
    // The user object is attached to the request by the 'protect' middleware
    const user = req.user; 

    // In a real application, you would query your database here
    // using user._id to fetch personalized data (e.g., transactions, balance).
    
    // For this example, we return dynamic dummy data based on the user's name/role
    const baseBalance = user.role === 'admin' ? 50000 : 15200;

    res.status(200).json({
        success: true,
        data: {
            // Personalized data fields
            userName: user.name.split(' ')[0],
            accountBalance: baseBalance + Math.floor(Math.random() * 500), // Add randomness
            budgetUsed: (Math.random() * 50 + 20).toFixed(0), // 20% to 70% used
            newAlerts: Math.floor(Math.random() * 5),
            
            // Example of role-specific visibility
            adminFeatureEnabled: user.role === 'admin'
        }
    });
};