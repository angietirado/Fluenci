import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/messages';

const Messaging = () => {
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    const getPartner = (convo) => {
        return convo.participants.find(p => p._id !== user._id);
    };

    useEffect(() => {
        if (!user || !token) {
            navigate('/login');
            return;
        }

        const fetchConversations = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`${API_BASE_URL}/conversations`, config);
                setConversations(res.data.data.conversations);
                setLoading(false);
            } catch (err) {
                setError('Failed to load conversations.');
                setLoading(false);
            }
        };

        fetchConversations();
    }, [navigate, user, token]);

    useEffect(() => {
        if (!currentConversationId) {
            setCurrentMessages([]);
            return;
        }

        const fetchMessages = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`${API_BASE_URL}/${currentConversationId}`, config);
                setCurrentMessages(res.data.data.messages);
            } catch (err) {
                setError('Failed to load messages.');
            }
        };

        fetchMessages();
        // NOTE: In a real app, this is where Socket.IO listeners would be set up
    }, [currentConversationId, token]);


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentConversationId) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const content = messageInput;
            
            const res = await axios.post(`${API_BASE_URL}/${currentConversationId}`, { content }, config);
            const newMessage = res.data.data.message;

            // Optimistically update the message list and clear input
            setCurrentMessages(prev => [...prev, { ...newMessage, sender: { _id: user._id, name: user.name } }]);
            setMessageInput('');

        } catch (err) {
            alert('Failed to send message.');
        }
    };


    if (loading) return <div className="p-10 text-center text-indigo-600">Loading messaging center...</div>;
    if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;

    const currentConvo = conversations.find(c => c._id === currentConversationId);
    const chatPartner = currentConvo ? getPartner(currentConvo) : null;

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 mt-10 min-h-[80vh] flex bg-white shadow-xl rounded-xl">
            {/* Left Sidebar: Conversations List */}
            <div className="w-full md:w-1/3 border-r pr-6 space-y-3 overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Chats</h2>
                {conversations.map(convo => {
                    const partner = getPartner(convo);
                    return (
                        <div
                            key={convo._id}
                            onClick={() => setCurrentConversationId(convo._id)}
                            className={`p-4 rounded-lg cursor-pointer transition duration-150 ${
                                convo._id === currentConversationId ? 'bg-indigo-100 border-l-4 border-indigo-600' : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="font-semibold text-gray-800">{partner?.name} <span className="text-xs text-gray-500">({partner?.userType})</span></div>
                            <p className="text-sm text-gray-500 truncate">{convo.lastMessage?.content || 'New chat started.'}</p>
                        </div>
                    );
                })}
            </div>

            {/* Right Panel: Chat Window */}
            <div className="w-full md:w-2/3 pl-6 flex flex-col">
                {currentConversationId ? (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                            Chat with {chatPartner?.name}
                        </h2>
                        
                        {/* Messages Area */}
                        <div className="flex-grow overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
                            {currentMessages.map(msg => (
                                <div 
                                    key={msg._id} 
                                    className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl text-white ${
                                        msg.sender._id === user._id ? 'bg-indigo-600 rounded-br-none' : 'bg-gray-700 rounded-tl-none text-white'
                                    }`}>
                                        <p>{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="flex">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-grow px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={!currentConversationId}
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-r-lg hover:bg-indigo-700 transition"
                                disabled={!currentConversationId || !messageInput.trim()}
                            >
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex justify-center items-center h-full text-gray-500 text-lg">
                        Select a conversation to start chatting.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messaging;