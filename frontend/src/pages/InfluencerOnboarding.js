import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaMapMarkerAlt, FaBriefcase, FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaLinkedin, FaCamera, FaSnapchat, FaPinterest, FaArrowLeft, FaGlobe, FaFileAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import SocialConnectModal from '../components/SocialConnectModal';

// Social Connect Button Component
const SocialConnectButton = ({ platform, icon, token, onConnect, connected }) => {
    const platformColors = {
        instagram: '#E4405F',
        youtube: '#FF0000',
        tiktok: '#000000',
        twitter: '#000000',
        x: '#000000',
        facebook: '#1877F2',
        linkedin: '#0077B5',
        snapchat: '#FFFC00',
        pinterest: '#E60023'
    };

    return (
        <button
            type="button"
            onClick={() => onConnect(platform)}
            disabled={connected}
            style={{
                padding: '12px',
                border: `2px solid ${connected ? '#28a745' : platformColors[platform] || '#00c4cc'}`,
                borderRadius: '8px',
                backgroundColor: connected ? '#28a745' : '#fff',
                color: connected ? '#fff' : platformColors[platform] || '#00c4cc',
                cursor: connected ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.9em',
                fontWeight: '600',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                if (!connected) {
                    e.target.style.backgroundColor = platformColors[platform] || '#00c4cc';
                    e.target.style.color = '#fff';
                }
            }}
            onMouseLeave={(e) => {
                if (!connected) {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.color = platformColors[platform] || '#00c4cc';
                }
            }}
        >
            <span style={{ fontSize: '1.5em' }}>{icon}</span>
            <span style={{ textTransform: 'capitalize' }}>
                {connected ? 'Connected' : platform}
            </span>
        </button>
    );
};

const InfluencerOnboarding = () => {
    const navigate = useNavigate();
    const { user, token, dispatch, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState({});
    const [showSocialModal, setShowSocialModal] = useState(false);
    const [selectedSocialPlatform, setSelectedSocialPlatform] = useState(null);

    // Protect route - redirect if not logged in or not an influencer
    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) {
            return;
        }

        if (!user || !token) {
            navigate('/auth', { replace: true });
            return;
        }
        
        // CRITICAL: If user is a business user, redirect immediately
        if (user.role === 'business') {
            console.log('🔄 Business user detected on influencer profile page, redirecting to business dashboard');
            navigate('/business-dashboard', { replace: true });
            return;
        }
        
        // Ensure user is an influencer
        if (user.role !== 'influencer') {
            navigate('/business-dashboard', { replace: true });
            return;
        }
        
        // Check if we're in edit mode (from settings)
        const urlParams = new URLSearchParams(window.location.search);
        const editMode = urlParams.get('edit') === 'true';
        setIsEditMode(editMode);
        
        // If onboarding is already complete and not in edit mode, redirect to dashboard
        if (user.onboardingComplete && !editMode) {
            navigate('/influencer-dashboard', { replace: true });
            return;
        }

        setIsChecking(false);
    }, [user, token, navigate, authLoading]);

    // Handle browser back button and page navigation - ensure influencer users stay on influencer pages
    useEffect(() => {
        if (!user || user.role !== 'influencer' || isChecking) return;
        
        // Immediate check: If user is on a business page, redirect them immediately
        const checkAndRedirect = () => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('business') && currentPath !== '/auth') {
                console.log('🔄 Influencer user detected on business page, redirecting to influencer profile');
                navigate('/influencer-onboarding?edit=true', { replace: true });
                return true;
            }
            return false;
        };
        
        // Check immediately on mount/update
        if (checkAndRedirect()) {
            return;
        }
        
        // Handle browser back button
        const handlePopState = (event) => {
            // Small delay to let the navigation complete
            setTimeout(() => {
                if (user && user.role === 'influencer') {
                    const newPath = window.location.pathname;
                    // If back button takes them to business pages, redirect to influencer profile
                    if (newPath.includes('business') && newPath !== '/auth') {
                        console.log('🔄 Back button took influencer user to business page, redirecting to influencer profile');
                        navigate('/influencer-onboarding?edit=true', { replace: true });
                    }
                }
            }, 50);
        };
        
        // Also check on location change (for programmatic navigation)
        const handleLocationChange = () => {
            setTimeout(() => {
                checkAndRedirect();
            }, 50);
        };
        
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('locationchange', handleLocationChange);
        
        // Also check periodically (as a safety net)
        const intervalId = setInterval(() => {
            if (user && user.role === 'influencer' && !isChecking) {
                checkAndRedirect();
            }
        }, 500);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('locationchange', handleLocationChange);
            clearInterval(intervalId);
        };
    }, [user, navigate, isChecking]);
    
    const [formData, setFormData] = useState({
        name: '',
        gender: '',
        location: '',
        industry: '',
        background: '',
        personalWebsite: '',
        socialMedia: {
            instagram: '',
            youtube: '',
            tiktok: '',
            x: '',
            facebook: '',
            linkedin: '',
            snapchat: '',
            pinterest: ''
        },
        socialMediaFollowers: {
            instagram: '',
            youtube: '',
            tiktok: '',
            x: '',
            facebook: '',
            linkedin: '',
            snapchat: '',
            pinterest: ''
        }
    });

    // Pre-populate form data if in edit mode and user has existing data
    useEffect(() => {
        if (isEditMode && user && !isChecking) {
            setFormData({
                name: user.name || '',
                gender: user.gender || '',
                location: user.location || '',
                industry: user.industry || '',
                background: user.background || '',
                personalWebsite: user.personalWebsite || '',
                socialMedia: {
                    instagram: user.socialMedia?.instagram || '',
                    youtube: user.socialMedia?.youtube || '',
                    tiktok: user.socialMedia?.tiktok || '',
                    x: user.socialMedia?.x || user.socialMedia?.twitter || '', // Support both x and twitter for backward compatibility
                    facebook: user.socialMedia?.facebook || '',
                    linkedin: user.socialMedia?.linkedin || '',
                    snapchat: user.socialMedia?.snapchat || '',
                    pinterest: user.socialMedia?.pinterest || ''
                },
                socialMediaFollowers: {
                    instagram: user.socialMediaConnections?.instagram?.followers?.toString() || '',
                    youtube: user.socialMediaConnections?.youtube?.followers?.toString() || '',
                    tiktok: user.socialMediaConnections?.tiktok?.followers?.toString() || '',
                    x: (user.socialMediaConnections?.x?.followers || user.socialMediaConnections?.twitter?.followers)?.toString() || '',
                    facebook: user.socialMediaConnections?.facebook?.followers?.toString() || '',
                    linkedin: user.socialMediaConnections?.linkedin?.followers?.toString() || '',
                    snapchat: user.socialMediaConnections?.snapchat?.followers?.toString() || '',
                    pinterest: user.socialMediaConnections?.pinterest?.followers?.toString() || ''
                }
            });
            // Set profile picture preview if exists
            if (user.profilePicture) {
                setProfilePicturePreview(
                    user.profilePicture.startsWith('http') 
                        ? user.profilePicture 
                        : `http://localhost:5000${user.profilePicture}`
                );
            }
        }
    }, [isEditMode, user, isChecking]);

    // Fetch connected social media accounts
    const fetchConnectedAccounts = useCallback(async () => {
        if (!token) return;

        try {
            const res = await fetch('http://localhost:5000/api/v1/social/connections', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.success) {
                const connected = {};
                Object.keys(data.data).forEach(platform => {
                    connected[platform] = data.data[platform].connected || false;
                });
                setConnectedAccounts(connected);
            }
        } catch (err) {
            console.error('Error fetching connected accounts:', err);
        }
    }, [token]);

    useEffect(() => {
        if (token && !isChecking) {
            fetchConnectedAccounts();
        }
    }, [token, isChecking, fetchConnectedAccounts]);

    const handleConnectSocial = (platform) => {
        // Store return URL for influencer profile page before any navigation
        const returnUrl = '/influencer-onboarding?edit=true';
        sessionStorage.setItem('oauth_return_url', returnUrl);
        localStorage.setItem('oauth_return_url_backup', returnUrl);
        // Store flag to indicate we came from profile page
        sessionStorage.setItem('from_influencer_profile', 'true');
        
        // Only show modal for Instagram and Facebook
        if (platform === 'instagram' || platform === 'facebook') {
            setSelectedSocialPlatform(platform);
            setShowSocialModal(true);
        } else {
            // For other platforms (like LinkedIn), navigate to connection page
            navigate(`/connect-social/${platform}`);
        }
    };

    const handleSocialModalClose = () => {
        setShowSocialModal(false);
        setSelectedSocialPlatform(null);
        // Refresh connected accounts when modal closes
        fetchConnectedAccounts();
    };

    const handleSocialModalSuccess = (platform) => {
        // Refresh connected accounts
        fetchConnectedAccounts();
        // Close modal after a short delay to show success message
        setTimeout(() => {
            setShowSocialModal(false);
            setSelectedSocialPlatform(null);
        }, 2000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSocialMediaChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: {
                ...prev.socialMedia,
                [platform]: value
            }
        }));
    };

    const handleFollowerCountChange = (platform, value) => {
        // Only allow numbers
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({
            ...prev,
            socialMediaFollowers: {
                ...prev.socialMediaFollowers,
                [platform]: numericValue
            }
        }));
    };


    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            setProfilePicture(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Validation
        if (!formData.gender || !formData.location || !formData.industry) {
            setError('Please fill in all required fields (Gender, Location, and Industry).');
            setLoading(false);
            return;
        }

        // Validate name if provided
        if (formData.name && formData.name.trim().length === 0) {
            setError('Name cannot be empty.');
            setLoading(false);
            return;
        }

        try {
            // Create FormData for file upload
            const formDataToSend = new FormData();
            if (formData.name) {
                formDataToSend.append('name', formData.name);
            }
            formDataToSend.append('gender', formData.gender);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('industry', formData.industry);
            if (formData.background) {
                formDataToSend.append('background', formData.background);
            }
            if (formData.personalWebsite) {
                formDataToSend.append('personalWebsite', formData.personalWebsite);
            }
            formDataToSend.append('socialMedia', JSON.stringify(formData.socialMedia));
            
            // Add follower counts to socialMediaConnections
            const socialMediaConnections = {};
            Object.keys(formData.socialMedia).forEach(platform => {
                const handle = formData.socialMedia[platform];
                const followers = formData.socialMediaFollowers[platform];
                if (handle && handle.trim()) {
                    // Map 'x' to 'twitter' for backend compatibility
                    const backendPlatform = platform === 'x' ? 'twitter' : platform;
                    let followerCount = null;
                    if (followers && followers.trim()) {
                        const parsed = parseInt(followers.trim());
                        followerCount = isNaN(parsed) ? null : parsed;
                    }
                    socialMediaConnections[backendPlatform] = {
                        connected: false,
                        username: handle.trim(),
                        followers: followerCount
                    };
                }
            });
            if (Object.keys(socialMediaConnections).length > 0) {
                formDataToSend.append('socialMediaConnections', JSON.stringify(socialMediaConnections));
                console.log('[DEBUG] Sending socialMediaConnections:', JSON.stringify(socialMediaConnections, null, 2));
            }
            
            // Add profile picture if selected
            if (profilePicture) {
                formDataToSend.append('profilePicture', profilePicture);
            }

            const res = await fetch('http://localhost:5000/api/v1/users/onboarding', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type header - browser will set it with boundary for FormData
                },
                body: formDataToSend,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to complete onboarding. Please try again.');
                return;
            }

            if (data.success) {
                // Fetch updated user data to refresh context
                try {
                    const userRes = await fetch('http://localhost:5000/api/v1/auth/me', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    const userData = await userRes.json();
                    if (userData.success && dispatch) {
                        dispatch({
                            type: 'SET_USER',
                            payload: userData.data
                        });
                    }
                } catch (err) {
                    console.error('Error fetching updated user:', err);
                }

                // Show success message
                if (isEditMode) {
                    setError(null);
                    // Show success message briefly before redirecting
                    const successMsg = document.createElement('div');
                    successMsg.className = 'alert alert-success';
                    successMsg.textContent = 'Profile updated successfully!';
                    successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 15px 20px; background-color: #28a745; color: white; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
                    document.body.appendChild(successMsg);
                    setTimeout(() => {
                        successMsg.remove();
                        navigate('/influencer-dashboard', { replace: true });
                    }, 2000);
                } else {
                    navigate('/influencer-dashboard', { replace: true });
                }
            } else {
                setError(data.error || 'Failed to complete onboarding.');
            }
        } catch (err) {
            console.error('Onboarding error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking auth status
    if (authLoading || isChecking) {
        return (
            <div className="role-selection-wrapper">
                <div className="header-graphic">
                    <div className="shape-1"></div>
                    <div className="shape-2"></div>
                    <div className="shape-3"></div>
                    <div className="shape-4"></div>
                    <div className="shape-5"></div>
                </div>
                {/* Back Button */}
                <button
                    className="back-button"
                    onClick={() => navigate('/influencer-dashboard')}
                >
                    <FaArrowLeft /> Back
                </button>
                <div className="auth-card" style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center' }}>
                    <h2 style={{ color: '#00c4cc' }}>Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="role-selection-wrapper">
            {/* Background Graphics */}
            <div className="header-graphic">
                <div className="shape-1"></div>
                <div className="shape-2"></div>
                <div className="shape-3"></div>
                <div className="shape-4"></div>
                <div className="shape-5"></div>
            </div>

            {/* Back Button */}
            <button
                className="back-button"
                onClick={() => navigate('/influencer-dashboard')}
            >
                <FaArrowLeft /> Back
            </button>

            <div className="auth-card" style={{ maxWidth: '600px', margin: '50px auto' }}>
                <h2 style={{ color: '#00c4cc', marginBottom: '10px', textAlign: 'center' }}>
                    {isEditMode ? 'Edit Your Profile' : 'Complete Your Profile'}
                </h2>
                <p style={{ color: '#666', marginBottom: '30px', textAlign: 'center', fontSize: '0.9em' }}>
                    {isEditMode 
                        ? `Update your profile information, social media connections, and career field.`
                        : `Welcome, ${user?.name || 'Influencer'}! Let's set up your profile to get started.`
                    }
                </p>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Profile Picture Upload */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <label style={{ display: 'block', marginBottom: '10px', color: '#333', fontWeight: '600' }}>
                            Profile Picture (Optional)
                        </label>
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                border: '3px solid #00c4cc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                backgroundColor: '#f5f5f5',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onClick={() => document.getElementById('profilePictureInput').click()}
                            >
                                {profilePicturePreview ? (
                                    <img 
                                        src={profilePicturePreview} 
                                        alt="Profile preview" 
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'cover' 
                                        }} 
                                    />
                                ) : (
                                    <FaCamera style={{ fontSize: '2em', color: '#00c4cc' }} />
                                )}
                            </div>
                            <input
                                type="file"
                                id="profilePictureInput"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => document.getElementById('profilePictureInput').click()}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#00c4cc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.9em',
                                    fontWeight: '600'
                                }}
                            >
                                {profilePicture ? 'Change Picture' : 'Upload Picture'}
                            </button>
                            {profilePicture && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfilePicture(null);
                                        setProfilePicturePreview(null);
                                        document.getElementById('profilePictureInput').value = '';
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#e74c3c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '0.85em'
                                    }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    {isEditMode && (
                        <div className="form-group">
                            <FaUser className="form-icon" />
                            <input
                                type="text"
                                name="name"
                                placeholder="Your Name *"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    {/* Background */}
                    {isEditMode && (
                        <div className="form-group">
                            <FaFileAlt className="form-icon" style={{ alignSelf: 'flex-start', marginTop: '12px' }} />
                            <textarea
                                name="background"
                                placeholder="Background (Tell us about yourself, your experience, etc.)"
                                value={formData.background}
                                onChange={handleChange}
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '1em',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    minHeight: '100px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>
                    )}

                    {/* Personal Website */}
                    {isEditMode && (
                        <div className="form-group">
                            <FaGlobe className="form-icon" />
                            <input
                                type="url"
                                name="personalWebsite"
                                placeholder="Personal Website URL (e.g., https://yourwebsite.com)"
                                value={formData.personalWebsite}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    {/* Gender */}
                    <div className="form-group">
                        <FaUser className="form-icon" />
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 45px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1em',
                                backgroundColor: '#fff'
                            }}
                        >
                            <option value="">Select Gender *</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </div>

                    {/* Location */}
                    <div className="form-group">
                        <FaMapMarkerAlt className="form-icon" />
                        <input
                            type="text"
                            name="location"
                            placeholder="Location (City, Country) *"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Industry */}
                    <div className="form-group">
                        <FaBriefcase className="form-icon" />
                        <select
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 45px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1em',
                                backgroundColor: '#fff',
                                color: '#333',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                paddingRight: '35px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        >
                            <option value="">Select Industry/Career *</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Beauty">Beauty</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Tech">Tech</option>
                            <option value="Food">Food</option>
                            <option value="Travel">Travel</option>
                            <option value="Lifestyle">Lifestyle</option>
                            <option value="Gaming">Gaming</option>
                            <option value="Music">Music</option>
                            <option value="Art">Art</option>
                            <option value="Education">Education</option>
                            <option value="Business">Business</option>
                            <option value="Health">Health</option>
                            <option value="Sports">Sports</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Retail">Retail</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Finance">Finance</option>
                            <option value="Hospitality">Hospitality</option>
                            <option value="Automotive">Automotive</option>
                            <option value="Home & Garden">Home & Garden</option>
                            <option value="Pet Care">Pet Care</option>
                        </select>
                    </div>

                    {/* Social Media Section */}
                    <div style={{ marginTop: '30px', marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '2px solid #00c4cc' }}>
                        <h3 style={{ 
                            color: '#00c4cc', 
                            fontSize: '1.2em', 
                            marginBottom: '15px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <FaInstagram style={{ fontSize: '24px' }} />
                            Connect Your Social Media
                        </h3>
                        <p style={{ color: '#666', fontSize: '0.95em', marginBottom: '20px', lineHeight: '1.5' }}>
                            Connect your social media accounts via OAuth or manually enter your handles. If OAuth is unavailable, you can enter your handles manually below.
                        </p>

                        {/* OAuth Connect Buttons */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(3, 1fr)', 
                            gap: '15px',
                            margin: '0 auto 30px auto',
                            maxWidth: '400px',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <SocialConnectButton
                                platform="instagram"
                                icon={<FaInstagram />}
                                token={token}
                                onConnect={handleConnectSocial}
                                connected={connectedAccounts.instagram}
                            />
                            <SocialConnectButton
                                platform="facebook"
                                icon={<FaFacebook />}
                                token={token}
                                onConnect={handleConnectSocial}
                                connected={connectedAccounts.facebook}
                                />
                            <SocialConnectButton
                                platform="linkedin"
                                icon={<FaLinkedin />}
                                token={token}
                                onConnect={handleConnectSocial}
                                connected={connectedAccounts.linkedin}
                                    />
                        </div>

                        <h4 style={{ color: '#333', fontSize: '1em', marginBottom: '15px', marginTop: '30px' }}>
                            Or Enter Social Media Handles Manually:
                        </h4>

                        {/* Instagram */}
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <FaInstagram className="form-icon" style={{ color: '#E4405F' }} />
                            <input
                                type="text"
                                placeholder="Instagram username (e.g., @username) or URL"
                                value={formData.socialMedia.instagram}
                                onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                            />
                        </div>

                        {/* Facebook */}
                        <div style={{ marginBottom: '15px' }}>
                            <div className="form-group" style={{ marginBottom: '8px' }}>
                                <FaFacebook className="form-icon" style={{ color: '#1877F2' }} />
                                <input
                                    type="text"
                                    placeholder="Facebook page name or URL"
                                    value={formData.socialMedia.facebook}
                                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                                />
                            </div>
                            {formData.socialMedia.facebook && (
                                <div className="form-group" style={{ marginLeft: '45px', marginBottom: '0' }}>
                                    <input
                                        type="text"
                                        placeholder="Follower count (optional)"
                                        value={formData.socialMediaFollowers.facebook}
                                        onChange={(e) => handleFollowerCountChange('facebook', e.target.value)}
                                        style={{ fontSize: '0.9em' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* LinkedIn */}
                        <div style={{ marginBottom: '15px' }}>
                            <div className="form-group" style={{ marginBottom: '8px' }}>
                                <FaLinkedin className="form-icon" style={{ color: '#0077B5' }} />
                                <input
                                    type="text"
                                    placeholder="LinkedIn profile URL"
                                    value={formData.socialMedia.linkedin}
                                    onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                                />
                            </div>
                            {formData.socialMedia.linkedin && (
                                <div className="form-group" style={{ marginLeft: '45px', marginBottom: '0' }}>
                                    <input
                                        type="text"
                                        placeholder="Follower count (optional)"
                                        value={formData.socialMediaFollowers.linkedin}
                                        onChange={(e) => handleFollowerCountChange('linkedin', e.target.value)}
                                        style={{ fontSize: '0.9em' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={loading}
                        style={{ width: '100%', marginTop: '20px' }}
                    >
                        {loading ? 'SAVING...' : (isEditMode ? 'UPDATE PROFILE' : 'COMPLETE PROFILE')}
                    </button>
                    {isEditMode && (
                        <button
                            type="button"
                            onClick={() => navigate('/influencer-dashboard')}
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: '10px' }}
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>

            {/* Social Connect Modal for Instagram and Facebook */}
            <SocialConnectModal
                platform={selectedSocialPlatform}
                isOpen={showSocialModal}
                onClose={handleSocialModalClose}
                onSuccess={handleSocialModalSuccess}
            />
        </div>
    );
};

export default InfluencerOnboarding;

