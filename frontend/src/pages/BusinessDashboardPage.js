import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUser, FaSearch, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp, FaInstagram, FaTiktok, FaSnapchat, FaFacebook, FaCog, FaSignOutAlt, FaLinkedin, FaPinterest, FaInbox, FaTimes, FaBriefcase, FaEnvelope, FaGlobe, FaUsers, FaShieldAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import AIChatModal from '../components/AIChatModal';
import InboxModal from '../components/InboxModal';

const API_BASE_URL = 'http://localhost:5000/api/v1/users/influencers';
const MESSAGES_API_BASE_URL = 'http://localhost:5000/api/v1/messages';

const BusinessDashboardPage = () => {
    const navigate = useNavigate();
    const { user, token, dispatch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [influencers, setInfluencers] = useState([]);
    const [filteredInfluencers, setFilteredInfluencers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        followersMin: '',
        followersMax: '',
        location: '',
        industry: {
            fashion: false,
            beauty: false,
            fitness: false,
            tech: false,
            food: false,
            travel: false,
            lifestyle: false,
            gaming: false,
            music: false,
            art: false,
            education: false,
            business: false,
            health: false,
            sports: false,
            entertainment: false,
            other: false
        },
        customIndustry: '',
        socials: {
            insta: false,
            fb: false,
            linkedin: false
        }
    });
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showInboxModal, setShowInboxModal] = useState(false);
    const [showInfluencerModal, setShowInfluencerModal] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [inboxRecipientId, setInboxRecipientId] = useState(null);
    const [inboxRecipientName, setInboxRecipientName] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const fileInputRef = useRef(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Check authentication and role
    useEffect(() => {
        if (user === undefined || token === undefined) {
            return;
        }

        if (!user || !token) {
            navigate('/auth', { replace: true });
            return;
        }

        // CRITICAL: If user is an influencer, redirect to influencer profile page immediately
        if (user.role === 'influencer') {
            console.log('🔄 Influencer user detected on business dashboard, redirecting to influencer profile');
            // Always redirect influencer users to their profile page
            navigate('/influencer-onboarding?edit=true', { replace: true });
            return;
        }

        if (user.role !== 'business') {
            navigate('/auth', { replace: true });
            return;
        }

        // Redirect to settings if onboarding not complete (first time)
        if (!user.onboardingComplete) {
            navigate('/business-settings', { replace: true });
            return;
        }

        setLoading(false);
        
        // Handle browser back button - catch influencer users trying to access business pages
        // Only set up listeners if user is confirmed to be business (to avoid interference)
        const handlePopState = (event) => {
            // Small delay to ensure user state is updated
            setTimeout(() => {
                // Double-check user role before redirecting
                if (user && user.role === 'influencer') {
                    console.log('🔄 Back button detected - influencer user on business page, redirecting');
                    navigate('/influencer-onboarding?edit=true', { replace: true });
                }
            }, 50);
        };
        
        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [user, token, navigate]);

    // Fetch influencers
    useEffect(() => {
        const fetchInfluencers = async () => {
            if (!token) return;

            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                };
                
                const response = await axios.get(API_BASE_URL, config);
                const influencersData = response.data.data || [];
                
                setInfluencers(influencersData);
                setFilteredInfluencers(influencersData);
        } catch (err) {
                console.error("Error fetching influencers:", err);
            }
        };

        if (token && !loading) {
            fetchInfluencers();
        }
    }, [token, loading]);

    // Function to fetch unread conversations count
    const fetchUnreadCount = useCallback(async () => {
        if (!token || !user) return;

        try {
            const response = await axios.get(`${MESSAGES_API_BASE_URL}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                const conversations = response.data.data.conversations || [];
                
                // Filter out conversations where user is messaging themselves
                const validConversations = conversations.filter(conv => {
                    if (!conv.participants || conv.participants.length < 2) return false;
                    if (!user || (!user.id && !user._id)) return false;
                    
                    const participantIds = conv.participants.map(p => {
                        const id = p._id || p;
                        return id ? String(id) : null;
                    }).filter(id => id !== null);
                    
                    const userId = user.id ? String(user.id) : (user._id ? String(user._id) : null);
                    if (!userId) return false;
                    
                    const userIsParticipant = participantIds.some(pid => pid === userId);
                    const uniqueParticipants = new Set(participantIds);
                    const hasMultipleParticipants = uniqueParticipants.size >= 2;
                    
                    return userIsParticipant && hasMultipleParticipants;
                });

                // Get userId for localStorage key
                const userId = user.id || user._id;
                
                // Load read conversations from localStorage (format: { conversationId: lastReadMessageId })
                let readConversationsMap = {};
                try {
                    const stored = localStorage.getItem(`readConversations_${userId}`);
                    if (stored) {
                        readConversationsMap = JSON.parse(stored);
                    }
                } catch (e) {
                    console.error('Error loading read conversations:', e);
                }
                
                // Count unread conversations (last message is NOT from current user AND not marked as read locally)
                const unreadConversations = validConversations.filter(conv => {
                    if (!conv.lastMessage) return false;
                    
                    const lastMessageId = conv.lastMessage._id || conv.lastMessage.id;
                    const lastReadMessageId = readConversationsMap[conv._id];
                    
                    // If we've read this specific message, it's not unread
                    if (lastReadMessageId && lastMessageId && String(lastReadMessageId) === String(lastMessageId)) {
                        return false;
                    }
                    
                    if (!conv.lastMessage) return false;
                    
                    // Check if last message is from current user
                    let senderId = null;
                    const sender = conv.lastMessage.sender;
                    
                    if (sender) {
                        if (typeof sender === 'object' && sender !== null) {
                            senderId = sender._id || sender.id || sender.toString();
                        } else if (typeof sender === 'string') {
                            senderId = sender;
                        }
                    }
                    
                    if (!senderId && conv.lastMessage.senderId) {
                        senderId = conv.lastMessage.senderId;
                    }
                    
                    if (!senderId || !userId) return false;
                    
                    const senderIdStr = String(senderId).trim();
                    const userIdStr = String(userId).trim();
                    const senderIdClean = senderIdStr.replace(/^ObjectId\(|\)$/g, '');
                    const userIdClean = userIdStr.replace(/^ObjectId\(|\)$/g, '');
                    
                    // Unread if last message is NOT from current user
                    return senderIdStr !== userIdStr && senderIdClean !== userIdClean;
                });
                
                setUnreadCount(unreadConversations.length);
            }
        } catch (err) {
            console.error("Error fetching unread count:", err);
        }
    }, [token, user]);

    // Fetch unread conversations count on mount and periodically
    useEffect(() => {
        if (token && user && !loading) {
            fetchUnreadCount();
            // Refresh unread count every 10 seconds
            const interval = setInterval(fetchUnreadCount, 10000);
            return () => clearInterval(interval);
        }
    }, [token, user, loading, fetchUnreadCount]);

    // Refresh unread count when inbox modal closes (user may have read messages)
    useEffect(() => {
        if (!showInboxModal && token && user) {
            // Small delay to ensure backend has updated
            const timeout = setTimeout(() => {
                fetchUnreadCount();
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [showInboxModal, token, user, fetchUnreadCount]);

    // Helper function to get total followers for an influencer
    const getTotalFollowers = (influencer) => {
        // First check if there's a direct followerCount field
        if (influencer.followerCount !== undefined && influencer.followerCount !== null) {
            return influencer.followerCount;
        }
        
        // If not, try to calculate from individual platform followers
        // Check if follower counts are stored in socialMediaConnections
        const socialConnections = influencer.socialMediaConnections || {};
        let totalFollowers = 0;
        
        const platforms = ['instagram', 'tiktok', 'facebook', 'linkedin', 'x', 'twitter', 'snapchat', 'pinterest'];
        platforms.forEach(platform => {
            if (socialConnections[platform]?.followers) {
                totalFollowers += socialConnections[platform].followers;
            }
        });
        
        // If we have any followers from platforms, return that
        // Otherwise return null to indicate no follower data available
        return totalFollowers > 0 ? totalFollowers : null;
    };

    // Filter influencers based on search and filters
    useEffect(() => {
        let filtered = [...influencers];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(influencer => 
                influencer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                influencer.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                influencer.industry?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Location filter
        if (filters.location) {
            filtered = filtered.filter(influencer => 
                influencer.location?.toLowerCase().includes(filters.location.toLowerCase())
            );
        }

        // Industry filter
        const hasIndustryFilter = Object.values(filters.industry).some(val => val);
        if (hasIndustryFilter) {
            filtered = filtered.filter(influencer => {
                if (!influencer.industry) return false;
                
                const influencerIndustry = influencer.industry.toLowerCase();
                
                // Check if influencer's industry contains any of the selected industry keywords
                return Object.keys(filters.industry).some(industryKey => {
                    if (!filters.industry[industryKey]) return false;
                    
                    // Handle custom industry
                    if (industryKey === 'other' && filters.customIndustry) {
                        const customIndustryLower = filters.customIndustry.toLowerCase().trim();
                        return influencerIndustry.includes(customIndustryLower);
                    }
                    
                    // Skip "other" if no custom text entered
                    if (industryKey === 'other') return false;
                    
                    // Map industry keys to search terms
                    const industryMap = {
                        fashion: ['fashion', 'style', 'clothing', 'apparel'],
                        beauty: ['beauty', 'cosmetics', 'makeup', 'skincare'],
                        fitness: ['fitness', 'workout', 'gym', 'exercise', 'health'],
                        tech: ['tech', 'technology', 'software', 'gadgets', 'electronics'],
                        food: ['food', 'cooking', 'recipe', 'culinary', 'restaurant'],
                        travel: ['travel', 'tourism', 'vacation', 'adventure'],
                        lifestyle: ['lifestyle', 'life', 'daily', 'living'],
                        gaming: ['gaming', 'games', 'gamer', 'esports'],
                        music: ['music', 'musician', 'singer', 'artist'],
                        art: ['art', 'artist', 'creative', 'design', 'painting'],
                        education: ['education', 'teaching', 'learning', 'academic'],
                        business: ['business', 'entrepreneur', 'startup', 'commerce'],
                        health: ['health', 'wellness', 'medical', 'wellbeing'],
                        sports: ['sports', 'athlete', 'athletic', 'sport'],
                        entertainment: ['entertainment', 'comedy', 'funny', 'humor']
                    };
                    
                    const searchTerms = industryMap[industryKey] || [industryKey];
                    return searchTerms.some(term => influencerIndustry.includes(term));
                });
            });
        }

        // Followers range filter
        const minFollowers = filters.followersMin ? parseInt(filters.followersMin) : null;
        const maxFollowers = filters.followersMax ? parseInt(filters.followersMax) : null;
        
        if (minFollowers !== null || maxFollowers !== null) {
            filtered = filtered.filter(influencer => {
                const totalFollowers = getTotalFollowers(influencer);
                
                // If influencer has no follower data, exclude them from results
                if (totalFollowers === null) {
                    return false;
                }
                
                // Check if followers fall within the range
                if (minFollowers !== null && totalFollowers < minFollowers) {
                    return false;
                }
                if (maxFollowers !== null && totalFollowers > maxFollowers) {
                    return false;
                }
                
                return true;
            });
        }

        // Socials filter
        const hasSocialFilter = Object.values(filters.socials).some(val => val);
        if (hasSocialFilter) {
            filtered = filtered.filter(influencer => {
                const socialMedia = influencer.socialMedia || {};
                const socialConnections = influencer.socialMediaConnections || {};
                
                // Map frontend social keys to backend keys
                const socialMap = {
                    insta: 'instagram',
                    fb: 'facebook',
                    linkedin: 'linkedin'
                };
                
                // Check if influencer has any of the selected socials
                return Object.keys(filters.socials).some(social => {
                    if (!filters.socials[social]) return false;
                    
                    const backendKey = socialMap[social];
                    if (!backendKey) return false; // Skip if platform not in our map
                    
                    return socialMedia[backendKey] || socialConnections[backendKey]?.connected;
                });
            });
        }

        setFilteredInfluencers(filtered);
        setCurrentIndex(0); // Reset to first page when filters change
    }, [searchQuery, filters, influencers]);

    const handlePrev = () => {
        setCurrentIndex(prev => Math.max(0, prev - 3));
    };

    const handleNext = () => {
        setCurrentIndex(prev => Math.min(filteredInfluencers.length - 3, prev + 3));
    };

    const handleChat = () => {
        setShowChatModal(true);
    };

    const handleSocialChange = (social) => {
        setFilters(prev => ({
            ...prev,
            socials: {
                ...prev.socials,
                [social]: !prev.socials[social]
            }
        }));
    };

    const handleIndustryChange = (industry) => {
        setFilters(prev => ({
            ...prev,
            industry: {
                ...prev.industry,
                [industry]: !prev.industry[industry]
            },
            // Clear custom industry if selecting a standard industry (not "other")
            customIndustry: industry === 'other' ? prev.customIndustry : ''
        }));
    };

    const handleCustomIndustryChange = (value) => {
        setFilters(prev => ({
            ...prev,
            customIndustry: value
        }));
    };


    const handleProfilePictureClick = (e) => {
        e.stopPropagation();
        setShowDropdown(!showDropdown);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const handleChangePicture = () => {
        setShowDropdown(false);
        fileInputRef.current?.click();
    };

    const handleProfile = () => {
        setShowDropdown(false);
        navigate('/business-settings');
    };

    const handleSettings = () => {
        setShowDropdown(false);
        navigate('/business-account-settings');
    };

    const handlePrivacyPolicy = () => {
        setShowDropdown(false);
        navigate('/privacy-policy');
    };

    const handleLogout = () => {
        setShowDropdown(false);
        dispatch({ type: 'LOGOUT' });
        navigate('/', { replace: true });
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicturePreview(reader.result);
        };
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('profilePicture', file);

            const response = await fetch('http://localhost:5000/api/v1/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                const userResponse = await fetch('http://localhost:5000/api/v1/auth/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const userData = await userResponse.json();
                if (userData.success) {
                    dispatch({
                        type: 'SET_USER',
                        payload: userData.data
                    });
                }
                setProfilePicturePreview(null);
            } else {
                alert(data.message || 'Failed to upload profile picture');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('An error occurred while uploading the profile picture');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Helper function to get social media icons
    const getSocialIcon = (platform) => {
        const iconMap = {
            instagram: FaInstagram,
            snapchat: FaSnapchat,
            tiktok: FaTiktok,
            facebook: FaFacebook,
            x: FaXTwitter,
            twitter: FaXTwitter,
            linkedin: FaLinkedin,
            pinterest: FaPinterest
        };
        return iconMap[platform.toLowerCase()] || null;
    };

    // Helper function to get active socials for an influencer
    const getActiveSocials = (influencer) => {
        const socials = [];
        const socialMedia = influencer.socialMedia || {};
        const socialConnections = influencer.socialMediaConnections || {};
        
        ['instagram', 'tiktok', 'facebook', 'snapchat', 'x', 'twitter'].forEach(platform => {
            if (socialMedia[platform] || socialConnections[platform]?.connected) {
                socials.push(platform);
            }
        });
        
        return socials;
    };

    // Helper function to construct social media URL from handle
    const getSocialMediaUrl = (platform, handle) => {
        if (!handle) return null;
        
        // If handle is already a URL, return it
        if (handle.startsWith('http://') || handle.startsWith('https://')) {
            return handle;
        }
        
        // Remove @ symbol if present
        const cleanHandle = handle.replace(/^@/, '');
        
        // Construct URL based on platform
        const urlMap = {
            instagram: `https://instagram.com/${cleanHandle}`,
            tiktok: `https://tiktok.com/@${cleanHandle}`,
            facebook: `https://facebook.com/${cleanHandle}`,
            linkedin: handle.includes('linkedin.com') 
                ? handle 
                : `https://linkedin.com/in/${cleanHandle}`,
            x: `https://x.com/${cleanHandle}`,
            twitter: `https://twitter.com/${cleanHandle}`,
            snapchat: `https://snapchat.com/add/${cleanHandle}`,
            pinterest: `https://pinterest.com/${cleanHandle}`
        };
        
        return urlMap[platform.toLowerCase()] || null;
    };

    // Handler to open social media link
    const handleSocialMediaClick = (platform, handle) => {
        const url = getSocialMediaUrl(platform, handle);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                color: '#00c4cc'
            }}>
                Loading...
            </div>
        );
    }

    const displayedInfluencers = filteredInfluencers.slice(currentIndex, currentIndex + 3);

        return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <header style={{
                padding: '20px 0 20px 40px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                position: 'relative',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }} ref={dropdownRef}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        style={{ display: 'none' }}
                    />
                    <div
                        onClick={handleProfilePictureClick}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#00c4cc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'opacity 0.2s',
                            opacity: uploading ? 0.6 : 1
                        }}
                        title="Click for options"
                    >
                        {profilePicturePreview || user?.profilePicture ? (
                            <img
                                src={profilePicturePreview || (user?.profilePicture?.startsWith('http') 
                                    ? user.profilePicture 
                                    : `http://localhost:5000${user.profilePicture}`)}
                                alt="Profile"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '50%'
                                }}
                            />
                        ) : (
                            <FaUser />
                        )}
                    </div>
                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div style={{
                            position: 'absolute',
                            top: '50px',
                            left: 0,
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            minWidth: '180px',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}>
                            <div
                                onClick={handleSettings}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #e0e0e0',
                                    transition: 'background-color 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                            >
                                <FaCog style={{ color: '#00c4cc' }} />
                                <span style={{ fontSize: '14px', color: '#333' }}>Settings</span>
                            </div>
                            <div
                                onClick={handleProfile}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #e0e0e0',
                                    transition: 'background-color 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                            >
                                <FaUser style={{ color: '#00c4cc' }} />
                                <span style={{ fontSize: '14px', color: '#333' }}>Profile</span>
                            </div>
                            <div
                                onClick={handlePrivacyPolicy}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #e0e0e0',
                                    transition: 'background-color 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                            >
                                <FaShieldAlt style={{ color: '#00c4cc' }} />
                                <span style={{ fontSize: '14px', color: '#333' }}>Privacy Policy</span>
                            </div>
                            <div
                                onClick={handleLogout}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                            >
                                <FaSignOutAlt style={{ color: '#dc3545' }} />
                                <span style={{ fontSize: '14px', color: '#333' }}>Logout</span>
                            </div>
                        </div>
                    )}
                    <span style={{ fontSize: '18px', fontWeight: '500', color: '#333' }}>
                        {user?.name || 'Business Name'}
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingRight: '0'
                }}>
                    {/* Inbox Button */}
                    <button
                        onClick={() => setShowInboxModal(true)}
                        style={{
                            padding: '10px',
                            backgroundColor: '#00c4cc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '18px',
                            transition: 'background-color 0.2s',
                            boxShadow: '0 2px 8px rgba(0,196,204,0.3)',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#009999'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#00c4cc'}
                        title={unreadCount > 0 ? `Inbox (${unreadCount} unread)` : "Inbox"}
                    >
                        <FaInbox />
                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: '#dc3545',
                                    borderRadius: '50%',
                                    border: '2px solid #fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                            />
                        )}
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        border: '1px solid #ddd',
                        borderRadius: '20px',
                        backgroundColor: '#f5f5f5',
                        minWidth: '300px'
                    }}>
                        <FaSearch style={{ color: '#999' }} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                flex: 1,
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    
                    {/* Advanced Search Tab Button */}
                    <button
                        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            backgroundColor: showAdvancedSearch ? '#009999' : '#00c4cc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            height: '100%',
                            minHeight: '60px',
                            borderTop: showAdvancedSearch ? '3px solid #fff' : 'none'
                        }}
                    >
                        <span>Advanced Search</span>
                        {showAdvancedSearch ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
            </div>
            </header>

            {/* Main Content */}
            <main style={{ padding: '40px', position: 'relative' }}>
                {/* Title Section */}
                <div style={{
                    marginBottom: '40px'
                }}>
                    <h1 style={{
                        color: '#00c4cc',
                        fontSize: '3.5em',
                        letterSpacing: '-1px',
                        position: 'relative',
                        display: 'inline-block',
                        margin: '10px 0 0 0',
                        fontWeight: 'normal',
                        textDecoration: 'underline',
                        textDecorationColor: '#00c4cc',
                        textDecorationThickness: '2px'
                    }}>
                        Local Influencers
                    </h1>
                </div>

                {/* Backdrop Overlay */}
                {showAdvancedSearch && (
                    <div
                        onClick={() => setShowAdvancedSearch(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            zIndex: 98,
                            transition: 'opacity 0.3s ease'
                        }}
                    />
                )}

                {/* Advanced Search Side Panel */}
                {showAdvancedSearch && (
                    <div style={{
                        position: 'fixed',
                        top: '80px',
                        right: '0',
                        width: '400px',
                        height: 'calc(100vh - 80px)',
                        backgroundColor: '#fff',
                        boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
                        zIndex: 99,
                        overflowY: 'auto',
                        padding: '20px',
                        borderTop: '1px solid #e0e0e0',
                        borderLeft: '1px solid #e0e0e0'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 20px 0', 
                            fontSize: '20px', 
                            color: '#333',
                            fontWeight: '600',
                            borderBottom: '2px solid #00c4cc',
                            paddingBottom: '10px'
                        }}>
                            Advanced Search
                        </h3>

                        {/* Followers Range */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontSize: '14px', 
                                color: '#666',
                                fontWeight: '500'
                            }}>
                                # Followers Range:
                            </label>
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                alignItems: 'center',
                                width: '100%'
                            }}>
                                <div style={{ flex: '1 1 0', minWidth: '0' }}>
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.followersMin}
                                        onChange={(e) => setFilters(prev => ({ ...prev, followersMin: e.target.value }))}
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                    />
                                </div>
                                <span style={{ 
                                    color: '#666', 
                                    fontSize: '14px', 
                                    fontWeight: '500',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap',
                                    padding: '0 4px'
                                }}>
                                    to
                                </span>
                                <div style={{ flex: '1 1 0', minWidth: '0' }}>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.followersMax}
                                        onChange={(e) => setFilters(prev => ({ ...prev, followersMax: e.target.value }))}
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                    />
                                </div>
                            </div>
                            <p style={{ 
                                fontSize: '12px', 
                                color: '#999', 
                                marginTop: '6px',
                                marginBottom: '0'
                            }}>
                                Leave blank for no limit
                            </p>
                        </div>

                        {/* Location */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontSize: '14px', 
                                color: '#666',
                                fontWeight: '500'
                            }}>
                                Location:
                            </label>
                            <input
                                type="text"
                                placeholder="Enter location"
                                value={filters.location}
                                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>

                        {/* Industry */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '12px', 
                                fontSize: '14px', 
                                color: '#666',
                                fontWeight: '500'
                            }}>
                                Industry:
                            </label>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                gap: '10px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                paddingRight: '5px'
                            }}>
                                {[
                                    { key: 'fashion', label: 'Fashion' },
                                    { key: 'beauty', label: 'Beauty' },
                                    { key: 'fitness', label: 'Fitness' },
                                    { key: 'tech', label: 'Tech' },
                                    { key: 'food', label: 'Food' },
                                    { key: 'travel', label: 'Travel' },
                                    { key: 'lifestyle', label: 'Lifestyle' },
                                    { key: 'gaming', label: 'Gaming' },
                                    { key: 'music', label: 'Music' },
                                    { key: 'art', label: 'Art' },
                                    { key: 'education', label: 'Education' },
                                    { key: 'business', label: 'Business' },
                                    { key: 'health', label: 'Health' },
                                    { key: 'sports', label: 'Sports' },
                                    { key: 'entertainment', label: 'Entertainment' },
                                    { key: 'other', label: 'Other' }
                                ].map(({ key, label }) => (
                                    <label key={key} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.industry[key] || false}
                                            onChange={() => handleIndustryChange(key)}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                                        />
                                        <span style={{ color: '#333' }}>{label}</span>
                                    </label>
                                ))}
                            </div>
                            {/* Custom Industry Input - Show when "Other" is selected */}
                            {filters.industry.other && (
                                <div style={{ marginTop: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter custom industry"
                                        value={filters.customIndustry}
                                        onChange={(e) => handleCustomIndustryChange(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Socials */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '12px', 
                                fontSize: '14px', 
                                color: '#666',
                                fontWeight: '500'
                            }}>
                                Socials:
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { key: 'insta', label: 'Instagram', icon: FaInstagram },
                                    { key: 'fb', label: 'Facebook', icon: FaFacebook },
                                    { key: 'linkedin', label: 'LinkedIn', icon: FaLinkedin }
                                ].map(({ key, label, icon: Icon }) => (
                                    <label key={key} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.socials[key] || false}
                                            onChange={() => handleSocialChange(key)}
                                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                        />
                                        <Icon style={{ color: '#00c4cc', fontSize: '18px' }} />
                                        <span style={{ color: '#333' }}>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Influencer Cards */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginTop: '40px',
                    position: 'relative'
                }}>
                    {/* Left Arrow */}
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: currentIndex === 0 ? '#ccc' : '#00c4cc',
                            color: '#fff',
                            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            transition: 'background-color 0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            if (currentIndex > 0) {
                                e.target.style.backgroundColor = '#009999';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentIndex > 0) {
                                e.target.style.backgroundColor = '#00c4cc';
                            }
                        }}
                    >
                        <FaChevronLeft />
                    </button>

                    {/* Cards Container */}
                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        flex: 1,
                        justifyContent: 'center'
                    }}>
                        {displayedInfluencers.length > 0 ? (
                            displayedInfluencers.map((influencer) => {
                                const activeSocials = getActiveSocials(influencer);
                                return (
                                    <div
                                        key={influencer._id}
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            width: '300px',
                                            minHeight: '400px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '15px'
                                        }}
                                    >
                                        {/* Profile Picture */}
                                        <div style={{
                                            width: '100px',
                                            height: '100px',
                                            borderRadius: '50%',
                                            backgroundColor: '#00c4cc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            overflow: 'hidden'
                                        }}>
                                            {influencer.profilePicture ? (
                                                <img
                                                    src={influencer.profilePicture.startsWith('http') 
                                                        ? influencer.profilePicture 
                                                        : `http://localhost:5000${influencer.profilePicture}`}
                                                    alt={influencer.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                            ) : (
                                                <FaUser style={{ fontSize: '40px', color: '#fff' }} />
                                            )}
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Name:</label>
                                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                                                {influencer.name || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Followers per Social */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}># Followers per social:</label>
                                            <div style={{ fontSize: '14px', color: '#333' }}>
                                                {activeSocials.length > 0 ? `${activeSocials.length} platform(s) connected` : 'No platforms connected'}
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Location:</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#333' }}>
                                                <FaMapMarkerAlt style={{ color: '#00c4cc', fontSize: '14px' }} />
                                                <span>{influencer.location || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Description:</label>
                                            <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                                                {influencer.industry ? `Industry: ${influencer.industry}` : 'No description available'}
                                            </div>
                        </div>
                        
                                        {/* Socials */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '8px' }}>Socials:</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {activeSocials.length > 0 ? (
                                                    activeSocials.map((platform) => {
                                                        const Icon = getSocialIcon(platform);
                                                        const socialMedia = influencer.socialMedia || {};
                                                        const socialConnections = influencer.socialMediaConnections || {};
                                                        const handle = socialMedia[platform] || 
                                                                     socialConnections[platform]?.username ||
                                                                     socialConnections[platform]?.channelName ||
                                                                     socialConnections[platform]?.pageName ||
                                                                     socialConnections[platform]?.profileName;
                                                        // Get follower count - check multiple possible locations
                                                        // Also check for 'twitter' if platform is 'x' (backward compatibility)
                                                        const platformKey = (platform === 'x' && !socialConnections[platform]) ? 'twitter' : platform;
                                                        let followers = socialConnections[platform]?.followers ?? 
                                                                       socialConnections[platformKey]?.followers ??
                                                                       socialConnections[platform]?.followerCount ??
                                                                       socialConnections[platformKey]?.followerCount ??
                                                                       socialConnections[platform]?.stats?.followers ??
                                                                       null;
                                                        
                                                        // Convert to number if it's a string
                                                        if (followers !== null && followers !== undefined) {
                                                            const numFollowers = Number(followers);
                                                            followers = isNaN(numFollowers) ? null : numFollowers;
                                                        }
                                                        
                                                        // Debug: Always log for Instagram to see what's happening
                                                        if (platform === 'instagram') {
                                                            console.log(`[DEBUG CARD] ${influencer.name || 'Unknown'}, Platform: ${platform}`);
                                                            console.log('  - Raw followers:', socialConnections[platform]?.followers);
                                                            console.log('  - Processed followers:', followers);
                                                            console.log('  - socialConnections[platform]:', JSON.stringify(socialConnections[platform], null, 2));
                                                        }
                                                        
                                                        const url = handle ? getSocialMediaUrl(platform, handle) : null;
                                                        return Icon ? (
                                                            <button
                                                                key={platform}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (url) {
                                                                        handleSocialMediaClick(platform, handle);
                                                                    }
                                                                }}
                                                                disabled={!url}
                                                                style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '4px 8px',
                                                                    backgroundColor: url ? '#f5f5f5' : '#e0e0e0',
                                                                borderRadius: '6px',
                                                                    fontSize: '12px',
                                                                    border: '1px solid #ddd',
                                                                    cursor: url ? 'pointer' : 'not-allowed',
                                                                    transition: 'background-color 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (url) {
                                                                        e.target.style.backgroundColor = '#e8e8e8';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (url) {
                                                                        e.target.style.backgroundColor = '#f5f5f5';
                                                                    }
                                                                }}
                                                            >
                                                                <Icon style={{ color: '#00c4cc', fontSize: '14px' }} />
                                                                <span style={{ textTransform: 'capitalize' }}>
                                                                    {platform === 'x' || platform === 'twitter' ? 'X' : platform}
                                                                </span>
                                                                {(followers !== null && followers !== undefined && !isNaN(followers) && followers >= 0) ? (
                                                                    <span style={{ 
                                                                        color: '#666', 
                                                                        fontSize: '11px',
                                                                        fontWeight: '500',
                                                                        marginLeft: '2px'
                                                                    }}>
                                                                        • {followers.toLocaleString()}
                                                                    </span>
                                                                ) : (
                                                                    platform === 'instagram' && console.log(`[DEBUG] Not showing followers for ${platform}:`, { followers, isNull: followers === null, isUndefined: followers === undefined, isNaN: isNaN(followers), isNegative: followers < 0 }) || null
                                                                )}
                                                            </button>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#999' }}>No socials listed</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* View More Button */}
                                        <button
                                            onClick={() => {
                                                setSelectedInfluencer(influencer);
                                                setShowInfluencerModal(true);
                                            }}
                                            style={{
                                                marginTop: 'auto',
                                                padding: '10px 20px',
                                                backgroundColor: '#00c4cc',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                width: '100%',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#009999'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#00c4cc'}
                                        >
                                            View More
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{
                                width: '100%',
                                textAlign: 'center',
                                padding: '40px',
                                color: '#999',
                                fontSize: '16px'
                            }}>
                                No influencers found matching your criteria.
                            </div>
                        )}
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={handleNext}
                        disabled={currentIndex + 3 >= filteredInfluencers.length}
                        style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: currentIndex + 3 >= filteredInfluencers.length ? '#ccc' : '#00c4cc',
                            color: '#fff',
                            cursor: currentIndex + 3 >= filteredInfluencers.length ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            transition: 'background-color 0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            if (currentIndex + 3 < filteredInfluencers.length) {
                                e.target.style.backgroundColor = '#009999';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentIndex + 3 < filteredInfluencers.length) {
                                e.target.style.backgroundColor = '#00c4cc';
                            }
                        }}
                    >
                        <FaChevronRight />
                    </button>
                    </div>
                </main>

            {/* CHAT Button */}
            <button
                onClick={handleChat}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: '#00c4cc',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#009999';
                    e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#00c4cc';
                    e.target.style.transform = 'scale(1)';
                }}
            >
                CHAT
            </button>

            {/* AI Chat Modal */}
            {showChatModal && (
                <AIChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
            )}

            {/* Inbox Modal */}
            <InboxModal
                isOpen={showInboxModal}
                onClose={() => {
                    setShowInboxModal(false);
                    setInboxRecipientId(null);
                    setInboxRecipientName(null);
                }}
                user={user}
                token={token}
                initialRecipientId={inboxRecipientId}
                initialRecipientName={inboxRecipientName}
                onConversationRead={() => {
                    // Refresh unread count when a conversation is marked as read
                    setTimeout(() => {
                        fetchUnreadCount();
                    }, 300);
                }}
            />

            {/* Influencer Detail Modal */}
            {showInfluencerModal && selectedInfluencer && (
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
                    onClick={() => setShowInfluencerModal(false)}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '700px',
                            maxHeight: '90vh',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
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
                                fontWeight: '600'
                            }}>
                                {selectedInfluencer.name || 'Influencer Profile'}
                            </h2>
                            <button
                                onClick={() => setShowInfluencerModal(false)}
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

                        {/* Modal Content */}
                        <div style={{
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {/* Profile Picture */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    backgroundColor: '#00c4cc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {selectedInfluencer.profilePicture ? (
                                        <img
                                            src={selectedInfluencer.profilePicture.startsWith('http')
                                                ? selectedInfluencer.profilePicture
                                                : `http://localhost:5000${selectedInfluencer.profilePicture}`}
                                            alt={selectedInfluencer.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '50%'
                                            }}
                                        />
                                    ) : (
                                        <FaUser style={{ fontSize: '50px', color: '#fff' }} />
                                    )}
                                </div>
                            </div>

                            {/* Name */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Name:</label>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                                    {selectedInfluencer.name || 'N/A'}
                                </div>
                            </div>

                            {/* Gender */}
                            {selectedInfluencer.gender && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Gender:</label>
                                    <div style={{ fontSize: '14px', color: '#333' }}>
                                        {selectedInfluencer.gender}
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Location:</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333' }}>
                                    <FaMapMarkerAlt style={{ color: '#00c4cc', fontSize: '16px' }} />
                                    <span>{selectedInfluencer.location || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Industry */}
                            {selectedInfluencer.industry && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Industry:</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333' }}>
                                        <FaBriefcase style={{ color: '#00c4cc', fontSize: '16px' }} />
                                        <span>{selectedInfluencer.industry}</span>
                                    </div>
                                </div>
                            )}

                            {/* Follower Count */}
                            {(() => {
                                const totalFollowers = getTotalFollowers(selectedInfluencer);
                                return totalFollowers !== null && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Total Followers:</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333' }}>
                                            <FaUsers style={{ color: '#00c4cc', fontSize: '16px' }} />
                                            <span>{totalFollowers.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Background */}
                            {selectedInfluencer.background && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Background:</label>
                                    <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {selectedInfluencer.background}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {selectedInfluencer.description && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Description:</label>
                                    <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {selectedInfluencer.description}
                                    </div>
                                </div>
                            )}

                            {/* Personal Website */}
                            {selectedInfluencer.personalWebsite && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Personal Website:</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333' }}>
                                        <FaGlobe style={{ color: '#00c4cc', fontSize: '16px' }} />
                                        <a 
                                            href={selectedInfluencer.personalWebsite.startsWith('http') ? selectedInfluencer.personalWebsite : `https://${selectedInfluencer.personalWebsite}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#00c4cc', textDecoration: 'none' }}
                                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                        >
                                            {selectedInfluencer.personalWebsite}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Social Media */}
                            {(() => {
                                const socialMedia = selectedInfluencer.socialMedia || {};
                                const socialConnections = selectedInfluencer.socialMediaConnections || {};
                                
                                // Get all platforms with their handles
                                const platforms = ['instagram', 'tiktok', 'facebook', 'linkedin', 'x', 'twitter', 'snapchat', 'pinterest'];
                                const socialsWithHandles = platforms
                                    .map(platform => {
                                        // Check both socialMedia and socialMediaConnections for handles
                                        const handle = socialMedia[platform] || 
                                                     socialConnections[platform]?.username ||
                                                     socialConnections[platform]?.channelName ||
                                                     socialConnections[platform]?.pageName ||
                                                     socialConnections[platform]?.profileName;
                                        
                                        // Get follower count - check multiple possible locations
                                        // Also check for 'twitter' if platform is 'x' (backward compatibility)
                                        const platformKey = (platform === 'x' && !socialConnections[platform]) ? 'twitter' : platform;
                                        let followers = socialConnections[platform]?.followers ?? 
                                                       socialConnections[platformKey]?.followers ??
                                                       socialConnections[platform]?.followerCount ??
                                                       socialConnections[platformKey]?.followerCount ??
                                                       socialConnections[platform]?.stats?.followers ??
                                                       null;
                                        
                                        // Convert to number if it's a string
                                        if (followers !== null && followers !== undefined) {
                                            followers = Number(followers);
                                            if (isNaN(followers)) followers = null;
                                        }
                                        
                                        // Debug: log to see what data we have
                                        if (platform === 'instagram' && selectedInfluencer.name) {
                                            console.log(`[DEBUG MODAL] Influencer: ${selectedInfluencer.name}, Platform: ${platform}`);
                                            console.log('  - Followers value:', followers);
                                            console.log('  - socialConnections[platform]:', socialConnections[platform]);
                                            console.log('  - socialConnections[platform]?.followers:', socialConnections[platform]?.followers);
                                            console.log('  - Full selectedInfluencer object:', selectedInfluencer);
                                        }
                                        
                                        // Platform is active if it has a handle in socialMedia or is connected in socialMediaConnections
                                        const hasHandle = Boolean(socialMedia[platform]);
                                        const isConnected = Boolean(socialConnections[platform]?.connected);
                                        
                                        return { platform, handle, followers, isActive: hasHandle || isConnected };
                                    })
                                    .filter(item => item.isActive && item.handle);
                                
                                return socialsWithHandles.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '12px', fontWeight: '500' }}>Social Media:</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {socialsWithHandles.map(({ platform, handle, followers }) => {
                                                const Icon = getSocialIcon(platform);
                                                const url = getSocialMediaUrl(platform, handle);
                                                return Icon ? (
                                                    <button
                                                        key={platform}
                                                        onClick={() => handleSocialMediaClick(platform, handle)}
                                                        disabled={!url}
                                                        style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '8px 12px',
                                                            backgroundColor: url ? '#f5f5f5' : '#e0e0e0',
                                                        borderRadius: '8px',
                                                            fontSize: '13px',
                                                            border: '1px solid #ddd',
                                                            cursor: url ? 'pointer' : 'not-allowed',
                                                            transition: 'background-color 0.2s',
                                                            textAlign: 'left'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (url) {
                                                                e.target.style.backgroundColor = '#e8e8e8';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (url) {
                                                                e.target.style.backgroundColor = '#f5f5f5';
                                                            }
                                                        }}
                                                    >
                                                        <Icon style={{ color: '#00c4cc', fontSize: '16px' }} />
                                                        <span style={{ textTransform: 'capitalize' }}>
                                                            {platform === 'x' || platform === 'twitter' ? 'X' : platform}
                                                        </span>
                                                        <span style={{ color: '#999', fontSize: '12px' }}>
                                                            ({handle})
                                                        </span>
                                                        {followers !== null && followers !== undefined && !isNaN(followers) && followers >= 0 ? (
                                                            <span style={{ 
                                                                color: '#666', 
                                                                fontSize: '12px',
                                                                fontWeight: '500',
                                                                marginLeft: '4px'
                                                            }}>
                                                                • {followers.toLocaleString()} Followers
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer with Message Button */}
                        <div style={{
                            padding: '20px',
                            borderTop: '1px solid #e0e0e0',
                            backgroundColor: '#f8f9fa',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center'
                        }}>
                            <button
                                onClick={() => {
                                    // Set the recipient ID and name, then open inbox
                                    setInboxRecipientId(selectedInfluencer._id);
                                    setInboxRecipientName(selectedInfluencer.name);
                                    setShowInfluencerModal(false);
                                    setShowInboxModal(true);
                                }}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#00c4cc',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,196,204,0.3)'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#009999'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#00c4cc'}
                            >
                                <FaEnvelope />
                                Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessDashboardPage;
