const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * @desc Get a list of all conversations for the logged-in user
 * @route GET /api/messages/conversations
 * @access Private
 */
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ 
            participants: req.user.id 
        })
        .populate('participants', 'name profilePicture role')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'name _id'
            }
        })
        .sort({ updatedAt: -1 });

        res.status(200).json({ status: 'success', results: conversations.length, data: { conversations } });

    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch conversations.' });
    }
};

/**
 * @desc Get all messages for a specific conversation
 * @route GET /api/messages/:conversationId
 * @access Private
 */
exports.getMessages = async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ status: 'fail', message: 'Not authorized to view this conversation.' });
        }

        const messages = await Message.find({ conversationId })
            .populate('sender', 'name _id')
            .sort({ createdAt: 1 });

        res.status(200).json({ status: 'success', data: { messages } });

    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch messages.' });
    }
};

/**
 * @desc Send a new message (NON-REALTIME version)
 * @route POST /api/messages/:conversationId
 * @access Private
 */
exports.sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const conversationId = req.params.conversationId;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ status: 'fail', message: 'Not authorized to send to this conversation.' });
        }
        
        const newMessage = await Message.create({
            conversationId,
            sender: req.user.id,
            content
        });

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        res.status(201).json({ status: 'success', data: { message: newMessage } });

    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ status: 'error', message: 'Failed to send message.' });
    }
};

/**
 * @desc Delete a message (only sender can delete their own messages)
 * @route DELETE /api/messages/:conversationId/:messageId
 * @access Private
 */
exports.deleteMessage = async (req, res) => {
    try {
        const { conversationId, messageId } = req.params;
        
        // Find the message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ status: 'fail', message: 'Message not found.' });
        }
        
        // Verify the message belongs to the conversation
        if (message.conversationId.toString() !== conversationId) {
            return res.status(400).json({ status: 'fail', message: 'Message does not belong to this conversation.' });
        }
        
        // Only the sender can delete their own message
        if (message.sender.toString() !== req.user.id.toString()) {
            return res.status(403).json({ status: 'fail', message: 'You can only delete your own messages.' });
        }
        
        // Check if this is the last message in the conversation
        const conversation = await Conversation.findById(conversationId);
        const isLastMessage = conversation.lastMessage && conversation.lastMessage.toString() === messageId;
        
        // Delete the message
        await Message.findByIdAndDelete(messageId);
        
        // If it was the last message, update conversation's lastMessage to the previous message
        if (isLastMessage) {
            const previousMessage = await Message.findOne({ conversationId })
                .sort({ createdAt: -1 })
                .limit(1);
            
            conversation.lastMessage = previousMessage ? previousMessage._id : null;
            await conversation.save();
        }
        
        res.status(200).json({ 
            status: 'success', 
            message: 'Message deleted successfully.',
            data: { 
                deletedMessageId: messageId,
                newLastMessage: conversation.lastMessage 
            }
        });
        
    } catch (err) {
        console.error("Error deleting message:", err);
        res.status(500).json({ status: 'error', message: 'Failed to delete message.' });
    }
};

/**
 * @desc Initiates a chat when a business accepts an influencer application.
 * @route POST /api/messages/start-chat/:recipientId
 * @access Private
 */
exports.startChat = async (req, res) => {
    try {
        const senderId = req.user.id;
        const recipientId = req.params.recipientId;

        // Check if a conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        if (conversation) {
            return res.status(200).json({ status: 'success', message: 'Conversation already exists.', data: { conversation } });
        }
        
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ status: 'fail', message: 'Recipient user not found.' });
        }

        // Create a new conversation
        conversation = await Conversation.create({
            participants: [senderId, recipientId]
        });

        res.status(201).json({ status: 'success', message: 'New conversation started.', data: { conversation } });

    } catch (err) {
        console.error("Error starting chat:", err);
        res.status(500).json({ status: 'error', message: 'Failed to start chat.' });
    }
};