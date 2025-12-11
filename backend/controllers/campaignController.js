const Campaign = require('../models/Campaign');
const User = require('../models/User'); // Required for future updates

/**
 * @desc Create a new campaign (Only for Businesses)
 * @route POST /api/campaigns
 * @access Private/Business
 */
exports.createCampaign = async (req, res) => {
    if (req.user.userType !== 'Business') {
        return res.status(403).json({ status: 'fail', message: 'Only businesses can create campaigns.' });
    }

    try {
        const { title, description, type, compensation, location, nicheRequired } = req.body;

        const newCampaign = await Campaign.create({
            business: req.user.id,
            title,
            description,
            type,
            compensation,
            location,
            nicheRequired: Array.isArray(nicheRequired) ? nicheRequired : (nicheRequired ? nicheRequired.split(',').map(n => n.trim()) : []),
            status: 'Open'
        });

        res.status(201).json({ status: 'success', data: { campaign: newCampaign } });

    } catch (err) {
        console.error("Campaign creation error:", err);
        res.status(400).json({ status: 'fail', message: 'Invalid data provided for campaign creation.' });
    }
};

/**
 * @desc Get all open campaigns (For Influencer Discovery)
 * @route GET /api/campaigns
 * @access Private/Influencer
 */
exports.getAllCampaigns = async (req, res) => {
    try {
        // Find campaigns that are 'Open' and populate the business details
        const campaigns = await Campaign.find({ status: 'Open' }).populate('business', 'name profilePicture location businessCategory');

        res.status(200).json({ status: 'success', results: campaigns.length, data: { campaigns } });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch campaigns.' });
    }
};

/**
 * @desc Get a single campaign by ID
 * @route GET /api/campaigns/:id
 * @access Private
 */
exports.getCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('business', 'name profilePicture location businessCategory');
        
        if (!campaign) {
            return res.status(404).json({ status: 'fail', message: 'No campaign found with that ID.' });
        }

        res.status(200).json({ status: 'success', data: { campaign } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch campaign.' });
    }
};

/**
 * @desc Get all campaigns created by the logged-in Business, including applicants
 * @route GET /api/campaigns/my-campaigns
 * @access Private/Business
 */
exports.getBusinessCampaigns = async (req, res) => {
    if (req.user.userType !== 'Business') {
        return res.status(403).json({ status: 'fail', message: 'Only businesses can view their posted campaigns.' });
    }

    try {
        const campaigns = await Campaign.find({ business: req.user.id })
            .populate({
                path: 'applications',
                select: 'name profilePicture location followerCount engagementRate socialLinks niche'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', results: campaigns.length, data: { campaigns } });

    } catch (err) {
        console.error("Error fetching business campaigns:", err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch your campaigns.' });
    }
};

/**
 * @desc Influencer applies to a specific campaign
 * @route POST /api/campaigns/:id/apply
 * @access Private/Influencer
 */
exports.applyToCampaign = async (req, res) => {
    if (req.user.userType !== 'Influencer') {
        return res.status(403).json({ status: 'fail', message: 'Only influencers can apply to campaigns.' });
    }

    try {
        const campaignId = req.params.id;
        const influencerId = req.user.id;

        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ status: 'fail', message: 'No campaign found with that ID.' });
        }

        if (campaign.applications.includes(influencerId)) {
            return res.status(409).json({ status: 'fail', message: 'You have already applied to this campaign.' });
        }

        campaign.applications.push(influencerId);
        await campaign.save({ validateBeforeSave: false });

        res.status(200).json({ status: 'success', message: 'Application submitted successfully!', data: { campaign } });

    } catch (err) {
        console.error("Application error:", err);
        res.status(500).json({ status: 'error', message: 'Failed to process application.' });
    }
};