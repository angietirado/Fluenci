const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { isEmailConfigured, sendPasswordResetEmail } = require('../utils/sendEmail');

// Helper function to get token from model and send response
// MOVED TO THE TOP so register and login can access it
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token: token,
        data: user
    });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
        return next(new ErrorResponse('Please provide name, email, password, and role', 400));
    }
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if email already exists (regardless of role)
    const existingUser = await User.findOne({ 
        email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
    if (existingUser) {
        return next(new ErrorResponse(
            `This email is already registered as ${existingUser.role === 'influencer' ? 'an influencer' : 'a business'}. Please use a different email or log in with your existing account.`,
            400
        ));
    }
    
    // Create user
    const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role
    });

    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    if (!role) {
        return next(new ErrorResponse('Please provide a role (influencer or business)', 400));
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();
    // Trim password (but don't lowercase it)
    const trimmedPassword = password.trim();

    // Check for user with case-insensitive email search and include password field
    // Escape special regex characters in email
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ 
        email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    }).select('+password');

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Verify the user's role matches the requested role
    if (user.role !== role) {
        return next(new ErrorResponse(
            `This email is registered as ${user.role === 'influencer' ? 'an influencer' : 'a business'}. Please log in from the ${user.role === 'influencer' ? 'influencer' : 'business'} login page.`,
            403
        ));
    }

    // Debug logging (remove in production)
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', normalizedEmail);
    console.log('User found:', !!user);
    console.log('User ID:', user?._id);
    console.log('User role:', user?.role);
    console.log('Password provided:', !!trimmedPassword, 'Length:', trimmedPassword?.length);
    console.log('Hashed password exists:', !!user.password);
    console.log('Password hash length:', user.password ? user.password.length : 0);
    console.log('Password hash preview:', user.password ? user.password.substring(0, 20) + '...' : 'N/A');

    // Check if password matches
    if (!user.password) {
        console.error('ERROR: User password field is missing!');
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password is already hashed (starts with $2a$, $2b$, etc.)
    const isPasswordHashed = user.password && user.password.startsWith('$2');
    console.log('Password is hashed:', isPasswordHashed);
    
    let isMatch = false;
    
    if (isPasswordHashed) {
        // Password is hashed, use bcrypt comparison
        try {
            console.log('Attempting bcrypt comparison...');
            isMatch = await user.matchPassword(trimmedPassword);
            console.log('Bcrypt comparison result:', isMatch);
        } catch (err) {
            console.error('Error in matchPassword:', err);
            // Fallback to direct bcrypt comparison
            try {
                console.log('Falling back to direct bcrypt.compare...');
                isMatch = await bcrypt.compare(trimmedPassword, user.password);
                console.log('Direct bcrypt.compare result:', isMatch);
            } catch (bcryptErr) {
                console.error('Error in bcrypt.compare:', bcryptErr);
                return next(new ErrorResponse('Error validating password', 500));
            }
        }
    } else {
        // Password is not hashed (legacy plain text) - compare directly
        // This handles old accounts that might have plain text passwords
        console.log('Password appears to be plain text, comparing directly...');
        isMatch = user.password === trimmedPassword;
        console.log('Plain text comparison result:', isMatch);
        
        if (isMatch) {
            // If plain text matches, re-hash and save the password
            console.log('Re-hashing plain text password for user:', normalizedEmail);
            user.password = trimmedPassword; // This will trigger the pre-save hook to hash it
            await user.save();
            console.log('Password re-hashed and saved successfully');
        }
    }

    if (!isMatch) {
        console.log('❌ PASSWORD COMPARISON FAILED');
        console.log('Email:', normalizedEmail);
        console.log('Provided password length:', trimmedPassword?.length);
        console.log('Stored password hash preview:', user.password?.substring(0, 30));
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    console.log('✅ LOGIN SUCCESSFUL');

    sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user details
// @route   GET /api/v1/auth/me
// @access  Private (Requires JWT)
exports.getMe = async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new ErrorResponse('Please provide an email', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
        email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    });

    const genericMessage =
        'If that email is registered, a password reset link has been sent. Check your inbox and spam folder.';

    if (!user) {
        return res.status(200).json({
            success: true,
            message: genericMessage
        });
    }

    if (!isEmailConfigured()) {
        return next(new ErrorResponse(
            'Password reset email is not configured. Add SMTP settings to backend/config/config.env (see comments in that file).',
            503
        ));
    }

    const resetToken = user.getResetPasswordToken();

    try {
        await user.save({ validateBeforeSave: false });

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const resetUrl = `${frontendUrl}/resetpassword/${resetToken}`;

        await sendPasswordResetEmail({
            email: user.email,
            name: user.name,
            resetUrl
        });

        res.status(200).json({
            success: true,
            message: genericMessage
        });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        console.error('Forgot password email error:', err.message);
        return next(new ErrorResponse(
            'Could not send reset email. Check SMTP settings in config.env and try again.',
            500
        ));
    }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
        return next(new ErrorResponse('Invalid or expired reset token', 400));
    }

    // Set new password
    const { password } = req.body;

    if (!password || password.length < 6) {
        return next(new ErrorResponse('Password must be at least 6 characters', 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
});