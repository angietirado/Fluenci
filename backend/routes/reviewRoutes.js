const express = require('express');
const { protect } = require('../middleware/auth');
const { createReview, getReviewsForUser } = require('../controllers/reviewController');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(createReview);

router.route('/:userId')
    .get(getReviewsForUser);

module.exports = router;