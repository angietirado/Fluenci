const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    reviewedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true,
    },
    
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'A review must have a rating.']
    },
    
    comment: {
        type: String,
        trim: true,
        required: [true, 'A review must have a comment.']
    },
    
    reviewedUserType: {
        type: String,
        enum: ['Business', 'Influencer'],
        required: true
    }

}, { timestamps: true });

ReviewSchema.index({ reviewer: 1, campaign: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);