import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUser, FaSearch, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp, FaInstagram, FaTiktok, FaYoutube, FaSnapchat, FaFacebook, FaCog, FaLinkedin, FaPinterest, FaSignOutAlt, FaQuestionCircle, FaTimes, FaGlobe, FaBriefcase, FaEnvelope, FaInbox, FaShieldAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import AIChatModal from '../components/AIChatModal';
import InboxModal from '../components/InboxModal';

const API_BASE_URL = 'http://localhost:5000/api/campaigns';
const BUSINESSES_API_URL = 'http://localhost:5000/api/v1/users/businesses';

const InfluencerDashboardPage = () => {
    const navigate = useNavigate();
    const { user, token, dispatch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        offers: {
            productService: false,
            revenueSharing: false,
            brandBuilding: false
        },
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
            retail: false,
            realEstate: false,
            finance: false,
            hospitality: false,
            automotive: false,
            homeGarden: false,
            petCare: false,
            other: false
        },
        customIndustry: '',
        socials: {
            insta: false,
            fb: false,
            linkedin: false
        }
    });
    const [hoveredTooltip, setHoveredTooltip] = useState(null);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const cardsContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showBusinessModal, setShowBusinessModal] = useState(false);
    const [showInboxModal, setShowInboxModal] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [inboxRecipientId, setInboxRecipientId] = useState(null);
    const [inboxRecipientName, setInboxRecipientName] = useState(null);
    const dropdownRef = useRef(null);

    // Check onboarding status on mount and redirect business users
    useEffect(() => {
        const checkOnboarding = async () => {
            if (user === undefined || token === undefined) {
                return;
            }

            if (!user || !token) {
                navigate('/auth', { replace: true });
                return;
            }

            // IMPORTANT: Redirect business users to business dashboard
            // This prevents business users from accessing influencer pages when clicking back
            if (user.role === 'business') {
                console.log('🔄 Business user detected on influencer dashboard, redirecting to business dashboard');
                navigate('/business-dashboard', { replace: true });
                return;
            }

            if (user.role === 'influencer' && !user.onboardingComplete) {
                navigate('/influencer-onboarding', { replace: true });
                return;
            }

            setLoading(false);
        };

        checkOnboarding();
    }, [user, token, navigate]);

    // Fetch businesses (all businesses with completed onboarding, not just those with campaigns)
    useEffect(() => {
        const fetchBusinesses = async () => {
            if (!token) return;

            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                };
                
                // Fetch all businesses that have completed onboarding
                const businessesResponse = await axios.get(BUSINESSES_API_URL, config);
                const allBusinesses = businessesResponse.data.data || [];
                
                // Also fetch campaigns to associate them with businesses
                let campaigns = [];
                try {
                    const campaignsResponse = await axios.get(API_BASE_URL, config);
                    campaigns = campaignsResponse.data.data.campaigns || [];
                } catch (campaignErr) {
                    console.error("Error fetching campaigns:", campaignErr);
                }
                
                // Create a map of businesses with their campaigns
                const businessMap = new Map();
                
                // First, add all businesses
                allBusinesses.forEach(business => {
                    businessMap.set(business._id, {
                        ...business,
                        campaigns: []
                    });
                });
                
                // Then, associate campaigns with businesses
                campaigns.forEach(campaign => {
                    if (campaign.business) {
                        const businessId = campaign.business._id || campaign.business;
                        if (businessMap.has(businessId)) {
                            const business = businessMap.get(businessId);
                            business.campaigns.push(campaign);
                        }
                    }
                });
                
                setBusinesses(Array.from(businessMap.values()));
                setFilteredBusinesses(Array.from(businessMap.values()));
            } catch (err) {
                console.error("Error fetching businesses:", err);
            }
        };

        if (token && !loading) {
            fetchBusinesses();
        }
    }, [token, loading]);

    // Filter businesses based on search and filters
    useEffect(() => {
        let filtered = [...businesses];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(business => 
                business.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                business.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                business.businessCategory?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Location filter
        if (filters.location) {
            filtered = filtered.filter(business => 
                business.location?.toLowerCase().includes(filters.location.toLowerCase())
            );
        }

        // Industry filter
        const hasIndustryFilter = Object.values(filters.industry).some(val => val);
        if (hasIndustryFilter) {
            filtered = filtered.filter(business => {
                if (!business.industry) return false;
                
                const businessIndustry = business.industry.toLowerCase();
                
                // Map industry keys to their display values (case-insensitive matching)
                const industryMap = {
                    fashion: 'fashion',
                    beauty: 'beauty',
                    fitness: 'fitness',
                    tech: 'tech',
                    food: 'food',
                    travel: 'travel',
                    lifestyle: 'lifestyle',
                    gaming: 'gaming',
                    music: 'music',
                    art: 'art',
                    education: 'education',
                    business: 'business',
                    health: 'health',
                    sports: 'sports',
                    entertainment: 'entertainment',
                    retail: 'retail',
                    realEstate: 'real estate',
                    finance: 'finance',
                    hospitality: 'hospitality',
                    automotive: 'automotive',
                    homeGarden: 'home & garden',
                    petCare: 'pet care'
                };
                
                // Check if business's industry matches any of the selected industries
                return Object.keys(filters.industry).some(industryKey => {
                    if (!filters.industry[industryKey]) return false;
                    
                    // Handle custom industry
                    if (industryKey === 'other' && filters.customIndustry) {
                        const customIndustryLower = filters.customIndustry.toLowerCase().trim();
                        return businessIndustry.includes(customIndustryLower);
                    }
                    
                    // Skip "other" if no custom text entered
                    if (industryKey === 'other') return false;
                    
                    const industryValue = industryMap[industryKey];
                    // Prioritize exact match, fallback to includes for flexibility
                    return businessIndustry === industryValue || businessIndustry.includes(industryValue);
                });
            });
        }

        // Offers filter (check if any offer type is selected)
        const hasOfferFilter = Object.values(filters.offers).some(val => val);
        if (hasOfferFilter) {
            filtered = filtered.filter(business => {
                // Check if business has offers data
                if (!business.offers) return false;
                
                // Check if business has any of the selected offer types
                return Object.keys(filters.offers).some(offerKey => {
                    if (!filters.offers[offerKey]) return false;
                    // Check if business has this offer type enabled
                    return business.offers[offerKey] === true;
                });
            });
        }

        // Socials filter
        const hasSocialFilter = Object.values(filters.socials).some(val => val);
        if (hasSocialFilter) {
            filtered = filtered.filter(business => {
                const socialMedia = business.socialMedia || {};
                const socialConnections = business.socialMediaConnections || {};
                
                // Map filter keys to actual platform names
                const platformMap = {
                    insta: ['instagram'],
                    fb: ['facebook'],
                    linkedin: ['linkedin']
                };
                
                // Check if business has any of the selected social media platforms
                return Object.keys(filters.socials).some(socialKey => {
                    if (!filters.socials[socialKey]) return false;
                    
                    const platforms = platformMap[socialKey] || [];
                    
                    // Check if business has any of the mapped platforms
                    return platforms.some(platform => {
                        // Check if platform exists in socialMedia or is connected in socialMediaConnections
                        return socialMedia[platform] || socialConnections[platform]?.connected;
                    });
                });
            });
        }

        setFilteredBusinesses(filtered);
        setCurrentIndex(0);
    }, [searchQuery, filters, businesses]);

    const handlePrev = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => Math.min(filteredBusinesses.length - 3, prev + 1));
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

    const handleOfferChange = (offerType) => {
        setFilters(prev => ({
            ...prev,
            offers: {
                ...prev.offers,
                [offerType]: !prev.offers[offerType]
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
        navigate('/influencer-onboarding?edit=true');
    };

    const handleSettings = () => {
        setShowDropdown(false);
        navigate('/influencer-settings');
    };

    const handlePrivacyPolicy = () => {
        setShowDropdown(false);
        navigate('/privacy-policy');
    };

    const handleLogout = () => {
        setShowDropdown(false);
        // Clear auth context
        dispatch({ type: 'LOGOUT' });
        // Navigate to home page (RoleSelectionPage with Fluenci)
        navigate('/', { replace: true });
    };

    // Helper function to get social media icons
    const getSocialIcon = (platform) => {
        const iconMap = {
            instagram: FaInstagram,
            snapchat: FaSnapchat,
            tiktok: FaTiktok,
            facebook: FaFacebook,
            youtube: FaYoutube,
            x: FaXTwitter,
            twitter: FaXTwitter,
            linkedin: FaLinkedin,
            pinterest: FaPinterest
        };
        return iconMap[platform.toLowerCase()] || null;
    };

    // Helper function to get active socials for a business
    const getActiveSocials = (business) => {
        const socials = [];
        const socialMedia = business.socialMedia || {};
        const socialConnections = business.socialMediaConnections || {};
        
        ['instagram', 'youtube', 'tiktok', 'facebook', 'snapchat', 'x', 'twitter', 'linkedin', 'pinterest'].forEach(platform => {
            if (socialMedia[platform] || socialConnections[platform]?.connected) {
                socials.push(platform);
            }
        });
        
        return socials;
    };

    // Helper function to get social media URL from handle/username
    const getSocialMediaUrl = (platform, business) => {
        const socialMedia = business.socialMedia || {};
        const socialConnections = business.socialMediaConnections || {};
        
        // Get handle from manual entry or OAuth connection
        let handle = socialMedia[platform] || socialConnections[platform]?.username || socialConnections[platform]?.channelName;
        
        if (!handle) return null;
        
        // Clean handle (remove @, URLs, etc.)
        handle = handle.trim();
        
        // Extract username from URLs first (before cleaning)
        const urlPatterns = {
            // Instagram: exclude p/, reel/, tv/, stories/ paths - only capture actual usernames
            instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?!p\/|reel\/|tv\/|stories\/)([a-zA-Z0-9._]+)/i,
            youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|user\/|@)?([^\/\?\s]+)/i,
            tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?([^\/\?\s]+)/i,
            facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([^\/\?\s]+)/i,
            linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/|company\/)?([^\/\?\s]+)/i,
            pinterest: /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/([^\/\?\s]+)/i,
            x: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([^\/\?\s]+)/i,
            twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([^\/\?\s]+)/i
        };
        
        // Try to extract username from URL first
        if (urlPatterns[platform]) {
            const match = handle.match(urlPatterns[platform]);
            if (match && match[1]) {
                handle = match[1];
                // Remove any trailing special characters
                handle = handle.replace(/[\/\?\#\s]+$/, '');
            } else {
                // If no URL pattern match, clean the handle
                handle = handle.replace(/^@/, ''); // Remove leading @
                handle = handle.replace(/^https?:\/\//, ''); // Remove http:// or https://
                handle = handle.replace(/^www\./, ''); // Remove www.
                // Remove domain if still present
                if (platform === 'instagram') {
                    // Remove instagram.com/ and any post/reel paths
                    handle = handle.replace(/^.*instagram\.com\//, '');
                    handle = handle.replace(/^(p|reel|tv|stories)\//, ''); // Remove post/reel prefixes if present
                }
                // Remove any trailing special characters
                handle = handle.replace(/[\/\?\#\s]+$/, '');
            }
        } else {
            // For platforms without URL patterns, just clean basic prefixes
            handle = handle.replace(/^@/, ''); // Remove leading @
            handle = handle.replace(/^https?:\/\//, ''); // Remove http:// or https://
            handle = handle.replace(/^www\./, ''); // Remove www.
            handle = handle.replace(/[\/\?\#\s]+$/, ''); // Remove trailing special characters
        }
        
        // Additional Instagram-specific cleaning
        if (platform === 'instagram') {
            // Remove any remaining invalid characters (Instagram usernames can only contain letters, numbers, periods, underscores)
            handle = handle.replace(/[^a-zA-Z0-9._]/g, '');
            // Remove leading/trailing periods and underscores
            handle = handle.replace(/^[._]+|[._]+$/g, '');
            // Remove consecutive periods
            handle = handle.replace(/\.{2,}/g, '.');
        }
        
        // Validate handle is not empty after cleaning
        if (!handle || handle.length === 0 || handle.trim().length === 0) return null;
        
        // Final trim
        handle = handle.trim();
        
        // Generate platform-specific URLs
        const urlMap = {
            instagram: `https://www.instagram.com/${handle}`,
            youtube: handle.startsWith('@') ? `https://youtube.com/${handle}` : `https://youtube.com/@${handle}`,
            tiktok: `https://tiktok.com/@${handle}`,
            facebook: `https://facebook.com/${handle}`,
            linkedin: handle.startsWith('in/') ? `https://linkedin.com/${handle}` : `https://linkedin.com/in/${handle}`,
            pinterest: `https://pinterest.com/${handle}`,
            x: `https://x.com/${handle}`,
            twitter: `https://x.com/${handle}`,
            snapchat: `https://snapchat.com/add/${handle}`
        };
        
        return urlMap[platform] || null;
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicturePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload the file
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
                // Refetch user data to get updated profile picture
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
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Show loading while checking onboarding status
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

    const displayedBusinesses = filteredBusinesses.slice(currentIndex, currentIndex + 3);

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
                        onMouseEnter={(e) => {
                            if (!uploading) {
                                e.target.style.opacity = '0.8';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!uploading) {
                                e.target.style.opacity = '1';
                            }
                        }}
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
                        {uploading && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%'
                            }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid white',
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                            </div>
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
                        {user?.name || 'Name'}
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
                            boxShadow: '0 2px 8px rgba(0,196,204,0.3)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#009999'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#00c4cc'}
                        title="Inbox"
                    >
                        <FaInbox />
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
                    
                    {/* Advanced Search Tab Button - Connected to Header */}
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
                        onMouseEnter={(e) => {
                            if (!showAdvancedSearch) {
                                e.target.style.backgroundColor = '#009999';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!showAdvancedSearch) {
                                e.target.style.backgroundColor = '#00c4cc';
                            }
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
                        fontWeight: 'normal'
                    }}>
                        Local Businesses
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
                        borderLeft: '1px solid #e0e0e0',
                        animation: 'slideInRight 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column'
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

                    {/* Offers */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '12px', 
                            fontSize: '14px', 
                            color: '#666',
                            fontWeight: '500'
                        }}>
                            Offers:
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                {
                                    key: 'productService',
                                    label: 'Product/Service Compensation',
                                    tooltip: 'Direct payment or free products/services in exchange for promotion. Examples: $500 per post, free products, paid partnerships, cash compensation.'
                                },
                                {
                                    key: 'revenueSharing',
                                    label: 'Revenue-Sharing & Discount Offers',
                                    tooltip: 'Earn a percentage of sales or receive exclusive discounts. Examples: 20% commission on sales, affiliate programs, discount codes, profit sharing.'
                                },
                                {
                                    key: 'brandBuilding',
                                    label: 'Brand-Building & Network Opportunities',
                                    tooltip: 'Grow your brand through exposure and partnerships. Examples: brand partnerships, networking events, exposure opportunities, collaboration for mutual growth.'
                                }
                            ].map(({ key, label, tooltip }) => (
                                <div key={key} style={{ position: 'relative' }}>
                                    <label style={{
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
                                            checked={filters.offers[key] || false}
                                            onChange={() => handleOfferChange(key)}
                                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                        />
                                        <span style={{ color: '#333', flex: 1 }}>{label}</span>
                                        <div
                                            style={{ position: 'relative' }}
                                            onMouseEnter={() => setHoveredTooltip(key)}
                                            onMouseLeave={() => setHoveredTooltip(null)}
                                        >
                                            <FaQuestionCircle 
                                                style={{ 
                                                    color: '#00c4cc', 
                                                    fontSize: '16px',
                                                    cursor: 'help'
                                                }} 
                                            />
                                            {hoveredTooltip === key && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '100%',
                                                    right: '0',
                                                    marginBottom: '8px',
                                                    padding: '10px 12px',
                                                    backgroundColor: '#333',
                                                    color: '#fff',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    width: '280px',
                                                    zIndex: 1000,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                    lineHeight: '1.5',
                                                    whiteSpace: 'normal',
                                                    wordWrap: 'break-word'
                                                }}>
                                                    {tooltip}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: '20px',
                                                        border: '6px solid transparent',
                                                        borderTopColor: '#333'
                                                    }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
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
                            value={filters.location}
                            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Filter by location..."
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                outline: 'none',
                                fontSize: '14px',
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
                                { key: 'retail', label: 'Retail' },
                                { key: 'realEstate', label: 'Real Estate' },
                                { key: 'finance', label: 'Finance' },
                                { key: 'hospitality', label: 'Hospitality' },
                                { key: 'automotive', label: 'Automotive' },
                                { key: 'homeGarden', label: 'Home & Garden' },
                                { key: 'petCare', label: 'Pet Care' },
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
                    <div>
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

                {/* Business Cards */}
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
                        {displayedBusinesses.length > 0 ? (
                            displayedBusinesses.map((business) => {
                                const activeSocials = getActiveSocials(business);
                                return (
                                    <div
                                        key={business._id}
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
                                            {business.profilePicture ? (
                                                <img
                                                    src={business.profilePicture.startsWith('http') 
                                                        ? business.profilePicture 
                                                        : `http://localhost:5000${business.profilePicture}`}
                                                    alt={business.name}
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
                                                {business.name || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Location:</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#333' }}>
                                                <FaMapMarkerAlt style={{ color: '#00c4cc', fontSize: '14px' }} />
                                                <span>{business.location || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Description:</label>
                                            <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                                                {business.industry ? `Industry: ${business.industry}` : 'No description available'}
                                            </div>
                                        </div>

                                        {/* Offers */}
                                        {business.offers && (business.offers.productService || business.offers.revenueSharing || business.offers.brandBuilding) && (
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '8px' }}>Offers:</label>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {business.offers.productService && (
                                                        <div>
                                                            <div style={{
                                                                padding: '6px 10px',
                                                                backgroundColor: '#e8f5e9',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                color: '#2e7d32',
                                                                fontWeight: '500',
                                                                marginBottom: '4px'
                                                            }}>
                                                                ✓ Product/Service Compensation
                                                            </div>
                                                            {business.offers.productServiceDescription && (
                                                                <div style={{
                                                                    fontSize: '11px',
                                                                    color: '#666',
                                                                    padding: '6px 10px',
                                                                    backgroundColor: '#f8f9fa',
                                                                    borderRadius: '4px',
                                                                    lineHeight: '1.4',
                                                                    marginLeft: '4px'
                                                                }}>
                                                                    {business.offers.productServiceDescription}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {business.offers.revenueSharing && (
                                                        <div>
                                                            <div style={{
                                                                padding: '6px 10px',
                                                                backgroundColor: '#e3f2fd',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                color: '#1565c0',
                                                                fontWeight: '500',
                                                                marginBottom: '4px'
                                                            }}>
                                                                ✓ Revenue-Sharing & Discount Offers
                                                            </div>
                                                            {business.offers.revenueSharingDescription && (
                                                                <div style={{
                                                                    fontSize: '11px',
                                                                    color: '#666',
                                                                    padding: '6px 10px',
                                                                    backgroundColor: '#f8f9fa',
                                                                    borderRadius: '4px',
                                                                    lineHeight: '1.4',
                                                                    marginLeft: '4px'
                                                                }}>
                                                                    {business.offers.revenueSharingDescription}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {business.offers.brandBuilding && (
                                                        <div>
                                                            <div style={{
                                                                padding: '6px 10px',
                                                                backgroundColor: '#fff3e0',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                color: '#e65100',
                                                                fontWeight: '500',
                                                                marginBottom: '4px'
                                                            }}>
                                                                ✓ Brand-Building & Network Opportunities
                                                            </div>
                                                            {business.offers.brandBuildingDescription && (
                                                                <div style={{
                                                                    fontSize: '11px',
                                                                    color: '#666',
                                                                    padding: '6px 10px',
                                                                    backgroundColor: '#f8f9fa',
                                                                    borderRadius: '4px',
                                                                    lineHeight: '1.4',
                                                                    marginLeft: '4px'
                                                                }}>
                                                                    {business.offers.brandBuildingDescription}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Socials */}
                                        <div>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '8px' }}>Socials:</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {activeSocials.length > 0 ? (
                                                    activeSocials.map((platform) => {
                                                        const Icon = getSocialIcon(platform);
                                                        const socialUrl = getSocialMediaUrl(platform, business);
                                                        return Icon ? (
                                                            socialUrl ? (
                                                                <a
                                                                    key={platform}
                                                                    href={socialUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        padding: '4px 8px',
                                                                        backgroundColor: '#f5f5f5',
                                                                        borderRadius: '6px',
                                                                        fontSize: '12px',
                                                                        textDecoration: 'none',
                                                                        color: '#333',
                                                                        cursor: 'pointer',
                                                                        transition: 'background-color 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.backgroundColor = '#e0e0e0';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                                                                    }}
                                                                >
                                                                    <Icon style={{ color: '#00c4cc', fontSize: '14px' }} />
                                                                    <span style={{ textTransform: 'capitalize' }}>
                                                                        {platform === 'x' || platform === 'twitter' ? 'X' : platform}
                                                                    </span>
                                                                </a>
                                                            ) : (
                                                                <div key={platform} style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#f5f5f5',
                                                                    borderRadius: '6px',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    <Icon style={{ color: '#00c4cc', fontSize: '14px' }} />
                                                                    <span style={{ textTransform: 'capitalize' }}>
                                                                        {platform === 'x' || platform === 'twitter' ? 'X' : platform}
                                                                    </span>
                                                                </div>
                                                            )
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
                                                setSelectedBusiness(business);
                                                setShowBusinessModal(true);
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
                                No businesses found matching your criteria.
                            </div>
                        )}
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={handleNext}
                        disabled={currentIndex + 3 >= filteredBusinesses.length}
                        style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: currentIndex + 3 >= filteredBusinesses.length ? '#ccc' : '#00c4cc',
                            color: '#fff',
                            cursor: currentIndex + 3 >= filteredBusinesses.length ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            transition: 'background-color 0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            if (currentIndex + 3 < filteredBusinesses.length) {
                                e.target.style.backgroundColor = '#009999';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentIndex + 3 < filteredBusinesses.length) {
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
                    backgroundColor: 'transparent',
                    border: '3px solid #00c4cc',
                    borderRadius: '50px',
                    padding: '15px 40px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#00c4cc',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,196,204,0.3)',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#00c4cc';
                    e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#00c4cc';
                }}
            >
                CHAT
            </button>

            {/* AI Chat Modal */}
            <AIChatModal 
                isOpen={showChatModal} 
                onClose={() => setShowChatModal(false)} 
            />

            {/* Inbox Modal */}
            <InboxModal
                isOpen={showInboxModal}
                onClose={() => {
                    setShowInboxModal(false);
                    setInboxRecipientId(null); // Reset recipient when closing
                    setInboxRecipientName(null); // Reset recipient name when closing
                }}
                user={user}
                token={token}
                initialRecipientId={inboxRecipientId}
                initialRecipientName={inboxRecipientName}
            />

            {/* Business Detail Modal */}
            {showBusinessModal && selectedBusiness && (
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
                    onClick={() => setShowBusinessModal(false)}
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
                                {selectedBusiness.name || 'Business Profile'}
                            </h2>
                            <button
                                onClick={() => setShowBusinessModal(false)}
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
                                    {selectedBusiness.profilePicture ? (
                                        <img
                                            src={selectedBusiness.profilePicture.startsWith('http')
                                                ? selectedBusiness.profilePicture
                                                : `http://localhost:5000${selectedBusiness.profilePicture}`}
                                            alt={selectedBusiness.name}
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

                            {/* Company Name */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Company Name:</label>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                                    {selectedBusiness.name || 'N/A'}
                                </div>
                            </div>

                            {/* Company Description */}
                            {selectedBusiness.description && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Company Description:</label>
                                    <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                        {selectedBusiness.description}
                                    </div>
                                </div>
                            )}

                            {/* Website */}
                            {selectedBusiness.website && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Website:</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333' }}>
                                        <FaGlobe style={{ color: '#00c4cc', fontSize: '16px' }} />
                                        <a
                                            href={selectedBusiness.website.startsWith('http') ? selectedBusiness.website : `https://${selectedBusiness.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: '#00c4cc',
                                                textDecoration: 'none',
                                                wordBreak: 'break-all'
                                            }}
                                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                        >
                                            {selectedBusiness.website}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Location:</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333' }}>
                                    <FaMapMarkerAlt style={{ color: '#00c4cc', fontSize: '16px' }} />
                                    <span>{selectedBusiness.location || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Industry */}
                            {selectedBusiness.industry && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Industry:</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333' }}>
                                        <FaBriefcase style={{ color: '#00c4cc', fontSize: '16px' }} />
                                        <span>{selectedBusiness.industry}</span>
                                    </div>
                                </div>
                            )}

                            {/* Offers */}
                            {selectedBusiness.offers && (selectedBusiness.offers.productService || selectedBusiness.offers.revenueSharing || selectedBusiness.offers.brandBuilding) && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '12px', fontWeight: '500' }}>Offers:</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {selectedBusiness.offers.productService && (
                                            <div>
                                                <div style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: '#e8f5e9',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    color: '#2e7d32',
                                                    fontWeight: '500',
                                                    marginBottom: '6px'
                                                }}>
                                                    ✓ Product/Service Compensation
                                                </div>
                                                {selectedBusiness.offers.productServiceDescription && (
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: '#666',
                                                        padding: '10px 12px',
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: '6px',
                                                        lineHeight: '1.5',
                                                        marginLeft: '4px'
                                                    }}>
                                                        {selectedBusiness.offers.productServiceDescription}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {selectedBusiness.offers.revenueSharing && (
                                            <div>
                                                <div style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: '#e3f2fd',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    color: '#1565c0',
                                                    fontWeight: '500',
                                                    marginBottom: '6px'
                                                }}>
                                                    ✓ Revenue-Sharing & Discount Offers
                                                </div>
                                                {selectedBusiness.offers.revenueSharingDescription && (
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: '#666',
                                                        padding: '10px 12px',
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: '6px',
                                                        lineHeight: '1.5',
                                                        marginLeft: '4px'
                                                    }}>
                                                        {selectedBusiness.offers.revenueSharingDescription}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {selectedBusiness.offers.brandBuilding && (
                                            <div>
                                                <div style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: '#fff3e0',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    color: '#e65100',
                                                    fontWeight: '500',
                                                    marginBottom: '6px'
                                                }}>
                                                    ✓ Brand-Building & Network Opportunities
                                                </div>
                                                {selectedBusiness.offers.brandBuildingDescription && (
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: '#666',
                                                        padding: '10px 12px',
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: '6px',
                                                        lineHeight: '1.5',
                                                        marginLeft: '4px'
                                                    }}>
                                                        {selectedBusiness.offers.brandBuildingDescription}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Social Media */}
                            {(() => {
                                const businessSocials = getActiveSocials(selectedBusiness);
                                return businessSocials.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '12px', fontWeight: '500' }}>Social Media:</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {businessSocials.map((platform) => {
                                                const Icon = getSocialIcon(platform);
                                                const socialUrl = getSocialMediaUrl(platform, selectedBusiness);
                                                const handle = selectedBusiness.socialMedia?.[platform] || selectedBusiness.socialMediaConnections?.[platform]?.username || selectedBusiness.socialMediaConnections?.[platform]?.channelName;
                                                return Icon ? (
                                                    socialUrl ? (
                                                        <a
                                                            key={platform}
                                                            href={socialUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '8px 12px',
                                                                backgroundColor: '#f5f5f5',
                                                                borderRadius: '8px',
                                                                fontSize: '13px',
                                                                textDecoration: 'none',
                                                                color: '#333',
                                                                cursor: 'pointer',
                                                                transition: 'background-color 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#e0e0e0';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                                            }}
                                                        >
                                                            <Icon style={{ color: '#00c4cc', fontSize: '16px' }} />
                                                            <span style={{ textTransform: 'capitalize' }}>
                                                                {platform === 'x' || platform === 'twitter' ? 'X' : platform}
                                                            </span>
                                                            {handle && (
                                                                <span style={{ color: '#999', fontSize: '12px' }}>
                                                                    ({handle.replace(/^@/, '').replace(/^https?:\/\//, '').replace(/^www\./, '')})
                                                                </span>
                                                            )}
                                                        </a>
                                                    ) : (
                                                        <div key={platform} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 12px',
                                                            backgroundColor: '#f5f5f5',
                                                            borderRadius: '8px',
                                                            fontSize: '13px'
                                                        }}>
                                                            <Icon style={{ color: '#00c4cc', fontSize: '16px' }} />
                                                            <span style={{ textTransform: 'capitalize' }}>
                                                                {platform === 'x' || platform === 'twitter' ? 'X' : platform}
                                                            </span>
                                                            {handle && (
                                                                <span style={{ color: '#999', fontSize: '12px' }}>
                                                                    ({handle.replace(/^@/, '').replace(/^https?:\/\//, '').replace(/^www\./, '')})
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
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
                                    setInboxRecipientId(selectedBusiness._id);
                                    setInboxRecipientName(selectedBusiness.name);
                                    setShowBusinessModal(false);
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

export default InfluencerDashboardPage;
