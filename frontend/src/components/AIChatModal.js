import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { API_URL, apiUrl } from '../config/api';

const AIChatModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm Fluenci AI Assistant. I can help you with questions about Fluenci, how to use the platform, finding businesses, campaigns, and more. How can I assist you today?"
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || loading) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        
        // Add user message to chat
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: data.data.response 
                }]);
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'Sorry, I encountered an error. Please try again.' 
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, I\'m having trouble connecting. Please try again later.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
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
                    maxWidth: '600px',
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
                    borderBottom: '2px solid #00c4cc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#00c4cc',
                    color: '#fff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaRobot style={{ fontSize: '24px' }} />
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                            Fluenci AI Assistant
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '24px',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                }}>
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                alignItems: 'flex-start',
                                gap: '10px'
                            }}
                        >
                            {msg.role === 'assistant' && (
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: '#00c4cc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    flexShrink: 0
                                }}>
                                    <FaRobot style={{ fontSize: '16px' }} />
                                </div>
                            )}
                            <div style={{
                                maxWidth: '75%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: msg.role === 'user' ? '#00c4cc' : '#fff',
                                color: msg.role === 'user' ? '#fff' : '#333',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                wordWrap: 'break-word'
                            }}>
                                {msg.content}
                            </div>
                            {msg.role === 'user' && (
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: '#00c4cc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    flexShrink: 0
                                }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            gap: '10px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#00c4cc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0
                            }}>
                                <FaRobot style={{ fontSize: '16px' }} />
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '4px'
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#00c4cc',
                                        animation: 'bounce 1.4s infinite',
                                        animationDelay: '0s'
                                    }}></span>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#00c4cc',
                                        animation: 'bounce 1.4s infinite',
                                        animationDelay: '0.2s'
                                    }}></span>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#00c4cc',
                                        animation: 'bounce 1.4s infinite',
                                        animationDelay: '0.4s'
                                    }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} style={{
                    padding: '15px 20px',
                    borderTop: '1px solid #e0e0e0',
                    backgroundColor: '#fff',
                    display: 'flex',
                    gap: '10px'
                }}>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask me anything about Fluenci..."
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '24px',
                            outline: 'none',
                            fontSize: '14px',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !inputMessage.trim()}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: loading || !inputMessage.trim() ? '#ccc' : '#00c4cc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '24px',
                            cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <FaPaperPlane />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIChatModal;

