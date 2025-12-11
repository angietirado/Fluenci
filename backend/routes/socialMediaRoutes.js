const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    initiateConnection,
    handleCallback,
    handleFacebookSDKCallback,
    completeConnection,
    disconnectAccount,
    getConnections,
    refreshFollowers
} = require('../controllers/socialMediaController');

// Public callback route (no auth required for OAuth redirect)
router.get('/callback/:platform', handleCallback);

// Protected routes
router.use(protect);

router.get('/connect/:platform', initiateConnection);
router.post('/callback/facebook-sdk', handleFacebookSDKCallback);
router.post('/complete/:platform', completeConnection);
router.delete('/disconnect/:platform', disconnectAccount);
router.get('/connections', getConnections);
router.post('/refresh-followers', refreshFollowers);

module.exports = router;

