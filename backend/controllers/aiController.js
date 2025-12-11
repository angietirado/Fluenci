const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Lazy load OpenAI - only load when needed
let OpenAI = null;
let openaiAvailable = false;

const loadOpenAI = () => {
    if (openaiAvailable === false && OpenAI === null) {
        try {
            OpenAI = require('openai');
            openaiAvailable = true;
        } catch (e) {
            openaiAvailable = false;
            OpenAI = null;
        }
    }
    return OpenAI;
};

/**
 * @desc    AI Chat endpoint - Answers questions about Fluenci
 * @route   POST /api/v1/ai/chat
 * @access  Private
 */
exports.chat = asyncHandler(async (req, res, next) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return next(new ErrorResponse('Please provide a message', 400));
    }

    // System prompt to guide the AI
    const systemPrompt = `You are Fluenci AI Assistant, a helpful assistant for the Fluenci platform. 
Fluenci is a platform that connects influencers with local businesses for collaboration opportunities.

Your role is to help users understand:
- How to use the Fluenci platform
- How to find and connect with businesses
- How campaigns work
- How to set up their profile
- How to use features like advanced search, messaging, etc.
- General questions about influencer marketing and business collaborations

IMPORTANT RULES:
- DO NOT answer questions about code, implementation details, or technical development
- DO NOT reveal how the platform was built or any technical architecture
- DO NOT provide code snippets or programming solutions
- Focus on user-facing features and how to use the platform
- Be friendly, helpful, and concise
- If asked about code or technical implementation, politely redirect to platform usage questions

Answer the user's question about Fluenci:`;

    try {
        // Check if OpenAI API key is configured and package is available
        let useOpenAI = false;
        
        // Try to load OpenAI lazily
        const OpenAIInstance = loadOpenAI();
        if (OpenAIInstance && process.env.OPENAI_API_KEY) {
            useOpenAI = true;
        }

        if (useOpenAI && OpenAIInstance && process.env.OPENAI_API_KEY) {
            try {
                const openai = new OpenAIInstance({
                    apiKey: process.env.OPENAI_API_KEY
                });

                // Use OpenAI API
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                });

                const aiResponse = completion.choices[0].message.content;

                return res.status(200).json({
                    success: true,
                    data: {
                        response: aiResponse
                    }
                });
            } catch (openaiError) {
                console.error('OpenAI API Error:', openaiError.message);
                // Fall through to knowledge-based response
            }
        }

        // Fallback: Use knowledge-based response system
        const response = getKnowledgeBasedResponse(message);
        
        return res.status(200).json({
            success: true,
            data: {
                response: response
            }
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        
        // Fallback to knowledge-based responses
        const response = getKnowledgeBasedResponse(message);
        
        return res.status(200).json({
            success: true,
            data: {
                response: response
            }
        });
    }
});

/**
 * Knowledge-based response system (fallback when OpenAI is not available)
 */
function getKnowledgeBasedResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! I'm Fluenci AI Assistant. I can help you with questions about using Fluenci, finding businesses, understanding campaigns, and more. What would you like to know?";
    }

    // Platform overview
    if (lowerMessage.includes('what is fluenci') || lowerMessage.includes('what is this platform') || lowerMessage.includes('tell me about fluenci')) {
        return "Fluenci is a platform that connects influencers with local businesses for collaboration opportunities. As an influencer, you can discover businesses looking for partnerships, view available campaigns, and connect directly with businesses. You can search for businesses by location, offers, and social media platforms, and apply to campaigns that match your interests.";
    }

    // How to find businesses
    if (lowerMessage.includes('find business') || lowerMessage.includes('search business') || lowerMessage.includes('discover business')) {
        return "To find businesses on Fluenci, you can use the search bar at the top to search by name or location. You can also use the Advanced Search panel (click the button in the top right) to filter businesses by offers, location, and social media platforms. The business cards will show you their logo, name, location, description, offers, and social media presence.";
    }

    // Advanced search
    if (lowerMessage.includes('advanced search') || lowerMessage.includes('filter') || lowerMessage.includes('search filter')) {
        return "The Advanced Search feature allows you to filter businesses by:\n- Offers: Search for specific types of compensation or deals\n- Location: Find businesses in specific cities or regions\n- Socials: Filter by social media platforms (Instagram, TikTok, YouTube, X, Snapchat, Facebook, Pinterest, LinkedIn)\n\nClick the 'Advanced Search' button in the top right corner of the header to open the filter panel.";
    }

    // Campaigns
    if (lowerMessage.includes('campaign') || lowerMessage.includes('apply') || lowerMessage.includes('opportunity')) {
        return "Campaigns are collaboration opportunities posted by businesses. Each campaign includes details like compensation, location, required niches, and description. When you find a campaign you're interested in, you can apply to it. If the business accepts your application, you'll be able to start a conversation with them through the messaging system.";
    }

    // Profile settings
    if (lowerMessage.includes('profile') || lowerMessage.includes('settings') || lowerMessage.includes('edit profile')) {
        return "To edit your profile, click on your profile picture in the top left corner and select 'Settings'. From there, you can update your profile picture, personal information, location, industry, and connect your social media accounts (Instagram, YouTube, TikTok, X, Facebook, LinkedIn, Snapchat, Pinterest).";
    }

    // Social media
    if (lowerMessage.includes('social media') || lowerMessage.includes('connect social') || lowerMessage.includes('instagram') || lowerMessage.includes('tiktok')) {
        return "You can connect your social media accounts in your profile settings. Click your profile picture → Settings, and you'll see options to connect accounts via OAuth or enter them manually. Supported platforms include Instagram, YouTube, TikTok, X (Twitter), Facebook, LinkedIn, Snapchat, and Pinterest.";
    }

    // Messaging
    if (lowerMessage.includes('message') || lowerMessage.includes('chat') || lowerMessage.includes('contact business')) {
        return "To message a business, you need to apply to one of their campaigns first. Once they accept your application, you can start a conversation with them. You can access your messages through the messaging feature in the platform.";
    }

    // Navigation
    if (lowerMessage.includes('navigate') || lowerMessage.includes('how to use') || lowerMessage.includes('get started')) {
        return "Here's how to get started on Fluenci:\n1. Complete your profile with your information and social media accounts\n2. Use the search bar or Advanced Search to find businesses\n3. Browse business cards to see available opportunities\n4. Apply to campaigns that interest you\n5. Once accepted, start messaging with businesses\n\nYou can also click your profile picture to change your picture or access settings.";
    }

    // Business cards
    if (lowerMessage.includes('business card') || lowerMessage.includes('card') || lowerMessage.includes('business listing')) {
        return "Business cards display key information about each business including their logo, name, location, description, available offers, and social media presence. You can navigate through businesses using the arrow buttons on either side. Each card shows you what the business offers and helps you decide if you want to connect with them.";
    }

    // Logout
    if (lowerMessage.includes('logout') || lowerMessage.includes('sign out') || lowerMessage.includes('log out')) {
        return "To logout, click on your profile picture in the top left corner and select 'Logout' from the dropdown menu. This will take you back to the Fluenci home page.";
    }

    // Profile picture
    if (lowerMessage.includes('change picture') || lowerMessage.includes('profile picture') || lowerMessage.includes('upload picture')) {
        return "To change your profile picture, click on your profile picture in the top left corner and select 'Change Picture' from the dropdown menu. You can upload a new image file (up to 5MB) and it will update immediately.";
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('how do i') || lowerMessage.includes('how can i')) {
        return "I'm here to help! You can ask me about:\n- How to use Fluenci\n- Finding and connecting with businesses\n- Understanding campaigns and opportunities\n- Setting up your profile\n- Using features like search and filters\n- Connecting social media accounts\n- Messaging businesses\n\nWhat would you like to know?";
    }

    // Default response
    return "I understand you're asking about: \"" + message + "\". I'm here to help with questions about using Fluenci, finding businesses, understanding campaigns, setting up your profile, and connecting with opportunities. Could you rephrase your question or ask about a specific feature? I don't provide information about code or technical implementation details.";
}

