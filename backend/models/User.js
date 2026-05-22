const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for JWT handling
const crypto = require('crypto'); // For generating reset tokens

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Ensures password is NOT returned in queries by default
    },
    role: { // <-- NEW FIELD
        type: String,
        enum: ['influencer', 'business', 'admin'], // Define possible roles
        default: 'influencer', // Set default for new registrations
        required: true
    },
    // Influencer-specific fields
    gender: {
        type: String,
        enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'],
        default: null
    },
    location: {
        type: String,
        default: null
    },
    industry: {
        type: String,
        default: null
    },
    socialMedia: {
        instagram: { type: String, default: null },
        youtube: { type: String, default: null },
        tiktok: { type: String, default: null },
        twitter: { type: String, default: null }, // Keeping for backward compatibility, mapped to X in frontend
        x: { type: String, default: null }, // X (formerly Twitter)
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        snapchat: { type: String, default: null },
        pinterest: { type: String, default: null }
    },
    socialMediaConnections: {
        instagram: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            username: { type: String, default: null },
            userId: { type: String, default: null },
            followers: { type: Number, default: null },
            connectedAt: { type: Date, default: null }
        },
        youtube: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            channelId: { type: String, default: null },
            channelName: { type: String, default: null },
            followers: { type: Number, default: null },
            connectedAt: { type: Date, default: null }
        },
        tiktok: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            username: { type: String, default: null },
            userId: { type: String, default: null },
            followers: { type: Number, default: null },
            connectedAt: { type: Date, default: null }
        },
        twitter: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            username: { type: String, default: null },
            userId: { type: String, default: null },
            followers: { type: Number, default: null },
            connectedAt: { type: Date, default: null }
        },
        facebook: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            pageId: { type: String, default: null },
            pageName: { type: String, default: null },
            followers: { type: Number, default: null },
            connectedAt: { type: Date, default: null }
        },
        linkedin: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            profileId: { type: String, default: null },
            profileName: { type: String, default: null },
            followers: { type: Number, default: null },
            connectedAt: { type: Date, default: null }
        },
        snapchat: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            username: { type: String, default: null },
            userId: { type: String, default: null },
            followers: { type: Number, default: null },
            connectedAt: { type: Date, default: null }
        },
        pinterest: {
            connected: { type: Boolean, default: false },
            accessToken: { type: String, default: null },
            refreshToken: { type: String, default: null },
            username: { type: String, default: null },
            followers: { type: Number, default: null },
            userId: { type: String, default: null },
            connectedAt: { type: Date, default: null }
        }
    },
    profilePicture: {
        type: String,
        default: null
    },
    offers: {
        productService: { type: Boolean, default: false },
        productServiceDescription: { type: String, default: '' },
        revenueSharing: { type: Boolean, default: false },
        revenueSharingDescription: { type: String, default: '' },
        brandBuilding: { type: Boolean, default: false },
        brandBuildingDescription: { type: String, default: '' }
    },
    description: {
        type: String,
        default: null
    },
    website: {
        type: String,
        default: null
    },
    background: {
        type: String,
        default: null
    },
    personalWebsite: {
        type: String,
        default: null
    },
    onboardingComplete: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to encrypt password before saving to the database
UserSchema.pre('save', async function (next) {
    // Only run if password has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// backend/models/User.js (Add this function at the end)

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET, // Your secret key (needs to be defined in config.env)
        { expiresIn: process.env.JWT_EXPIRE } // How long the token is valid (e.g., 30d)
    );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);