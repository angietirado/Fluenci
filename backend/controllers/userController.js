// backend/controllers/userController.js
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    // Handle profile picture upload
    if (req.file) {
        // Save the file path relative to the uploads directory
        // The file will be accessible at /uploads/filename
        user.profilePicture = `/uploads/${req.file.filename}`;
    }

    // Update fields if provided in the body
    user.name = req.body.name || user.name;
    // IMPORTANT: Check if the new email is different to prevent unique key errors
    if (req.body.email && req.body.email !== user.email) {
        // Simple check to ensure email isn't already taken by another user
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser && existingUser.id !== req.user.id) {
            return next(new ErrorResponse('This email is already registered.', 400));
        }
        user.email = req.body.email;
    }

    // Update location and industry (for both influencers and businesses)
    if (req.body.location !== undefined) {
        user.location = req.body.location;
    }
    if (req.body.industry !== undefined) {
        user.industry = req.body.industry;
    }
    if (req.body.description !== undefined) {
        user.description = req.body.description;
    }
    if (req.body.website !== undefined) {
        user.website = req.body.website;
    }
    if (req.body.background !== undefined) {
        user.background = req.body.background;
    }
    if (req.body.personalWebsite !== undefined) {
        user.personalWebsite = req.body.personalWebsite;
    }

    // Update offers (for businesses)
    if (req.body.offers) {
        let offers;
        // Parse JSON if it's a string (from FormData)
        if (typeof req.body.offers === 'string') {
            try {
                offers = JSON.parse(req.body.offers);
            } catch (e) {
                return next(new ErrorResponse('Invalid offers data format', 400));
            }
        } else {
            offers = req.body.offers;
        }

        // Update offers fields
        user.offers = {
            ...user.offers,
            ...offers
        };
    }

    // Mark onboarding as complete if requested (for businesses first-time setup)
    if (req.body.onboardingComplete === 'true' || req.body.onboardingComplete === true) {
        user.onboardingComplete = true;
    }

    // Update social media handles if provided
    if (req.body.socialMedia) {
        let socialMedia;
        // Parse JSON if it's a string (from FormData)
        if (typeof req.body.socialMedia === 'string') {
            try {
                socialMedia = JSON.parse(req.body.socialMedia);
            } catch (e) {
                return next(new ErrorResponse('Invalid social media data format', 400));
            }
        } else {
            socialMedia = req.body.socialMedia;
        }

        // Update social media fields
        user.socialMedia = {
            ...user.socialMedia,
            ...socialMedia
        };
    }

    await user.save({ validateBeforeSave: true }); // Validate to ensure new fields meet schema requirements

    res.status(200).json({
        success: true,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            location: user.location,
            industry: user.industry,
            description: user.description,
            website: user.website,
            offers: user.offers,
            socialMedia: user.socialMedia
        }
    });
});


/**
 * @desc    Update user password
 * @route   PUT /api/v1/users/password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new ErrorResponse('Please provide current and new passwords.', 400));
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check if the current password is correct
    if (!(await user.matchPassword(currentPassword))) {
        return next(new ErrorResponse('Current password is incorrect.', 401));
    }

    // Set the new password (Mongoose pre-save hook will hash it)
    user.password = newPassword;
    await user.save(); // Save triggers the hashing middleware

    res.status(200).json({
        success: true,
        message: 'Password updated successfully. Please log in again.'
    });
});

exports.getUsers = asyncHandler(async (req, res, next) => {
    // This route is protected by both 'protect' and 'authorize' middleware.
    // We can confidently fetch all users.
    const users = await User.find().select('-password'); // Exclude passwords for security

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
});

/**
 * @desc    Get a single user by ID (Admin only)
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        return next(
            new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    Complete influencer onboarding
 * @route   PUT /api/v1/users/onboarding
 * @access  Private (Influencer)
 */
exports.completeOnboarding = asyncHandler(async (req, res, next) => {
    // Parse JSON fields if they're strings (multipart/form-data sends everything as strings)
    let name, gender, location, industry, background, personalWebsite, socialMedia, socialMediaConnections;
    
    if (req.body.name) {
        name = typeof req.body.name === 'string' ? req.body.name.trim() : req.body.name;
    }
    if (req.body.gender) {
        gender = typeof req.body.gender === 'string' ? req.body.gender : req.body.gender;
    }
    if (req.body.location) {
        location = typeof req.body.location === 'string' ? req.body.location : req.body.location;
    }
    if (req.body.industry) {
        industry = typeof req.body.industry === 'string' ? req.body.industry : req.body.industry;
    }
    if (req.body.background) {
        background = typeof req.body.background === 'string' ? req.body.background.trim() : req.body.background;
    }
    if (req.body.personalWebsite) {
        personalWebsite = typeof req.body.personalWebsite === 'string' ? req.body.personalWebsite.trim() : req.body.personalWebsite;
    }
    if (req.body.socialMedia) {
        // If socialMedia is a string, parse it as JSON
        socialMedia = typeof req.body.socialMedia === 'string' 
            ? JSON.parse(req.body.socialMedia) 
            : req.body.socialMedia;
    }
    if (req.body.socialMediaConnections) {
        // If socialMediaConnections is a string, parse it as JSON
        socialMediaConnections = typeof req.body.socialMediaConnections === 'string' 
            ? JSON.parse(req.body.socialMediaConnections) 
            : req.body.socialMediaConnections;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    // Only influencers can complete onboarding
    if (user.role !== 'influencer') {
        return next(new ErrorResponse('This endpoint is only for influencers', 403));
    }

    // Handle profile picture upload
    if (req.file) {
        // Save the file path relative to the uploads directory
        // The file will be accessible at /uploads/filename
        user.profilePicture = `/uploads/${req.file.filename}`;
    }

    // Update onboarding fields
    if (name && name.length > 0) {
        user.name = name;
    }
    if (gender) user.gender = gender;
    if (location) user.location = location;
    if (industry) user.industry = industry;
    if (background !== undefined) {
        user.background = background || null;
    }
    if (personalWebsite !== undefined) {
        user.personalWebsite = personalWebsite || null;
    }
    if (socialMedia) {
        user.socialMedia = {
            ...user.socialMedia,
            ...socialMedia
        };
    }

    // Update socialMediaConnections with follower counts
    if (socialMediaConnections) {
        console.log('[DEBUG BACKEND] Received socialMediaConnections:', JSON.stringify(socialMediaConnections, null, 2));
        if (!user.socialMediaConnections) {
            user.socialMediaConnections = {};
        }
        Object.keys(socialMediaConnections).forEach(platform => {
            const connectionData = socialMediaConnections[platform];
            if (connectionData) {
                // Initialize platform if it doesn't exist
                if (!user.socialMediaConnections[platform]) {
                    user.socialMediaConnections[platform] = {};
                }
                // Update username and followers, but preserve OAuth connection data if it exists
                if (connectionData.username) {
                    user.socialMediaConnections[platform].username = connectionData.username;
                }
                if (connectionData.followers !== undefined && connectionData.followers !== null && connectionData.followers !== '') {
                    const parsedFollowers = parseInt(connectionData.followers);
                    const finalFollowers = isNaN(parsedFollowers) ? null : parsedFollowers;
                    user.socialMediaConnections[platform].followers = finalFollowers;
                    console.log(`[DEBUG BACKEND] Platform: ${platform}, Raw followers: ${connectionData.followers}, Parsed: ${finalFollowers}`);
                }
                // If not connected via OAuth, mark as not connected
                if (!user.socialMediaConnections[platform].connected) {
                    user.socialMediaConnections[platform].connected = false;
                }
            }
        });
        console.log('[DEBUG BACKEND] Final user.socialMediaConnections:', JSON.stringify(user.socialMediaConnections, null, 2));
    }

    // Mark onboarding as complete
    user.onboardingComplete = true;

    await user.save({ validateBeforeSave: true });

    res.status(200).json({
        success: true,
        message: 'Onboarding completed successfully',
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            location: user.location,
            industry: user.industry,
            profilePicture: user.profilePicture,
            socialMedia: user.socialMedia,
            onboardingComplete: user.onboardingComplete
        }
    });
});

/**
 * @desc    Get all influencers (For businesses to discover)
 * @route   GET /api/v1/users/influencers
 * @access  Private/Business
 */
exports.getInfluencers = asyncHandler(async (req, res, next) => {
    // Only businesses can access this endpoint
    if (req.user.role !== 'business') {
        return next(new ErrorResponse('This endpoint is only for businesses', 403));
    }

    // Find all influencers who have completed onboarding
    const influencers = await User.find({ 
        role: 'influencer',
        onboardingComplete: true 
    }).select('-password -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
        success: true,
        count: influencers.length,
        data: influencers
    });
});

/**
 * @desc    Get all businesses (For influencers to discover)
 * @route   GET /api/v1/users/businesses
 * @access  Private/Influencer
 */
exports.getBusinesses = asyncHandler(async (req, res, next) => {
    // Only influencers can access this endpoint
    if (req.user.role !== 'influencer') {
        return next(new ErrorResponse('This endpoint is only for influencers', 403));
    }

    // Find all businesses who have completed onboarding
    const businesses = await User.find({ 
        role: 'business',
        onboardingComplete: true 
    }).select('-password -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
        success: true,
        count: businesses.length,
        data: businesses
    });
});