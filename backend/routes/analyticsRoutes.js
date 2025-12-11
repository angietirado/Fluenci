const express = require('express');
const { protect } = require('../middleware/auth');
const { getDashboardAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.use(protect);

router.route('/dashboard')
    .get(getDashboardAnalytics);

module.exports = router;