const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in the Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Example: Bearer tokenValue
        token = req.headers.authorization.split(' ')[1];
    } 
    // You could also check for the token in cookies if you implemented that logic, e.g.:
    /*
    else if (req.cookies.token) {
        token = req.cookies.token;
    }
    */

    // Make sure token exists
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route (No Token)', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user based on the ID in the token and attach it to the request object
        // We select('-password') to exclude the password hash
        req.user = await User.findById(decoded.id).select('-password'); 

        next();
    } catch (err) {
        console.error("JWT verification failed:", err.message);
        return next(new ErrorResponse('Not authorized to access this route (Invalid Token)', 401));
    }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(
                    `User role ${req.user.role} is not authorized to access this route`,
                    403
                )
            );
        }
        next();
    };
};