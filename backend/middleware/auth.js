const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Used to fetch user data after token verification

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    // 1. Check if token exists in the header (Format: Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Set token from Bearer scheme
        token = req.headers.authorization.split(' ')[1];
    } 
    // You could also check for the token in cookies here if you were using them

    // 2. Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route (No Token)'
        });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach user to the request object
        // We find the user by the ID stored in the token payload (decoded.id)
        // .select('-password') ensures we don't return the hashed password
        req.user = await User.findById(decoded.id).select('-password');
        
        // 5. Continue to the next middleware or route handler
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route (Invalid Token)'
        });
    }
};