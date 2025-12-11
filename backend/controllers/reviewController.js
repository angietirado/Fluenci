const Review = require('../models/Review');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

/**
 * @desc Create a new review for a completed campaign
 * @route POST /api/reviews
 * @access Private
 */
exports.createReview = async (req, res) => {
    try {
        const { reviewedUserId, campaignId, rating, comment } = req.body;
        
        if (!reviewedUserId || !campaignId || !rating || !comment) {
            return res.status(400).json({ status: 'fail', message: 'Missing required review fields.' });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
             return res.status(404).json({ status: 'fail', message: 'Campaign not found.' });
        }
        
        const reviewedUser = await User.findById(reviewedUserId);
        if (!reviewedUser) {
             return res.status(404).json({ status: 'fail', message: 'User being reviewed not found.' });
        }

        const isParticipant = (
            campaign.business.toString() === req.user.id.toString() ||
            campaign.activeInfluencer?.toString() === req.user.id.toString()
        );
        
        if (!isParticipant) {
             return res.status(403).json({ status: 'fail', message: 'You must be a participant in this collaboration to leave a review.' });
        }
        
        if (req.user.id.toString() === reviewedUserId.toString()) {
            return res.status(403).json({ status: 'fail', message: 'Cannot review yourself.' });
        }

        const newReview = await Review.create({
            reviewer: req.user.id,
            reviewedUser: reviewedUserId,
            campaign: campaignId,
            rating,
            comment,
            reviewedUserType: reviewedUser.userType
        });

        res.status(201).json({ status: 'success', data: { review: newReview } });

    } catch (err) {
        if (err.code === 11000) {
             return res.status(409).json({ status: 'fail', message: 'You have already reviewed this collaboration.' });
        }
        console.error("Review creation error:", err);
        res.status(400).json({ status: 'fail', message: err.message || 'Failed to create review.' });
    }
};

/**
 * @desc Get all reviews for a specific user
 * @route GET /api/reviews/:userId
 * @access Private
 */
exports.getReviewsForUser = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewedUser: req.params.userId })
            .populate('reviewer', 'name profilePicture userType')
            .populate('campaign', 'title');

        res.status(200).json({ status: 'success', results: reviews.length, data: { reviews } });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch reviews.' });
    }
};