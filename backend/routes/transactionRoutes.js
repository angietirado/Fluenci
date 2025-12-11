// backend/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getTransactions, 
    addTransaction,
    updateTransaction,
    deleteTransaction 
} = require('../controllers/transactionController');

// Apply 'protect' to all routes in this router
router.use(protect);

router
    .route('/')
    .get(getTransactions) // GET /api/v1/transactions
    .post(addTransaction); // POST /api/v1/transactions

router
    .route('/:id')
    .put(updateTransaction) // PUT /api/v1/transactions/:id
    .delete(deleteTransaction); // DELETE /api/v1/transactions/:id

module.exports = router;