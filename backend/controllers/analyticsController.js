const Campaign = require('../models/Campaign');
const Review = require('../models/Review');
// const User = require('../models/User'); // Not strictly needed here, but helpful for user context

/**
 * MOCK DATA FUNCTION: Generates realistic mock campaign data for visualization.
 */
const generateMockCampaignData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
        month: month,
        reach: Math.floor(Math.random() * 5000) + 1000,
        engagement: Math.floor(Math.random() * 100) + 20,
        spend: Math.floor(Math.random() * 500) + 50
    }));
};

/**
 * @desc Get aggregated analytics data for the logged-in user
 * @route GET /api/analytics/dashboard
 * @access Private
 */
exports.getDashboardAnalytics = async (req, res) => {
    const userId = req.user.id;
    const userType = req.user.userType;

    try {
        let metrics = {
            userType: userType,
            totalCollaborations: 0,
            averageRating: 0,
            campaignData: generateMockCampaignData()
        };

        if (userType === 'Business') {
            metrics.totalCollaborations = await Campaign.countDocuments({ business: userId, status: 'Completed' });

            const reviewStats = await Review.aggregate([
                { $match: { reviewedUser: userId } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ]);
            metrics.averageRating = reviewStats.length > 0 ? parseFloat(reviewStats[0].avgRating.toFixed(2)) : 0;
            
            metrics.ROI_Estimate = `${Math.floor(Math.random() * 200) + 50}%`; 
            metrics.totalSpend = metrics.campaignData.reduce((sum, data) => sum + data.spend, 0);

        } else if (userType === 'Influencer') {
            metrics.totalCollaborations = await Campaign.countDocuments({ activeInfluencer: userId, status: 'Completed' });

            const reviewStats = await Review.aggregate([
                { $match: { reviewedUser: userId } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ]);
            metrics.averageRating = reviewStats.length > 0 ? parseFloat(reviewStats[0].avgRating.toFixed(2)) : 0;

            metrics.totalReach = metrics.campaignData.reduce((sum, data) => sum + data.reach, 0);
            metrics.averageEngagement = `${(metrics.campaignData.reduce((sum, data) => sum + data.engagement, 0) / metrics.campaignData.length).toFixed(2)}%`;
        }

        res.status(200).json({ status: 'success', data: { metrics } });

    } catch (err) {
        console.error("Analytics fetch error:", err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch analytics data.' });
    }
};