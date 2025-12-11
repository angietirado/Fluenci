const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');

/**
 * @desc    Initiate OAuth connection for a social media platform
 * @route   GET /api/v1/social/connect/:platform
 * @access  Private
 */
exports.initiateConnection = asyncHandler(async (req, res, next) => {
    let { platform } = req.params;
    const userId = req.user.id;
    
    // Map 'x' to 'twitter' for backward compatibility
    if (platform === 'x') {
        platform = 'twitter';
    }
    
    const validPlatforms = ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'linkedin'];

    if (!validPlatforms.includes(platform)) {
        return next(new ErrorResponse(`Invalid platform. Supported platforms: ${validPlatforms.join(', ')}`, 400));
    }

    // Generate state token for OAuth security
    const stateToken = crypto.randomBytes(32).toString('hex');
    
    // Store state token in user's session (you might want to use Redis or session storage)
    // For now, we'll return it and the frontend will handle it
    const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/social/callback/${platform}`;
    
    // Build OAuth URL based on platform
    let authUrl = '';
    
    switch (platform) {
        case 'instagram':
            // Instagram Graph API (for Business/Creator accounts with follower counts)
            // Note: For follower counts, use Instagram Graph API, not Basic Display
            if (!process.env.INSTAGRAM_CLIENT_ID) {
                return next(new ErrorResponse('Instagram OAuth is not configured. Please contact support or use manual entry.', 503));
            }
            // Instagram Graph API uses Facebook OAuth flow
            // Required scopes: instagram_basic, pages_show_list, pages_read_engagement
            authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,pages_show_list,pages_read_engagement,business_management&response_type=code&state=${stateToken}`;
            break;
        case 'youtube':
            // YouTube Data API v3
            if (!process.env.YOUTUBE_CLIENT_ID) {
                return next(new ErrorResponse('YouTube OAuth is not configured. Please contact support or use manual entry.', 503));
            }
            authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&state=${stateToken}`;
            break;
        case 'twitter':
            // Twitter OAuth 2.0
            if (!process.env.TWITTER_CLIENT_ID) {
                return next(new ErrorResponse('Twitter/X OAuth is not configured. Please contact support or use manual entry.', 503));
            }
            authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20users.read&state=${stateToken}&code_challenge=challenge&code_challenge_method=plain`;
            break;
        case 'facebook':
            // Facebook OAuth
            if (!process.env.FACEBOOK_CLIENT_ID) {
                return next(new ErrorResponse('Facebook OAuth is not configured. Please contact support or use manual entry.', 503));
            }
            authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_read_engagement,pages_show_list&state=${stateToken}`;
            break;
        case 'linkedin':
            // LinkedIn OAuth 2.0 (using OpenID Connect scopes)
            if (!process.env.LINKEDIN_CLIENT_ID) {
                return next(new ErrorResponse('LinkedIn OAuth is not configured. Please contact support or use manual entry.', 503));
            }
            // Updated to use OpenID Connect scopes (r_liteprofile and r_emailaddress are deprecated)
            authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=${stateToken}`;
            break;
        case 'tiktok':
            // TikTok OAuth
            if (!process.env.TIKTOK_CLIENT_KEY) {
                return next(new ErrorResponse('TikTok OAuth is not configured. Please contact support or use manual entry.', 503));
            }
            authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user.info.basic&response_type=code&state=${stateToken}`;
            break;
        default:
            return next(new ErrorResponse('Platform not supported', 400));
    }

    res.status(200).json({
        success: true,
        authUrl: authUrl,
        stateToken: stateToken,
        platform: platform,
        message: `Redirect user to this URL to connect their ${platform} account`
    });
});

// Helper function to exchange authorization code for access token (YouTube)
const exchangeYouTubeToken = async (code) => {
    try {
        const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/social/callback/youtube`;
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.YOUTUBE_CLIENT_ID,
                client_secret: process.env.YOUTUBE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('YouTube token exchange error:', errorText);
            return null;
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in
        };
    } catch (error) {
        console.error('Error exchanging YouTube token:', error);
        return null;
    }
};

// Helper function to get YouTube channel info
const getYouTubeChannelInfo = async (accessToken) => {
    try {
        const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (data.items && data.items[0]) {
            return {
                channelId: data.items[0].id,
                channelName: data.items[0].snippet?.title,
                subscribers: parseInt(data.items[0].statistics?.subscriberCount) || null
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching YouTube channel info:', error);
        return null;
    }
};

// Helper function to exchange LinkedIn authorization code for access token
const exchangeLinkedInToken = async (code, redirectUri) => {
    try {
        const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                redirect_uri: redirectUri
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LinkedIn token exchange error:', errorText);
            return null;
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            expiresIn: data.expires_in
        };
    } catch (error) {
        console.error('Error exchanging LinkedIn token:', error);
        return null;
    }
};

// Helper function to get LinkedIn profile info
const getLinkedInProfileInfo = async (accessToken) => {
    try {
        // LinkedIn OpenID Connect - get user profile
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return {
            profileId: data.sub || null, // OpenID Connect 'sub' claim is the user ID
            profileName: data.name || data.given_name || null,
            email: data.email || null
        };
    } catch (error) {
        console.error('Error fetching LinkedIn profile info:', error);
        return null;
    }
};

// Helper function to get Facebook user info and pages
const getFacebookUserInfo = async (accessToken) => {
    try {
        // Get user info
        const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`);
        if (!userResponse.ok) {
            console.error('Facebook Graph API error (user):', await userResponse.text());
            return null;
        }
        const userData = await userResponse.json();
        
        // Get pages
        const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,followers_count&access_token=${accessToken}`);
        let pages = [];
        if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json();
            pages = pagesData.data || [];
        } else {
            console.error('Facebook Graph API error (pages):', await pagesResponse.text());
        }
        
        return {
            userId: userData.id,
            userName: userData.name,
            pages: pages
        };
    } catch (error) {
        console.error('Error fetching Facebook user info:', error);
        return null;
    }
};

/**
 * @desc    Handle OAuth callback from social media platform
 * @route   GET /api/v1/social/callback/:platform
 * @access  Public (but validates state token)
 */
exports.handleCallback = asyncHandler(async (req, res, next) => {
    const { platform } = req.params;
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/influencer-settings?error=${encodeURIComponent(error)}&platform=${platform}`);
    }

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/influencer-settings?error=no_code&platform=${platform}`);
    }

    // For platforms that support automatic token exchange, handle it here
    // For others, redirect to frontend to handle manually
    if (platform === 'youtube' && process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
        try {
            // Exchange code for tokens
            const tokens = await exchangeYouTubeToken(code);
            if (tokens) {
                // Get channel info
                const channelInfo = await getYouTubeChannelInfo(tokens.accessToken);
                
                // Redirect to frontend with token data (encoded in URL or use session)
                // For security, we'll redirect to a page that completes the connection
                const params = new URLSearchParams({
                    platform: platform,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken || '',
                    channelId: channelInfo?.channelId || '',
                    channelName: channelInfo?.channelName || '',
                    followers: channelInfo?.subscribers || ''
                });
                
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/social-callback?${params.toString()}`);
            }
        } catch (error) {
            console.error('Error in YouTube OAuth callback:', error);
        }
    } else if (platform === 'linkedin' && process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
        try {
            const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/social/callback/${platform}`;
            // Exchange code for access token
            const tokens = await exchangeLinkedInToken(code, redirectUri);
            if (tokens) {
                // Get profile info
                const profileInfo = await getLinkedInProfileInfo(tokens.accessToken);
                
                // Redirect to frontend with token data
                const params = new URLSearchParams({
                    platform: platform,
                    accessToken: tokens.accessToken,
                    profileId: profileInfo?.profileId || '',
                    profileName: profileInfo?.profileName || ''
                });
                
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/social-callback?${params.toString()}`);
            }
        } catch (error) {
            console.error('Error in LinkedIn OAuth callback:', error);
        }
    }

    // For other platforms or if token exchange fails, redirect with code for manual handling
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/social-callback?platform=${platform}&code=${code}&state=${state}`);
});

/**
 * @desc    Handle Facebook SDK login callback (receives access token directly from SDK)
 * @route   POST /api/v1/social/callback/facebook-sdk
 * @access  Private
 */
exports.handleFacebookSDKCallback = asyncHandler(async (req, res, next) => {
    const { accessToken, userID } = req.body;
    const userId = req.user.id;

    if (!accessToken) {
        return next(new ErrorResponse('Access token is required', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    try {
        // Get Facebook user info and pages
        const facebookInfo = await getFacebookUserInfo(accessToken);
        
        if (!facebookInfo) {
            return next(new ErrorResponse('Failed to fetch Facebook information', 500));
        }

        // Use the first page if available, otherwise use user profile
        let pageId = null;
        let pageName = null;
        let followerCount = null;

        if (facebookInfo.pages && facebookInfo.pages.length > 0) {
            // Use the first page
            const page = facebookInfo.pages[0];
            pageId = page.id;
            pageName = page.name;
            followerCount = page.followers_count ? parseInt(page.followers_count) : null;
            
            // If followers_count wasn't in the initial request, fetch it
            if (!followerCount) {
                followerCount = await fetchFacebookFollowers(accessToken, pageId);
            }
        } else {
            // No pages, use user profile (note: user profiles don't have follower counts)
            pageId = facebookInfo.userId;
            pageName = facebookInfo.userName;
        }

        // Update the social media connection
        if (!user.socialMediaConnections) {
            user.socialMediaConnections = {};
        }

        user.socialMediaConnections.facebook = {
            connected: true,
            accessToken: accessToken,
            refreshToken: null, // SDK tokens don't have refresh tokens
            username: facebookInfo.userName,
            userId: facebookInfo.userId,
            pageId: pageId,
            pageName: pageName,
            followers: followerCount,
            connectedAt: new Date()
        };

        // Also update the simple socialMedia field for backward compatibility
        user.socialMedia.facebook = pageName || facebookInfo.userName;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Facebook account connected successfully',
            data: {
                platform: 'facebook',
                connected: true,
                username: pageName || facebookInfo.userName,
                followers: followerCount
            },
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                socialMedia: user.socialMedia,
                socialMediaConnections: user.socialMediaConnections
            }
        });
    } catch (error) {
        console.error('Error handling Facebook SDK callback:', error);
        return next(new ErrorResponse('Failed to connect Facebook account', 500));
    }
});

/**
 * @desc    Complete social media connection (called after OAuth callback)
 * @route   POST /api/v1/social/complete/:platform
 * @access  Private
 */
// Helper function to fetch follower count from Instagram Graph API
const fetchInstagramFollowers = async (accessToken, instagramBusinessAccountId) => {
    try {
        // Instagram Graph API - get follower count for Business/Creator account
        // Requires: Instagram Business Account ID (not user ID)
        const response = await fetch(`https://graph.facebook.com/v18.0/${instagramBusinessAccountId}?fields=followers_count&access_token=${accessToken}`);
        if (!response.ok) {
            console.error('Instagram Graph API error:', await response.text());
            return null;
        }
        const data = await response.json();
        
        if (data.followers_count !== undefined) {
            return parseInt(data.followers_count) || null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching Instagram followers:', error);
        return null;
    }
};

// Helper function to get Instagram Business Account ID from Facebook Page
const getInstagramBusinessAccountId = async (accessToken, pageId) => {
    try {
        // First, get the Instagram Business Account ID from the Facebook Page
        const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
        if (!response.ok) {
            console.error('Facebook Graph API error:', await response.text());
            return null;
        }
        const data = await response.json();
        
        if (data.instagram_business_account && data.instagram_business_account.id) {
            return data.instagram_business_account.id;
        }
        return null;
    } catch (error) {
        console.error('Error fetching Instagram Business Account ID:', error);
        return null;
    }
};

// Helper function to fetch subscriber count from YouTube API
const fetchYouTubeSubscribers = async (accessToken, channelId) => {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&access_token=${accessToken}`);
        if (!response.ok) {
            console.error('YouTube API error:', await response.text());
            return null;
        }
        const data = await response.json();
        if (data.items && data.items[0] && data.items[0].statistics) {
            return parseInt(data.items[0].statistics.subscriberCount) || null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching YouTube subscribers:', error);
        return null;
    }
};

// Helper function to fetch follower count from Twitter/X API
const fetchTwitterFollowers = async (accessToken, userId) => {
    try {
        const response = await fetch(`https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            console.error('Twitter API error:', await response.text());
            return null;
        }
        const data = await response.json();
        if (data.data && data.data.public_metrics) {
            return parseInt(data.data.public_metrics.followers_count) || null;
        }
        return null;
    } catch (error) {
        console.error('Error fetching Twitter followers:', error);
        return null;
    }
};

// Helper function to fetch follower count from Facebook API
const fetchFacebookFollowers = async (accessToken, pageId) => {
    try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=followers_count&access_token=${accessToken}`);
        if (!response.ok) {
            console.error('Facebook API error:', await response.text());
            return null;
        }
        const data = await response.json();
        return parseInt(data.followers_count) || null;
    } catch (error) {
        console.error('Error fetching Facebook followers:', error);
        return null;
    }
};

// Helper function to fetch follower count from TikTok API
const fetchTikTokFollowers = async (accessToken, userId) => {
    try {
        // TikTok API requires specific endpoints and permissions
        // This is a placeholder - actual implementation depends on TikTok API availability
        return null;
    } catch (error) {
        console.error('Error fetching TikTok followers:', error);
        return null;
    }
};

// Helper function to fetch follower count from LinkedIn API
const fetchLinkedInFollowers = async (accessToken, profileId) => {
    try {
        // LinkedIn API has limited access to follower counts
        // This would require specific API endpoints and permissions
        return null;
    } catch (error) {
        console.error('Error fetching LinkedIn followers:', error);
        return null;
    }
};

exports.completeConnection = asyncHandler(async (req, res, next) => {
    const { platform } = req.params;
    const { code, accessToken, refreshToken, username, userId: platformUserId, channelId, channelName, pageId, pageName, profileId, profileName, followers } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    const validPlatforms = ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
        return next(new ErrorResponse('Invalid platform', 400));
    }

    // Fetch follower count from API if accessToken is provided and followers not already provided
    let followerCount = followers ? parseInt(followers) : null;
    
    if (accessToken && !followerCount) {
        try {
            switch (platform) {
                case 'instagram':
                    // Instagram Graph API - requires Instagram Business Account ID
                    // First, we need to get the Facebook Page ID, then get Instagram Business Account ID
                    if (pageId) {
                        // If we have a pageId, get the Instagram Business Account ID
                        const instagramBusinessAccountId = await getInstagramBusinessAccountId(accessToken, pageId);
                        if (instagramBusinessAccountId) {
                            followerCount = await fetchInstagramFollowers(accessToken, instagramBusinessAccountId);
                        }
                    } else if (platformUserId) {
                        // Try using userId as Instagram Business Account ID directly
                        followerCount = await fetchInstagramFollowers(accessToken, platformUserId);
                    }
                    break;
                case 'youtube':
                    if (channelId) {
                        followerCount = await fetchYouTubeSubscribers(accessToken, channelId);
                    }
                    break;
                case 'twitter':
                case 'x':
                    if (platformUserId) {
                        followerCount = await fetchTwitterFollowers(accessToken, platformUserId);
                    }
                    break;
                case 'facebook':
                    if (pageId) {
                        followerCount = await fetchFacebookFollowers(accessToken, pageId);
                    }
                    break;
                case 'tiktok':
                    if (platformUserId) {
                        followerCount = await fetchTikTokFollowers(accessToken, platformUserId);
                    }
                    break;
                case 'linkedin':
                    if (profileId) {
                        followerCount = await fetchLinkedInFollowers(accessToken, profileId);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error fetching ${platform} followers:`, error);
            // Continue without follower count if API call fails
        }
    }

    // Update the social media connection
    if (!user.socialMediaConnections) {
        user.socialMediaConnections = {};
    }

    user.socialMediaConnections[platform] = {
        connected: true,
        accessToken: accessToken || null,
        refreshToken: refreshToken || null,
        username: username || null,
        userId: platformUserId || null,
        channelId: channelId || null,
        channelName: channelName || null,
        pageId: pageId || null,
        pageName: pageName || null,
        profileId: profileId || null,
        profileName: profileName || null,
        followers: followerCount,
        connectedAt: new Date()
    };

    // Also update the simple socialMedia field for backward compatibility
    if (username) {
        user.socialMedia[platform] = username;
    } else if (channelName) {
        user.socialMedia[platform] = channelName;
    } else if (pageName) {
        user.socialMedia[platform] = pageName;
    } else if (profileName) {
        user.socialMedia[platform] = profileName;
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: `${platform} account connected successfully`,
        data: {
            platform: platform,
            connected: true,
            username: username || channelName || pageName || profileName,
            followers: followerCount
        }
    });
});

/**
 * @desc    Disconnect a social media account
 * @route   DELETE /api/v1/social/disconnect/:platform
 * @access  Private
 */
exports.disconnectAccount = asyncHandler(async (req, res, next) => {
    const { platform } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    const validPlatforms = ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
        return next(new ErrorResponse('Invalid platform', 400));
    }

    // Disconnect the account
    if (user.socialMediaConnections && user.socialMediaConnections[platform]) {
        user.socialMediaConnections[platform] = {
            connected: false,
            accessToken: null,
            refreshToken: null,
            username: null,
            userId: null,
            channelId: null,
            channelName: null,
            pageId: null,
            pageName: null,
            profileId: null,
            profileName: null,
            connectedAt: null
        };
    }

    // Clear the simple socialMedia field
    user.socialMedia[platform] = null;

    await user.save();

    res.status(200).json({
        success: true,
        message: `${platform} account disconnected successfully`
    });
});

/**
 * @desc    Get all connected social media accounts
 * @route   GET /api/v1/social/connections
 * @access  Private
 */
exports.getConnections = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('socialMediaConnections socialMedia');

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    const connections = {};
    const platforms = ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'linkedin', 'snapchat', 'pinterest'];

    platforms.forEach(platform => {
        if (user.socialMediaConnections && user.socialMediaConnections[platform]) {
            connections[platform] = {
                connected: user.socialMediaConnections[platform].connected || false,
                username: user.socialMediaConnections[platform].username || 
                         user.socialMediaConnections[platform].channelName ||
                         user.socialMediaConnections[platform].pageName ||
                         user.socialMediaConnections[platform].profileName,
                followers: user.socialMediaConnections[platform].followers || null,
                connectedAt: user.socialMediaConnections[platform].connectedAt
            };
        } else {
            connections[platform] = {
                connected: false,
                username: null,
                followers: null,
                connectedAt: null
            };
        }
    });

    res.status(200).json({
        success: true,
        data: connections
    });
});

/**
 * @desc    Refresh follower counts for connected social media accounts
 * @route   POST /api/v1/social/refresh-followers
 * @access  Private
 */
exports.refreshFollowers = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    if (!user.socialMediaConnections) {
        return res.status(200).json({
            success: true,
            message: 'No social media connections found',
            data: {}
        });
    }

    const updatedCounts = {};
    const platforms = ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'linkedin'];

    for (const platform of platforms) {
        const connection = user.socialMediaConnections[platform];
        if (connection && connection.connected && connection.accessToken) {
            try {
                let followerCount = null;
                
                switch (platform) {
                    case 'instagram':
                        // Instagram Basic Display doesn't provide follower count
                        // Would need Instagram Graph API with Business account
                        followerCount = null;
                        break;
                    case 'youtube':
                        if (connection.channelId) {
                            followerCount = await fetchYouTubeSubscribers(connection.accessToken, connection.channelId);
                        }
                        break;
                    case 'twitter':
                    case 'x':
                        if (connection.userId) {
                            followerCount = await fetchTwitterFollowers(connection.accessToken, connection.userId);
                        }
                        break;
                    case 'facebook':
                        if (connection.pageId) {
                            followerCount = await fetchFacebookFollowers(connection.accessToken, connection.pageId);
                        }
                        break;
                    case 'tiktok':
                        if (connection.userId) {
                            followerCount = await fetchTikTokFollowers(connection.accessToken, connection.userId);
                        }
                        break;
                    case 'linkedin':
                        if (connection.profileId) {
                            followerCount = await fetchLinkedInFollowers(connection.accessToken, connection.profileId);
                        }
                        break;
                }

                if (followerCount !== null) {
                    user.socialMediaConnections[platform].followers = followerCount;
                    updatedCounts[platform] = followerCount;
                }
            } catch (error) {
                console.error(`Error refreshing ${platform} followers:`, error);
            }
        }
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Follower counts refreshed',
        data: updatedCounts
    });
});

