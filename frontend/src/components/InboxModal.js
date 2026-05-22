import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaEnvelope, FaPaperPlane, FaUser, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_URL, apiUrl } from '../config/api';

const API_BASE_URL = `${API_URL}/api/v1/messages`;

const InboxModal = ({ isOpen, onClose, user, token, initialRecipientId = null, initialRecipientName = null, onConversationRead = null }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [startingChat, setStartingChat] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState(null);
    const [activeTab, setActiveTab] = useState('unread'); // 'unread', 'read', 'sent' - default to 'unread' to show unread conversations first
    // Load read conversations from localStorage on mount
    // Format: { conversationId: lastReadMessageId }
    const loadReadConversations = () => {
        try {
            const stored = localStorage.getItem(`readConversations_${user?.id || user?._id}`);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    };
    
    const [readConversations, setReadConversations] = useState(() => loadReadConversations()); // Track which conversations have been read and their last read message ID
    
    // Save read conversations to localStorage whenever it changes
    useEffect(() => {
        if (user && Object.keys(readConversations).length > 0) {
            try {
                localStorage.setItem(`readConversations_${user.id || user._id}`, JSON.stringify(readConversations));
            } catch (e) {
                console.error('Error saving read conversations:', e);
            }
        } else if (user && Object.keys(readConversations).length === 0) {
            // Clear localStorage if no read conversations
            try {
                localStorage.removeItem(`readConversations_${user.id || user._id}`);
            } catch (e) {
                console.error('Error clearing read conversations:', e);
            }
        }
    }, [readConversations, user]);
    const messagesEndRef = useRef(null);

    const fetchConversations = useCallback(async () => {
        if (!token || !user) {
            console.log('Missing token or user:', { hasToken: !!token, hasUser: !!user });
            return;
        }
        try {
            setLoading(true);
            console.log('Fetching conversations from:', `${API_BASE_URL}/conversations`);
            const response = await axios.get(`${API_BASE_URL}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Conversations API response:', response.data);
            
            if (response.data.status === 'success') {
                const fetchedConversations = response.data.data.conversations || [];
                console.log('Raw fetched conversations:', fetchedConversations.length, fetchedConversations);
                
                // Filter out conversations where user is messaging themselves
                const filteredConversations = fetchedConversations.filter(conv => {
                    if (!conv.participants || conv.participants.length < 2) {
                        console.log('Filtered out - insufficient participants:', conv._id);
                        return false;
                    }
                    if (!user || (!user.id && !user._id)) {
                        console.log('Filtered out - no user ID', { user });
                        return false;
                    }
                    
                    const participantIds = conv.participants.map(p => {
                        const id = p._id || p;
                        return id ? String(id) : null;
                    }).filter(id => id !== null);
                    
                    // Get user ID - handle both id and _id formats
                    const userId = user.id ? String(user.id) : (user._id ? String(user._id) : null);
                    if (!userId) {
                        console.log('Filtered out - could not extract user ID', { user });
                        return false;
                    }
                    
                    // Check if user is a participant
                    const userIsParticipant = participantIds.some(pid => pid === userId);
                    
                    // Check if there are at least 2 different participants
                    const uniqueParticipants = new Set(participantIds);
                    const hasMultipleParticipants = uniqueParticipants.size >= 2;
                    
                    const shouldInclude = userIsParticipant && hasMultipleParticipants;
                    
                    if (!shouldInclude) {
                        console.log('Filtered out conversation:', {
                            convId: conv._id,
                            participantIds,
                            userId,
                            userIsParticipant,
                            hasMultipleParticipants
                        });
                    }
                    
                    return shouldInclude;
                });
                
                console.log('Filtered conversations:', filteredConversations.length, filteredConversations);
                
                // If filtering removed all conversations but we have fetched ones, use fallback
                if (filteredConversations.length === 0 && fetchedConversations.length > 0) {
                    console.warn('All conversations were filtered out! Using fallback filter.', {
                        fetchedCount: fetchedConversations.length,
                        userId: user.id || user._id,
                        userObject: user,
                        sampleConversation: fetchedConversations[0]
                    });
                    // Fallback: show all conversations that have the user as a participant
                    const fallbackConversations = fetchedConversations.filter(conv => {
                        if (!conv.participants || conv.participants.length === 0) return false;
                        const participantIds = conv.participants.map(p => String(p._id || p));
                        const userId = String(user.id || user._id);
                        return participantIds.includes(userId);
                });
                    const finalConversations = fallbackConversations.length > 0 ? fallbackConversations : fetchedConversations;
                    
                    // Check for new messages from other participants and mark conversations as unread
                    setReadConversations(prev => {
                        const updated = { ...prev };
                        let hasChanges = false;
                        
                        finalConversations.forEach(conv => {
                            if (!conv.lastMessage) return;
                            
                            const lastMessage = conv.lastMessage;
                            const lastMessageId = lastMessage._id || lastMessage.id;
                            const lastReadMessageId = prev[conv._id];
                            
                            // Check if last message is from the other participant (not current user)
                            let senderId = null;
                            const sender = lastMessage.sender;
                            
                            if (sender) {
                                if (typeof sender === 'object' && sender !== null) {
                                    senderId = sender._id || sender.id || sender.toString();
                                } else if (typeof sender === 'string') {
                                    senderId = sender;
                                }
                            }
                            
                            if (!senderId && lastMessage.senderId) {
                                senderId = lastMessage.senderId;
                            }
                            
                            const userId = user.id || user._id;
                            if (!senderId || !userId) return;
                            
                            const senderIdStr = String(senderId).trim();
                            const userIdStr = String(userId).trim();
                            const senderIdClean = senderIdStr.replace(/^ObjectId\(|\)$/g, '');
                            const userIdClean = userIdStr.replace(/^ObjectId\(|\)$/g, '');
                            
                            // If last message is from the other participant (not current user)
                            const isFromOtherParticipant = senderIdStr !== userIdStr && senderIdClean !== userIdClean;
                            
                            if (isFromOtherParticipant) {
                                // If this is a new message (different ID than what we last read), mark as unread
                                if (lastReadMessageId && lastMessageId && String(lastReadMessageId) !== String(lastMessageId)) {
                                    delete updated[conv._id];
                                    hasChanges = true;
                                    console.log('New message from other participant, marking conversation as unread:', conv._id);
                                } else if (!lastReadMessageId && lastMessageId) {
                                    // Conversation was never read, or message ID changed
                                    delete updated[conv._id];
                                    hasChanges = true;
                                }
                            }
                        });
                        
                        return hasChanges ? updated : prev;
                    });
                    
                    setConversations(finalConversations);
                    
                    // If we have an initial recipient, find and select the conversation
                    if (initialRecipientId && finalConversations.length > 0 && user && (user.id || user._id)) {
                        const recipientIdStr = String(initialRecipientId);
                        const userIdStr = user.id ? String(user.id) : String(user._id);
                        
                        const conversation = finalConversations.find(conv => {
                            if (!conv.participants) return false;
                            const participantIds = conv.participants.map(p => {
                                const id = p._id || p;
                                return id ? String(id) : null;
                            }).filter(id => id !== null);
                            return participantIds.includes(recipientIdStr) && participantIds.includes(userIdStr);
                        });
                        if (conversation) {
                            setSelectedConversation(conversation);
                        }
                    }
                } else {
                    // Check for new messages from other participants and mark conversations as unread
                    setReadConversations(prev => {
                        const updated = { ...prev };
                        let hasChanges = false;
                        
                        filteredConversations.forEach(conv => {
                            if (!conv.lastMessage) return;
                            
                            const lastMessage = conv.lastMessage;
                            const lastMessageId = lastMessage._id || lastMessage.id;
                            const lastReadMessageId = prev[conv._id];
                            
                            // Check if last message is from the other participant (not current user)
                            let senderId = null;
                            const sender = lastMessage.sender;
                            
                            if (sender) {
                                if (typeof sender === 'object' && sender !== null) {
                                    senderId = sender._id || sender.id || sender.toString();
                                } else if (typeof sender === 'string') {
                                    senderId = sender;
                                }
                            }
                            
                            if (!senderId && lastMessage.senderId) {
                                senderId = lastMessage.senderId;
                            }
                            
                            const userId = user.id || user._id;
                            if (!senderId || !userId) return;
                            
                            const senderIdStr = String(senderId).trim();
                            const userIdStr = String(userId).trim();
                            const senderIdClean = senderIdStr.replace(/^ObjectId\(|\)$/g, '');
                            const userIdClean = userIdStr.replace(/^ObjectId\(|\)$/g, '');
                            
                            // If last message is from the other participant (not current user)
                            const isFromOtherParticipant = senderIdStr !== userIdStr && senderIdClean !== userIdClean;
                            
                            if (isFromOtherParticipant) {
                                // If this is a new message (different ID than what we last read), mark as unread
                                if (lastReadMessageId && lastMessageId && String(lastReadMessageId) !== String(lastMessageId)) {
                                    delete updated[conv._id];
                                    hasChanges = true;
                                    console.log('New message from other participant, marking conversation as unread:', conv._id);
                                } else if (!lastReadMessageId && lastMessageId) {
                                    // Conversation was never read, or message ID changed
                                    delete updated[conv._id];
                                    hasChanges = true;
                                }
                            }
                        });
                        
                        return hasChanges ? updated : prev;
                    });
                    
                setConversations(filteredConversations);
                
                // If we have an initial recipient, find and select the conversation
                    if (initialRecipientId && filteredConversations.length > 0 && user && (user.id || user._id)) {
                        const recipientIdStr = String(initialRecipientId);
                        const userIdStr = user.id ? String(user.id) : String(user._id);
                        
                        const conversation = filteredConversations.find(conv => {
                            if (!conv.participants) return false;
                            const participantIds = conv.participants.map(p => {
                                const id = p._id || p;
                                return id ? String(id) : null;
                            }).filter(id => id !== null);
                            return participantIds.includes(recipientIdStr) && participantIds.includes(userIdStr);
                        });
                        if (conversation) {
                            setSelectedConversation(conversation);
                        }
                    }
                }
            } else {
                console.error('API returned non-success status:', response.data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
            }
            alert('Failed to load conversations. Please check the console for details.');
        } finally {
            setLoading(false);
        }
    }, [token, user, initialRecipientId]);

    useEffect(() => {
        if (isOpen && token && user) {
            // Reset to 'unread' tab when modal opens
            setActiveTab('unread');
            fetchConversations();
            // Refresh conversations every 5 seconds when modal is open
            const interval = setInterval(() => {
                fetchConversations();
            }, 5000);
            return () => clearInterval(interval);
        } else {
            // Reset when modal closes
            setSelectedConversation(null);
            setMessages([]);
            setNewMessage('');
            // Keep readConversations state - don't reset it so conversations stay marked as read
        }
    }, [isOpen, token, user, fetchConversations]);

    const startChatWithRecipient = useCallback(async (recipientId) => {
        if (startingChat || !user || (!user.id && !user._id) || !token || !recipientId) {
            return;
        }
        
        const recipientIdStr = recipientId?.toString();
        const userIdStr = user.id ? user.id.toString() : user._id.toString();
        
        if (!recipientIdStr || !userIdStr || recipientIdStr === userIdStr) {
            // Don't allow messaging yourself or invalid IDs
            return;
        }
        try {
            setStartingChat(true);
            const response = await axios.post(
                `${API_BASE_URL}/start-chat/${recipientId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 'success') {
                // Refresh conversations to get the new one
                await fetchConversations();
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            alert('Failed to start conversation. Please try again.');
        } finally {
            setStartingChat(false);
        }
    }, [startingChat, user, token, fetchConversations]);

    // Handle initial recipient - start chat and select conversation
    useEffect(() => {
        if (isOpen && initialRecipientId && token && user && (user.id || user._id)) {
            const recipientIdStr = initialRecipientId?.toString();
            const userIdStr = user.id ? user.id.toString() : user._id.toString();
            
            if (!recipientIdStr || !userIdStr || recipientIdStr === userIdStr) {
                return; // Don't proceed if IDs are invalid or same
            }

            // Check if conversation already exists
            const existingConversation = conversations.find(conv => {
                if (!conv.participants) return false;
                const participantIds = conv.participants.map(p => {
                    const id = p._id || p;
                    return id ? id.toString() : null;
                }).filter(id => id !== null);
                // Check if both current user and recipient are in the conversation
                return participantIds.includes(userIdStr) && participantIds.includes(recipientIdStr);
            });

            if (existingConversation) {
                setSelectedConversation(existingConversation);
            } else if (!startingChat && !loading) {
                // Start new conversation only if not already starting one
                startChatWithRecipient(initialRecipientId);
            }
        }
    }, [isOpen, initialRecipientId, conversations, token, user, loading, startingChat, startChatWithRecipient]);

    const fetchMessages = useCallback(async (conversationId) => {
        if (!token || !conversationId) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 'success') {
                const fetchedMessages = response.data.data.messages || [];
                console.log('Fetched messages with senders:', fetchedMessages.map(m => ({
                    id: m._id,
                    content: m.content,
                    sender: m.sender,
                    senderId: m.sender?._id || m.sender?.id || m.sender,
                    userId: user?.id || user?._id
                })));
                setMessages(fetchedMessages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [token, user]);

    useEffect(() => {
        if (selectedConversation) {
            // Mark conversation as read when selected - store the last message ID
            const conversationId = selectedConversation._id;
            const lastMessage = selectedConversation.lastMessage;
            const lastMessageId = lastMessage ? (lastMessage._id || lastMessage.id) : null;
            
            setReadConversations(prev => {
                const currentLastReadId = prev[conversationId];
                // Only update if this is a new message or conversation wasn't read before
                if (lastMessageId && String(currentLastReadId) !== String(lastMessageId)) {
                    const updated = { ...prev, [conversationId]: lastMessageId };
                    // Notify parent component that a conversation was marked as read
                    if (onConversationRead) {
                        onConversationRead();
                    }
                    return updated;
                }
                return prev;
            });
            fetchMessages(conversationId);
            // Poll for new messages every 3 seconds
            const interval = setInterval(() => {
                fetchMessages(conversationId);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedConversation, fetchMessages, onConversationRead]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteMessage = async (messageId) => {
        if (!selectedConversation || !messageId || deletingMessageId) return;
        
        // Confirm deletion
        if (!window.confirm('Are you sure you want to delete this message? The recipient will no longer see it.')) {
            return;
        }
        
        // Find the message before deleting
        const messageToDelete = messages.find(m => m._id === messageId);
        if (!messageToDelete) return;
        
        // Check if this is the last message
        const isLastMessage = messages.length > 0 && messages[messages.length - 1]._id === messageId;
        const lastMessageId = selectedConversation.lastMessage?._id || selectedConversation.lastMessage;
        const isConversationLastMessage = lastMessageId && String(lastMessageId) === String(messageId);
        
        try {
            setDeletingMessageId(messageId);
            
            // Optimistically remove the message from UI
            const remainingMessages = messages.filter(m => m._id !== messageId);
            setMessages(remainingMessages);
            
            // If this was the conversation's last message, update it
            if (isConversationLastMessage) {
                const newLastMessage = remainingMessages.length > 0 ? remainingMessages[remainingMessages.length - 1] : null;
                
                setSelectedConversation(prev => ({
                    ...prev,
                    lastMessage: newLastMessage || null
                }));
                
                // Update conversations list
                setConversations(prev => prev.map(conv => 
                    conv._id === selectedConversation._id
                        ? {
                            ...conv,
                            lastMessage: newLastMessage || null
                        }
                        : conv
                ));
            }
            
            // Call API to delete
            const response = await axios.delete(
                `${API_BASE_URL}/${selectedConversation._id}/${messageId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.status === 'success') {
                // Refresh messages and conversations to ensure consistency
                await fetchMessages(selectedConversation._id);
                await fetchConversations();
            } else {
                // If deletion failed, restore the message
                setMessages(prev => [...prev, messageToDelete].sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                ));
                alert('Failed to delete message. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            // Restore the message on error
            setMessages(prev => {
                const restored = [...prev, messageToDelete];
                return restored.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            });
            
            // Restore conversation's lastMessage if needed
            if (isConversationLastMessage) {
                setSelectedConversation(prev => ({
                    ...prev,
                    lastMessage: messageToDelete
                }));
                setConversations(prev => prev.map(conv => 
                    conv._id === selectedConversation._id
                        ? {
                            ...conv,
                            lastMessage: messageToDelete
                        }
                        : conv
                ));
            }
            
            alert('Failed to delete message. Please try again.');
        } finally {
            setDeletingMessageId(null);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || sending) return;

        const messageContent = newMessage.trim();
        const tempMessageId = `temp-${Date.now()}`;
        
        // Optimistically add the message to the UI immediately
        const optimisticMessage = {
            _id: tempMessageId,
            content: messageContent,
            sender: {
                _id: user.id || user._id,
                name: user.name
            },
            createdAt: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        try {
            setSending(true);
            const response = await axios.post(
                `${API_BASE_URL}/${selectedConversation._id}`,
                { content: messageContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 'success') {
                const newLastMessage = {
                    _id: response.data.data.message._id,
                    content: messageContent,
                    sender: {
                        _id: user.id || user._id,
                        name: user.name
                    },
                    createdAt: new Date().toISOString()
                };
                
                // Optimistically update the selected conversation's lastMessage
                if (selectedConversation) {
                    setSelectedConversation(prev => ({
                        ...prev,
                        lastMessage: newLastMessage
                    }));
                    
                    // Also update conversations list optimistically
                    setConversations(prev => prev.map(conv => 
                        conv._id === selectedConversation._id
                            ? {
                                ...conv,
                                lastMessage: newLastMessage
                            }
                            : conv
                    ));
                }
                
                // Fetch messages to get the real message with proper data
                await fetchMessages(selectedConversation._id);
                // Refresh conversation list - the optimistic update should keep it visible in sent tab
                await fetchConversations();
            } else {
                // If sending failed, remove the optimistic message
                setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
                setNewMessage(messageContent); // Restore the message text
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove the optimistic message on error
            setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
            setNewMessage(messageContent); // Restore the message text
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const getOtherParticipant = (conversation) => {
        if (!conversation.participants || !user) return null;
        // Find the participant that is NOT the current user
        const userId = user.id ? String(user.id) : String(user._id);
        const otherParticipant = conversation.participants.find(p => {
            const participantId = p._id || p;
            return String(participantId) !== userId;
        });
        return otherParticipant || null;
    };

    // Helper function to check if last message is from current user
    const isLastMessageFromUser = (conversation) => {
        if (!conversation || !conversation.lastMessage || !user) {
            return false;
        }
        
        // Handle different sender formats
        let senderId = null;
        const sender = conversation.lastMessage.sender;
        const lastMessage = conversation.lastMessage;
        
        // Try multiple ways to get the sender ID
        if (sender) {
            // If sender is populated object (should have _id)
            if (typeof sender === 'object' && sender !== null) {
                senderId = sender._id || sender.id || sender.toString();
            } else if (typeof sender === 'string') {
                // If sender is just an ID string
                senderId = sender;
            }
        }
        
        // Also check if sender is stored directly as an ID field on the message
        if (!senderId && lastMessage.senderId) {
            senderId = lastMessage.senderId;
        }
        
        // Also check if sender is the _id field directly
        if (!senderId && lastMessage.sender && typeof lastMessage.sender === 'string') {
            senderId = lastMessage.sender;
        }
        
        const userId = user.id || user._id;
        if (!senderId || !userId) {
            return false;
        }
        
        // Convert both to strings and trim whitespace for comparison
        const senderIdStr = String(senderId).trim();
        const userIdStr = String(userId).trim();
        
        // Also try comparing without ObjectId wrapper if present
        const senderIdClean = senderIdStr.replace(/^ObjectId\(|\)$/g, '');
        const userIdClean = userIdStr.replace(/^ObjectId\(|\)$/g, '');
        
        return senderIdStr === userIdStr || senderIdClean === userIdClean;
    };

    // Helper function to check if conversation is unread
    const isConversationUnread = (conversation) => {
        const conversationId = conversation._id;
        const lastMessage = conversation.lastMessage;
        if (!lastMessage) return false;
        
        const lastMessageId = lastMessage._id || lastMessage.id;
        const lastReadMessageId = readConversations[conversationId];
        
        // If we've read this specific message, it's not unread
        if (lastReadMessageId && lastMessageId && String(lastReadMessageId) === String(lastMessageId)) {
            return false;
        }
        
        // Otherwise, check if last message is from the other participant
        return !isLastMessageFromUser(conversation);
    };

    // Filter conversations based on active tab
    const getFilteredConversations = () => {
        if (!conversations.length) return [];
        
        switch (activeTab) {
            case 'unread':
                // Unread: Last message is from the other participant AND not marked as read
                return conversations.filter(conv => isConversationUnread(conv));
            case 'read':
                // Read: Show all conversations (all messages have been read)
                return conversations;
            case 'sent':
                // Sent: Last message is from the current user
                return conversations.filter(conv => {
                    if (!conv.lastMessage) {
                        console.log('No lastMessage for conversation:', conv._id);
                        return false;
                    }
                    const result = isLastMessageFromUser(conv);
                    // Debug logging
                    console.log('Sent tab check:', {
                        convId: conv._id,
                        hasLastMessage: !!conv.lastMessage,
                        lastMessage: conv.lastMessage,
                        sender: conv.lastMessage.sender,
                        senderId: conv.lastMessage.sender?._id,
                        senderIdType: typeof conv.lastMessage.sender?._id,
                        userId: user?.id,
                        userIdType: typeof user?.id,
                        isMatch: result,
                        fullConversation: conv
                    });
                    return result;
                });
            default:
                return conversations;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '900px',
                    height: '80vh',
                    maxHeight: '700px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa'
                }}>
                    <h2 style={{
                        margin: 0,
                        color: '#00c4cc',
                        fontSize: '24px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <FaEnvelope />
                        Inbox
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '0',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#e0e0e0';
                            e.target.style.color = '#333';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#666';
                        }}
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden'
                }}>
                    {/* Conversations List */}
                    <div style={{
                        width: '300px',
                        borderRight: '1px solid #e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <div style={{
                            padding: '15px',
                            borderBottom: '1px solid #e0e0e0',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Conversations
                        </div>
                        
                        {/* Tabs */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid #e0e0e0',
                            backgroundColor: '#fff'
                        }}>
                            {['unread', 'read', 'sent'].map((tab) => {
                                const isActive = activeTab === tab;
                                const tabCount = tab === 'unread' 
                                    ? conversations.filter(conv => isConversationUnread(conv)).length
                                    : tab === 'read'
                                    ? conversations.length
                                    : conversations.filter(conv => conv.lastMessage && isLastMessageFromUser(conv)).length;
                                
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            flex: 1,
                                            padding: '12px 8px',
                                            border: 'none',
                                            backgroundColor: isActive ? '#00c4cc' : 'transparent',
                                            color: isActive ? '#fff' : '#666',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: isActive ? '600' : '500',
                                            textTransform: 'capitalize',
                                            transition: 'all 0.2s',
                                            borderBottom: isActive ? '2px solid #009999' : '2px solid transparent',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.target.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.target.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <span>{tab}</span>
                                        <span style={{
                                            fontSize: '10px',
                                            opacity: 0.8,
                                            backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#e0e0e0',
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            minWidth: '20px',
                                            textAlign: 'center'
                                        }}>
                                            {tabCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div style={{
                            flex: 1,
                            overflowY: 'auto'
                        }}>
                            {loading ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                    Loading...
                                </div>
                            ) : (() => {
                                const filteredConversations = getFilteredConversations();
                                return filteredConversations.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                        {activeTab === 'unread' && 'No unread conversations'}
                                        {activeTab === 'read' && 'No conversations'}
                                        {activeTab === 'sent' && 'No sent conversations'}
                                </div>
                            ) : (
                                    filteredConversations.map((conversation) => {
                                    const otherParticipant = getOtherParticipant(conversation);
                                    const lastMessage = conversation.lastMessage;
                                    const isSelected = selectedConversation?._id === conversation._id;
                                        const isUnread = isConversationUnread(conversation);

                                    return (
                                        <div
                                            key={conversation._id}
                                                onClick={() => {
                                                    // Mark conversation as read when clicked - store the last message ID
                                                    const conversationId = conversation._id;
                                                    const lastMessage = conversation.lastMessage;
                                                    const lastMessageId = lastMessage ? (lastMessage._id || lastMessage.id) : null;
                                                    
                                                    console.log('Conversation clicked:', {
                                                        conversationId,
                                                        lastMessageId,
                                                        isCurrentlyRead: readConversations[conversationId] === lastMessageId,
                                                        readConversations: readConversations
                                                    });
                                                    
                                                    if (lastMessageId) {
                                                        const currentLastReadId = readConversations[conversationId];
                                                        // Only update if this is a new message or conversation wasn't read before
                                                        if (String(currentLastReadId) !== String(lastMessageId)) {
                                                            setReadConversations(prev => {
                                                                const updated = { ...prev, [conversationId]: lastMessageId };
                                                                console.log('Marking as read, updated:', updated);
                                                                // Notify parent component that a conversation was marked as read
                                                                if (onConversationRead) {
                                                                    onConversationRead();
                                                                }
                                                                return updated;
                                                            });
                                                        }
                                                    }
                                                    setSelectedConversation(conversation);
                                                }}
                                            style={{
                                                padding: '15px',
                                                borderBottom: '1px solid #e0e0e0',
                                                cursor: 'pointer',
                                                    backgroundColor: isSelected ? '#e8f4f8' : (isUnread ? '#f0f8ff' : '#fff'),
                                                    transition: 'background-color 0.2s',
                                                    position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                    if (!isSelected) e.target.style.backgroundColor = isUnread ? '#e8f4f8' : '#f5f5f5';
                                            }}
                                            onMouseLeave={(e) => {
                                                    if (!isSelected) e.target.style.backgroundColor = isUnread ? '#f0f8ff' : '#fff';
                                            }}
                                        >
                                                {isUnread && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '15px',
                                                        right: '15px',
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#00c4cc'
                                                    }} />
                                                )}
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#00c4cc',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    flexShrink: 0
                                                }}>
                                                    {otherParticipant?.profilePicture ? (
                                                        <img
                                                            src={otherParticipant.profilePicture.startsWith('http')
                                                                ? otherParticipant.profilePicture
                                                                : apiUrl(otherParticipant.profilePicture)}
                                                            alt={otherParticipant.name}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    ) : (
                                                        <FaUser style={{ color: '#fff', fontSize: '20px' }} />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                            fontWeight: isUnread ? '700' : '600',
                                                        fontSize: '14px',
                                                        color: '#333',
                                                        marginBottom: '4px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {otherParticipant?.name || 'Unknown User'}
                                                    </div>
                                                    {lastMessage && (
                                                        <div style={{
                                                            fontSize: '12px',
                                                            color: '#999',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {lastMessage.content}
                                                        </div>
                                                    )}
                                                    {lastMessage && (
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: '#bbb',
                                                            marginTop: '4px'
                                                        }}>
                                                            {formatTime(lastMessage.createdAt)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                                )
                            })()}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#fff'
                    }}>
                        {selectedConversation ? (
                            <>
                                {/* Messages Header */}
                                <div style={{
                                    padding: '15px 20px',
                                    borderBottom: '1px solid #e0e0e0',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '16px',
                                        color: '#333'
                                    }}>
                                        {initialRecipientName || getOtherParticipant(selectedConversation)?.name 
                                            ? `To: ${initialRecipientName || getOtherParticipant(selectedConversation)?.name}` 
                                            : 'New Message'}
                                    </div>
                                </div>

                                {/* Messages List */}
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    width: '100%'
                                }}>
                                    {messages.map((message) => {
                                        // Get sender ID - handle different formats
                                        let senderId = null;
                                        if (message.sender) {
                                            if (typeof message.sender === 'object' && message.sender !== null) {
                                                senderId = message.sender._id || message.sender.id;
                                            } else if (typeof message.sender === 'string') {
                                                senderId = message.sender;
                                            }
                                        }
                                        
                                        // Get user ID - handle both id and _id
                                        const userId = user?.id || user?._id;
                                        
                                        // Compare IDs - normalize both to strings
                                        const senderIdStr = senderId ? String(senderId).trim() : null;
                                        const userIdStr = userId ? String(userId).trim() : null;
                                        
                                        // More robust comparison - handle ObjectId and different formats
                                        let isOwnMessage = false;
                                        if (senderIdStr && userIdStr) {
                                            // Direct string comparison
                                            isOwnMessage = senderIdStr === userIdStr;
                                            
                                            // If not matching, try comparing the actual ID values
                                            if (!isOwnMessage) {
                                                // Extract just the ID part if wrapped in ObjectId()
                                                const senderIdClean = senderIdStr.replace(/^ObjectId\(["']?|["']?\)$/g, '');
                                                const userIdClean = userIdStr.replace(/^ObjectId\(["']?|["']?\)$/g, '');
                                                
                                                // Try multiple comparison methods
                                                isOwnMessage = senderIdClean === userIdClean || 
                                                              senderIdClean === userIdStr || 
                                                              senderIdStr === userIdClean ||
                                                              senderId === userId; // Direct comparison of original values
                                            }
                                        }
                                        
                                        // Debug logging for all messages to see what's happening
                                        console.log('Message alignment check:', {
                                            messageId: message._id,
                                            content: message.content,
                                            sender: message.sender,
                                            senderIdStr,
                                            userIdStr,
                                            isOwnMessage,
                                            willAlignRight: isOwnMessage
                                        });
                                        
                                        const isDeleting = deletingMessageId === message._id;
                                        
                                        return (
                                            <div
                                                key={message._id}
                                                style={{
                                                    display: 'flex',
                                                    width: '100%',
                                                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                                    alignItems: 'flex-start',
                                                    gap: '8px',
                                                    position: 'relative',
                                                    flexDirection: 'row', // Always row, not reversed
                                                    boxSizing: 'border-box',
                                                    alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' // Align container itself to right for sent messages
                                                }}
                                            >
                                                {/* Delete button - only show for sent messages, positioned before message bubble */}
                                                {isOwnMessage && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(message._id)}
                                                        disabled={isDeleting}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#999',
                                                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                                                            padding: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            opacity: isDeleting ? 0.5 : 1,
                                                            transition: 'color 0.2s',
                                                            fontSize: '14px',
                                                            borderRadius: '4px',
                                                            flexShrink: 0,
                                                            order: 1 // Delete button comes first in flex order
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isDeleting) {
                                                                e.target.style.color = '#dc3545';
                                                                e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isDeleting) {
                                                                e.target.style.color = '#999';
                                                                e.target.style.backgroundColor = 'transparent';
                                                            }
                                                        }}
                                                        title="Delete message"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                                <div style={{
                                                    maxWidth: '70%',
                                                    padding: '10px 14px',
                                                    borderRadius: '12px',
                                                    backgroundColor: isOwnMessage ? '#00c4cc' : '#f0f0f0',
                                                    color: isOwnMessage ? '#fff' : '#333',
                                                    fontSize: '14px',
                                                    lineHeight: '1.4',
                                                    opacity: isDeleting ? 0.5 : 1,
                                                    transition: 'opacity 0.2s',
                                                    order: 2, // Message bubble comes second
                                                    marginRight: isOwnMessage ? '12px' : '0', // Add gap from right edge for sent messages
                                                    marginLeft: isOwnMessage ? '0' : '0' // Keep left margin for received messages
                                                }}>
                                                    {message.content}
                                                    {/* Temporary debug indicator */}
                                                    {process.env.NODE_ENV === 'development' && (
                                                        <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
                                                            {isOwnMessage ? 'SENT' : 'RECEIVED'}
                                                        </div>
                                                    )}
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#999',
                                                        marginTop: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        {isDeleting && <span>Deleting...</span>}
                                                        <span>{formatTime(message.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} style={{
                                    padding: '15px 20px',
                                    borderTop: '1px solid #e0e0e0',
                                    display: 'flex',
                                    gap: '10px',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        style={{
                                            flex: 1,
                                            padding: '10px 15px',
                                            border: '1px solid #ddd',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#00c4cc',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '20px',
                                            cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                                            opacity: newMessage.trim() && !sending ? 1 : 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (newMessage.trim() && !sending) {
                                                e.target.style.backgroundColor = '#009999';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (newMessage.trim() && !sending) {
                                                e.target.style.backgroundColor = '#00c4cc';
                                            }
                                        }}
                                    >
                                        <FaPaperPlane />
                                        {sending ? 'Sending...' : 'Send'}
                                    </button>
                                </form>
                            </>
                        ) : initialRecipientId && startingChat ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                                fontSize: '16px',
                                gap: '10px'
                            }}>
                                <div>Starting conversation...</div>
                            </div>
                        ) : initialRecipientId ? (
                            <>
                                {/* Messages Header - New Message */}
                                <div style={{
                                    padding: '15px 20px',
                                    borderBottom: '1px solid #e0e0e0',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '16px',
                                        color: '#333'
                                    }}>
                                        {initialRecipientName 
                                            ? `To: ${initialRecipientName}` 
                                            : 'New Message'}
                                    </div>
                                </div>

                                {/* Empty Messages Area - Ready to send first message */}
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#999',
                                    fontSize: '14px',
                                    padding: '20px'
                                }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        Start a conversation by sending your first message below.
                                    </div>
                                </div>

                                {/* Message Input - Allow sending first message */}
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!newMessage.trim() || sending || startingChat) return;

                                    const messageContent = newMessage.trim();
                                    const tempMessageId = `temp-${Date.now()}`;
                                    
                                    // Optimistically add the message to the UI immediately
                                    const optimisticMessage = {
                                        _id: tempMessageId,
                                        content: messageContent,
                                        sender: {
                                            _id: user.id || user._id,
                                            name: user.name
                                        },
                                        createdAt: new Date().toISOString()
                                    };
                                    
                                    setMessages([optimisticMessage]);
                                    setNewMessage('');

                                    // Start chat and send first message
                                    try {
                                        setSending(true);
                                        // First start the chat
                                        const startResponse = await axios.post(
                                            `${API_BASE_URL}/start-chat/${initialRecipientId}`,
                                            {},
                                            { headers: { Authorization: `Bearer ${token}` } }
                                        );

                                        if (startResponse.data.status === 'success') {
                                            const conversationId = startResponse.data.data.conversation._id;
                                            const newConversation = startResponse.data.data.conversation;
                                            
                                            // Then send the message
                                            const messageResponse = await axios.post(
                                                `${API_BASE_URL}/${conversationId}`,
                                                { content: messageContent },
                                                { headers: { Authorization: `Bearer ${token}` } }
                                            );

                                            if (messageResponse.data.status === 'success') {
                                                // Select the conversation and fetch messages
                                                setSelectedConversation(newConversation);
                                                await fetchMessages(conversationId);
                                                await fetchConversations(); // Refresh conversation list
                                            } else {
                                                // If sending failed, remove the optimistic message
                                                setMessages([]);
                                                setNewMessage(messageContent);
                                            }
                                        } else {
                                            // If starting chat failed, remove the optimistic message
                                            setMessages([]);
                                            setNewMessage(messageContent);
                                        }
                                    } catch (error) {
                                        console.error('Error starting chat and sending message:', error);
                                        // Remove the optimistic message on error
                                        setMessages([]);
                                        setNewMessage(messageContent);
                                        alert('Failed to send message. Please try again.');
                                    } finally {
                                        setSending(false);
                                    }
                                }} style={{
                                    padding: '15px 20px',
                                    borderTop: '1px solid #e0e0e0',
                                    display: 'flex',
                                    gap: '10px',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        style={{
                                            flex: 1,
                                            padding: '10px 15px',
                                            border: '1px solid #ddd',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#00c4cc',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '20px',
                                            cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                                            opacity: newMessage.trim() && !sending ? 1 : 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (newMessage.trim() && !sending) {
                                                e.target.style.backgroundColor = '#009999';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (newMessage.trim() && !sending) {
                                                e.target.style.backgroundColor = '#00c4cc';
                                            }
                                        }}
                                    >
                                        <FaPaperPlane />
                                        {sending ? 'Sending...' : 'Send'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                                fontSize: '16px'
                            }}>
                                Select a conversation to view messages
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InboxModal;

