const ErrorResponse = require('../utils/errorResponse');
const colors = require('colors');

const errorHandler = (err, req, res, next) => {
    // Ensure err exists
    if (!err) {
        return next();
    }

    let error = { ...err }; // Copy the original error object
    error.message = err.message || 'Server Error'; // Ensure the message property is copied

    // Log to console for dev
    if (err.stack) {
        console.log(err.stack.red);
    } else {
        console.log((err.message || 'Unknown error').red);
    }
    
    // Mongoose Bad ObjectId error (e.g., /api/v1/users/1234 - invalid ID format)
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value || 'unknown'}`;
        error = new ErrorResponse(message, 404);
    }

    // Mongoose Duplicate Key error (e.g., trying to register with an existing email)
    if (err.code === 11000) {
        const message = 'Duplicate field value entered (user already exists)';
        error = new ErrorResponse(message, 400);
    }

    // Mongoose Validation error (e.g., missing a required field)
    if (err.name === 'ValidationError' && err.errors) {
        // Map the error details into a single string
        const messages = Object.values(err.errors).map(val => val.message);
        const message = `Validation Failed: ${messages.join(', ')}`;
        error = new ErrorResponse(message, 400);
    }

    // Custom JWT errors (for invalid/expired tokens)
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid or malformed token.';
        error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired. Please log in again.';
        error = new ErrorResponse(message, 401);
    }

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File size too large. Maximum size is 5MB.';
        error = new ErrorResponse(message, 400);
    }

    if (err.message && err.message.includes('Only image files are allowed')) {
        const message = 'Only image files are allowed.';
        error = new ErrorResponse(message, 400);
    }

    // Send the structured error response (only if response hasn't been sent)
    if (!res.headersSent) {
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Server Error'
        });
    }
};

module.exports = errorHandler;