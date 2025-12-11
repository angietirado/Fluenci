const express = require('express');
const { protect } = require('../middleware/auth');
const { getConversations, getMessages, sendMessage, startChat, deleteMessage } = require('../controllers/messageController');

const router = express.Router();

router.use(protect); 

router.route('/conversations').get(getConversations);
router.route('/start-chat/:recipientId').post(startChat);
router.route('/:conversationId/:messageId').delete(deleteMessage); // Must come before /:conversationId

router.route('/:conversationId')
    .get(getMessages)
    .post(sendMessage);

module.exports = router;