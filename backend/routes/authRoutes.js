const express = require('express');
// Import the new protect middleware
const { protect } = require('../middleware/auth'); 
// Import both login, register, getMe, forgotPassword, and resetPassword functions
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/authController'); 

const router = express.Router();

router.post('/register', register);
router.post('/login', login); 
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// The 'protect' function runs first. If it succeeds, 'getMe' runs.
router.get('/me', protect, getMe); 

module.exports = router;