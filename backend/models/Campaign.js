const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'A campaign must have a title.'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'A campaign must have a description.']
    },
    type: {
        type: String,
        enum: ['Paid Post', 'Free Product', 'Affiliate', 'Trade'],
        required: true
    },
    compensation: {
        type: String,
        required: [true, 'Please specify the compensation details.']
    },
    location: {
        type: String,
        required: true
    },
    nicheRequired: [String],

    // Status tracking
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Completed', 'Closed'],
        default: 'Open'
    },
    
    // Application tracking
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Selected influencer
    activeInfluencer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
}, { timestamps: true });

module.exports = mongoose.model('Campaign', CampaignSchema);