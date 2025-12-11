// backend/models/Transaction.js

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    // Link the transaction to a specific user
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    // Description of the activity (e.g., 'Groceries', 'Salary Deposit')
    description: {
        type: String,
        trim: true,
        required: [true, 'Please add a description']
    },
    // Type of transaction (e.g., 'expense', 'income')
    type: {
        type: String,
        enum: ['expense', 'income'],
        default: 'expense'
    },
    // The amount of the transaction
    amount: {
        type: Number,
        required: [true, 'Please add a positive or negative number']
    },
    // Date of the transaction
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);