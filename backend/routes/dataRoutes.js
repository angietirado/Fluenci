// backend/routes/dataRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import protection
const { 
    getDashboardData,
    getRecentActivities // <-- NEW IMPORT
} = require('../controllers/dataController');

// All routes here will start with /api/v1/data
router.get('/dashboard', protect, getDashboardData); // This route is protected

router.get('/activities', protect, getRecentActivities); // <-- NEW ROUTE

module.exports = router;