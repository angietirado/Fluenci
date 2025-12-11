// backend/controllers/transactionController.js

const asyncHandler = require('../middleware/async');
const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all transactions for a user
 * @route   GET /api/v1/transactions
 * @access  Private
 */
exports.getTransactions = asyncHandler(async (req, res, next) => {
    // We already fetch activities in dataController, but this provides full access
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
    });
});

/**
 * @desc    Create new transaction
 * @route   POST /api/v1/transactions
 * @access  Private
 */
exports.addTransaction = asyncHandler(async (req, res, next) => {
    // Add the user ID from the protected request (req.user is set by auth middleware)
    req.body.user = req.user.id; 

    // Create the transaction
    const transaction = await Transaction.create(req.body);

    res.status(201).json({
        success: true,
        data: transaction
    });
});

/**
 * @desc    Update transaction
 * @route   PUT /api/v1/transactions/:id
 * @access  Private
 */
exports.updateTransaction = asyncHandler(async (req, res, next) => {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        return next(
            new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
        );
    }

    // Security Check: Make sure user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
        return next(
            new ErrorResponse(`User not authorized to update this transaction`, 401)
        );
    }

    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: transaction
    });
});


/**
 * @desc    Delete transaction
 * @route   DELETE /api/v1/transactions/:id
 * @access  Private
 */
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        return next(
            new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
        );
    }

    // Security Check: Make sure user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
        return next(
            new ErrorResponse(`User not authorized to delete this transaction`, 401)
        );
    }

    await transaction.deleteOne();

    res.status(200).json({
        success: true,
        data: {} // Return empty object for successful deletion
    });
});