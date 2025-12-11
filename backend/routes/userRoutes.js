// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware'); // Import both functions
const upload = require('../utils/fileUpload');
const { 
    getUsers, 
    getUser, 
    updateProfile,      // <-- NEW IMPORT
    updatePassword,    // <-- NEW IMPORT
    completeOnboarding, // <-- NEW IMPORT
    getInfluencers,     // <-- NEW IMPORT
    getBusinesses      // <-- NEW IMPORT
} = require('../controllers/userController');

// Public/Private User Routes (must be before admin routes)
router.put('/profile', protect, upload.single('profilePicture'), updateProfile);
router.put('/password', protect, updatePassword);
router.put('/onboarding', protect, upload.single('profilePicture'), completeOnboarding);
router.get('/influencers', protect, getInfluencers); // Get influencers for businesses
router.get('/businesses', protect, getBusinesses); // Get businesses for influencers

// Admin-only routes
router.use(protect); // Applies 'protect' to all routes below
router.use(authorize('admin')); // Applies 'authorize('admin')' to all routes below

// GET /api/v1/users
router
    .route('/')
    .get(getUsers);

// GET /api/v1/users/:id
router
    .route('/:id')
    .get(getUser);

module.exports = router;