const express = require('express');
const { protect } = require('../middleware/auth');
const { createCampaign, getAllCampaigns, getCampaign, applyToCampaign, getBusinessCampaigns } = require('../controllers/campaignController');

const router = express.Router();

router.use(protect);

router.get('/my-campaigns', getBusinessCampaigns);

router.route('/')
    .post(createCampaign)
    .get(getAllCampaigns);

router.route('/:id')
    .get(getCampaign);

router.route('/:id/apply')
    .post(applyToCampaign);

module.exports = router;