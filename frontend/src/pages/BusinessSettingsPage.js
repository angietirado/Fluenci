import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaMapMarkerAlt, FaBriefcase, FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaLinkedin, FaCamera, FaSnapchat, FaPinterest, FaArrowLeft, FaQuestionCircle, FaGlobe } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import SocialConnectModal from '../components/SocialConnectModal';
import { API_URL, apiUrl } from '../config/api';

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

const BusinessSettingsPage = () => {
    const navigate = useNavigate();
    const { user, token, dispatch, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [connectedAccounts, setConnectedAccounts] = useState({});
    const [isChecking, setIsChecking] = useState(true);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [hoveredTooltip, setHoveredTooltip] = useState(null);
    const [showSocialModal, setShowSocialModal] = useState(false);
    const [selectedSocialPlatform, setSelectedSocialPlatform] = useState(null);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [imageToEdit, setImageToEdit] = useState(null);
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
    const [imageScale, setImageScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Protect route - redirect if not logged in or not a business
    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user || !token) {
            navigate('/auth', { replace: true });
            return;
        }
        
        // IMPORTANT: Don't redirect business users away from business settings
        // Even if role check fails temporarily, stay on business settings for business users
        if (user.role !== 'business') {
            // Only redirect if user is definitely an influencer (not during OAuth flow)
            const isOAuthReturn = document.referrer.includes('facebook.com') || 
                                  window.location.search.includes('connected') ||
                                  sessionStorage.getItem('oauth_return_url');
            
            if (!isOAuthReturn) {
            navigate('/influencer-dashboard', { replace: true });
            }
            return;
        }

        // If onboarding is complete and user tries to access settings directly, allow it (they can edit)
        // If onboarding is not complete, this is their first time setup
        setIsChecking(false);
    }, [user, token, navigate, authLoading]);
    
    // Handle browser back button and OAuth returns - ensure business users stay on business pages
    useEffect(() => {
        if (!user || user.role !== 'business') return;
        
        // Check if coming back from OAuth (Facebook redirect)
        const isComingFromOAuth = document.referrer.includes('facebook.com') || 
                                   document.referrer.includes('instagram.com') ||
                                   window.location.search.includes('connected') ||
                                   sessionStorage.getItem('oauth_return_url');
        
        // If user is on a non-business page and is a business user, redirect to business dashboard
        const currentPath = window.location.pathname;
        if (currentPath.includes('influencer') && user.role === 'business') {
            console.log('🔄 Business user detected on influencer page, redirecting to business dashboard');
            navigate('/business-dashboard', { replace: true });
            return;
        }
        
        // Handle browser back button
        const handlePopState = (event) => {
            if (user && user.role === 'business') {
                const newPath = window.location.pathname;
                // If back button takes them to influencer pages, redirect to business dashboard
                if (newPath.includes('influencer') && newPath !== '/auth') {
                    console.log('🔄 Back button took business user to influencer page, redirecting to business dashboard');
                    setTimeout(() => {
                        navigate('/business-dashboard', { replace: true });
                    }, 100);
                }
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [user, navigate]);
    
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        industry: '',
        description: '',
        website: '',
        offers: {
            productService: false,
            productServiceDescription: '',
            revenueSharing: false,
            revenueSharingDescription: '',
            brandBuilding: false,
            brandBuildingDescription: ''
        },
        socialMedia: {
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
    const [customIndustry, setCustomIndustry] = useState('');

    // Pre-populate form data with existing user data
    useEffect(() => {
        if (user && !isChecking) {
            const userIndustry = user.industry || '';
            const standardIndustries = ['Fashion', 'Beauty', 'Fitness', 'Tech', 'Food', 'Travel', 'Lifestyle', 'Gaming', 'Music', 'Art', 'Education', 'Business', 'Health', 'Sports', 'Entertainment', 'Retail', 'Real Estate', 'Finance', 'Hospitality', 'Automotive', 'Home & Garden', 'Pet Care'];
            
            // Check if industry is a custom one (not in standard list)
            const isCustomIndustry = userIndustry && !standardIndustries.includes(userIndustry) && userIndustry !== 'Other';
            
            setFormData({
                name: user.name || '',
                location: user.location || '',
                industry: isCustomIndustry ? 'Other' : userIndustry,
                description: user.description || '',
                website: user.website || '',
                offers: {
                    productService: user.offers?.productService || false,
                    productServiceDescription: user.offers?.productServiceDescription || '',
                    revenueSharing: user.offers?.revenueSharing || false,
                    revenueSharingDescription: user.offers?.revenueSharingDescription || '',
                    brandBuilding: user.offers?.brandBuilding || false,
                    brandBuildingDescription: user.offers?.brandBuildingDescription || ''
                },
                socialMedia: {
                    // Strip @ symbols when loading existing data for platforms that use them
                    instagram: (user.socialMedia?.instagram || '').replace(/^@+/, ''),
                    youtube: user.socialMedia?.youtube || '',
                    tiktok: (user.socialMedia?.tiktok || '').replace(/^@+/, ''),
                    x: (user.socialMedia?.x || user.socialMedia?.twitter || '').replace(/^@+/, ''),
                    facebook: user.socialMedia?.facebook || '',
                    linkedin: user.socialMedia?.linkedin || '',
                    snapchat: (user.socialMedia?.snapchat || '').replace(/^@+/, ''),
                    pinterest: user.socialMedia?.pinterest || ''
                }
            });
            
            // Set custom industry if it's a custom one
            if (isCustomIndustry) {
                setCustomIndustry(userIndustry);
            } else {
                setCustomIndustry('');
            }

            // Set profile picture preview if exists AND we don't have a new cropped image
            // Only set preview from user data if we haven't selected a new image to crop
            if (user.profilePicture && !profilePicture) {
                const profilePicUrl = user.profilePicture.startsWith('http') 
                    ? user.profilePicture 
                    : apiUrl(user.profilePicture);
                setProfilePicturePreview(profilePicUrl);
            }
        }
    }, [user, isChecking]); // Removed profilePicture from dependencies to prevent overwriting

    // Fetch connected social media accounts
    const fetchConnectedAccounts = useCallback(async () => {
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/v1/social/connections`, {
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
        // Only show modal for Instagram and Facebook
        if (platform === 'instagram' || platform === 'facebook') {
            setSelectedSocialPlatform(platform);
            setShowSocialModal(true);
        } else {
            // For other platforms, navigate to connection page
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
        
        // Clear custom industry if user selects something other than "Other"
        if (name === 'industry' && value !== 'Other') {
            setCustomIndustry('');
        }
    };

    const handleSocialMediaChange = (platform, value) => {
        // Platforms that use @ symbol - automatically remove it for cleaner storage
        // Users can type with or without @, we'll handle it
        const platformsWithAtSymbol = ['instagram', 'tiktok', 'x', 'twitter', 'snapchat'];
        
        let cleanedValue = value;
        
        // For platforms that use @, remove leading @ symbol (users can type with or without it)
        if (platformsWithAtSymbol.includes(platform)) {
            cleanedValue = cleanedValue.replace(/^@+/, ''); // Remove one or more leading @ symbols
        }
        
        setFormData(prev => ({
            ...prev,
            socialMedia: {
                ...prev.socialMedia,
                [platform]: cleanedValue
            }
        }));
    };

    const handleOfferChange = (offerType) => {
        setFormData(prev => ({
            ...prev,
            offers: {
                ...prev.offers,
                [offerType]: !prev.offers[offerType]
            }
        }));
    };

    const handleOfferDescriptionChange = (offerType, description) => {
        setFormData(prev => ({
            ...prev,
            offers: {
                ...prev.offers,
                [`${offerType}Description`]: description
            }
        }));
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            
            // Open image editor modal
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToEdit(reader.result);
                setShowImageEditor(true);
                // Reset crop area and scale
                setCropArea({ x: 0, y: 0, width: 200, height: 200 });
                setImageScale(1);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    // Handle image crop and resize
    const handleImageCrop = () => {
        if (!imageToEdit) {
            console.error('No image to edit');
            return;
        }

        console.log('Starting crop, cropArea:', cropArea, 'scale:', imageScale);

        const img = new Image();
        img.onload = () => {
            try {
                console.log('Image loaded, dimensions:', img.width, 'x', img.height);
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size to 400x400 (circular profile picture)
                canvas.width = 400;
                canvas.height = 400;
                
                // The preview shows the image scaled by imageScale and offset by cropArea
                // Image in preview: size = 400 * imageScale, positioned with transform
                // Container: 400x400, center at (200, 200)
                
                // Calculate what part of the original image is visible
                // The image center in the preview is offset by cropArea.x and cropArea.y from container center
                const scaledSize = 400 * imageScale;
                
                // The visible center point in scaled image coordinates
                // Container center (200, 200) maps to scaled image center (scaledSize/2, scaledSize/2)
                // With offset: (scaledSize/2 + cropArea.x, scaledSize/2 + cropArea.y)
                const scaledCenterX = scaledSize / 2 + cropArea.x;
                const scaledCenterY = scaledSize / 2 + cropArea.y;
                
                // Convert to original image coordinates
                const sourceCenterX = (scaledCenterX / scaledSize) * img.width;
                const sourceCenterY = (scaledCenterY / scaledSize) * img.height;
                
                // Calculate crop size - we always want to crop 400px from the original image
                // The scale only affects what part is visible, not the crop size
                // Use the smaller dimension to ensure square crop that fits
                const cropSize = Math.min(400, img.width, img.height);
                
                // Calculate source coordinates (centered crop)
                let sourceX = sourceCenterX - cropSize / 2;
                let sourceY = sourceCenterY - cropSize / 2;
                
                // Clamp to image bounds
                sourceX = Math.max(0, Math.min(sourceX, img.width - cropSize));
                sourceY = Math.max(0, Math.min(sourceY, img.height - cropSize));
                
                console.log('Crop params:', { sourceX, sourceY, cropSize, imgWidth: img.width, imgHeight: img.height });
                
                // Draw cropped and resized image with circular clipping
                ctx.save();
                
                // Fill with white background first
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 400, 400);
                
                // Create circular clipping path
                ctx.beginPath();
                ctx.arc(200, 200, 200, 0, Math.PI * 2);
                ctx.clip();
                
                // Draw the cropped portion of the image
                ctx.drawImage(
                    img,
                    sourceX, sourceY, cropSize, cropSize,
                    0, 0, 400, 400
                );
                
                ctx.restore();
                
                console.log('Canvas drawn, converting to blob...');
                
                // Convert to blob and update preview
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        console.log('Blob created, size:', blob.size);
                        const file = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });
                        
                        console.log('Setting profile picture and preview...');
                        // Set preview first so user sees the change immediately
                        setProfilePicturePreview(dataUrl);
                        // Then set the file for upload
                        setProfilePicture(file);
                        // Close editor
                        setShowImageEditor(false);
                        setImageToEdit(null);
                        setError(null);
                        console.log('Crop completed successfully, preview updated');
                    } else {
                        console.error('Failed to create blob');
                        setError('Failed to process image. Please try again.');
                    }
                }, 'image/jpeg', 0.9);
            } catch (error) {
                console.error('Error cropping image:', error);
                setError('Failed to crop image: ' + error.message);
            }
        };
        img.onerror = (error) => {
            console.error('Failed to load image:', error);
            setError('Failed to load image. Please try again.');
        };
        img.src = imageToEdit;
    };

    // Handle mouse events for dragging image
    const handleMouseDown = (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            setIsDragging(true);
            const container = e.currentTarget.closest('[data-image-container]');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const centerX = containerRect.left + containerRect.width / 2;
                const centerY = containerRect.top + containerRect.height / 2;
                setDragStart({ 
                    x: e.clientX - centerX - cropArea.x, 
                    y: e.clientY - centerY - cropArea.y 
                });
            }
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && imageToEdit) {
            e.preventDefault();
            const container = document.querySelector('[data-image-container]');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const centerX = containerRect.left + containerRect.width / 2;
                const centerY = containerRect.top + containerRect.height / 2;
                
                const newX = e.clientX - centerX - dragStart.x;
                const newY = e.clientY - centerY - dragStart.y;
                
                // Calculate max offset based on image scale
                const scaledSize = 400 * imageScale;
                const maxOffset = Math.max(0, (scaledSize - 400) / 2);
                
                setCropArea(prev => ({
                    ...prev,
                    x: Math.max(-maxOffset, Math.min(newX, maxOffset)),
                    y: Math.max(-maxOffset, Math.min(newY, maxOffset))
                }));
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Validation
        if (!formData.location || !formData.industry) {
            setError('Please fill in all required fields (Location and Industry).');
            setLoading(false);
            return;
        }

        // Validate custom industry if "Other" is selected
        if (formData.industry === 'Other' && !customIndustry.trim()) {
            setError('Please enter your custom industry.');
            setLoading(false);
            return;
        }

        // Validate name if provided
        if (formData.name && formData.name.trim().length === 0) {
            setError('Company name cannot be empty.');
            setLoading(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            if (formData.name) {
                formDataToSend.append('name', formData.name);
            }
            formDataToSend.append('location', formData.location);
            // Use custom industry if "Other" is selected, otherwise use the selected industry
            const industryToSave = formData.industry === 'Other' ? customIndustry.trim() : formData.industry;
            formDataToSend.append('industry', industryToSave);
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('website', formData.website || '');
            formDataToSend.append('offers', JSON.stringify(formData.offers));
            formDataToSend.append('socialMedia', JSON.stringify(formData.socialMedia));
            
            // Mark onboarding as complete if this is first time setup
            if (!user.onboardingComplete) {
                formDataToSend.append('onboardingComplete', 'true');
            }
            
            if (profilePicture) {
                formDataToSend.append('profilePicture', profilePicture);
            }

            const res = await fetch(`${API_URL}/api/v1/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to update profile. Please try again.');
                setLoading(false);
                return;
            }

            if (data.success) {
                // Fetch updated user data to refresh context
                try {
                    const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
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

                // Refresh connected accounts
                await fetchConnectedAccounts();

                // Show success message
                setError(null);
                const successMsg = document.createElement('div');
                successMsg.className = 'alert alert-success';
                successMsg.textContent = 'Profile updated successfully!';
                successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 15px 20px; background-color: #28a745; color: white; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
                document.body.appendChild(successMsg);
                setTimeout(() => {
                    successMsg.remove();
                    navigate('/business-dashboard', { replace: true });
                }, 2000);
            } else {
                setError(data.error || 'Failed to update profile.');
            }
        } catch (err) {
            console.error('Profile update error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                <button
                    className="back-button"
                    onClick={() => navigate('/business-dashboard')}
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
                onClick={() => {
                    if (user && user.onboardingComplete) {
                        navigate('/business-dashboard');
                    } else {
                        // For first-time users, go to home page since they can't access dashboard yet
                        navigate('/');
                    }
                }}
            >
                <FaArrowLeft /> Back
            </button>

            <div className="auth-card" style={{ maxWidth: '600px', margin: '50px auto' }}>
                <h2 style={{ color: '#00c4cc', marginBottom: '10px', textAlign: 'center' }}>
                    {user && !user.onboardingComplete ? 'Complete Your Business Profile' : 'Business Settings'}
                </h2>
                <p style={{ color: '#666', marginBottom: '30px', textAlign: 'center', fontSize: '0.9em' }}>
                    {user && !user.onboardingComplete 
                        ? `Welcome, ${user?.name || 'Business'}! Let's set up your business profile to get started.`
                        : 'Update your business profile information, location, industry, and social media connections.'
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
                                onClick={() => {
                                    const input = document.getElementById('profilePictureInput');
                                    if (input) {
                                        input.value = ''; // Reset to allow selecting same file again
                                        input.click();
                                    }
                                }}
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

                    {/* Company Name */}
                    <div className="form-group">
                        <FaUser className="form-icon" />
                        <input
                            type="text"
                            name="name"
                            placeholder="Company Name *"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Company Description */}
                    <div className="form-group" style={{ alignItems: 'flex-start' }}>
                        <FaBriefcase className="form-icon" style={{ marginTop: '12px' }} />
                        <textarea
                            name="description"
                            placeholder="Company Description (Optional)"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 45px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1em',
                                backgroundColor: '#fff',
                                color: '#333',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    {/* Website URL */}
                    <div className="form-group">
                        <FaGlobe className="form-icon" />
                        <input
                            type="url"
                            name="website"
                            placeholder="Company Website URL (Optional, e.g., https://example.com)"
                            value={formData.website}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 45px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1em',
                                backgroundColor: '#fff',
                                color: '#333'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>

                    {/* Location */}
                    <div className="form-group">
                        <FaMapMarkerAlt className="form-icon" />
                        <input
                            type="text"
                            name="location"
                            placeholder="Business Location *"
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
                                padding: '12px 40px 12px 40px',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                fontSize: '1em',
                                backgroundColor: '#fff',
                                color: '#333',
                                outline: 'none',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                paddingRight: '40px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        >
                            <option value="">Select Business Industry *</option>
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
                            {formData.industry && !['Fashion', 'Beauty', 'Fitness', 'Tech', 'Food', 'Travel', 'Lifestyle', 'Gaming', 'Music', 'Art', 'Education', 'Business', 'Health', 'Sports', 'Entertainment', 'Retail', 'Real Estate', 'Finance', 'Hospitality', 'Automotive', 'Home & Garden', 'Pet Care'].includes(formData.industry) && (
                                <option value={formData.industry}>{formData.industry}</option>
                            )}
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Custom Industry Input - Show when "Other" is selected */}
                    {formData.industry === 'Other' && (
                        <div className="form-group" style={{ marginTop: '-10px' }}>
                            <FaBriefcase className="form-icon" />
                            <input
                                type="text"
                                name="customIndustry"
                                placeholder="Enter your industry *"
                                value={customIndustry}
                                onChange={(e) => setCustomIndustry(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 40px 12px 40px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    fontSize: '1em',
                                    backgroundColor: '#fff',
                                    color: '#333',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>
                    )}

                    {/* Offers */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '12px', 
                            fontSize: '14px', 
                            color: '#666',
                            fontWeight: '500',
                            textAlign: 'left'
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
                                <div key={key} style={{ position: 'relative', marginBottom: '15px' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        transition: 'background-color 0.2s',
                                        width: 'fit-content',
                                        marginBottom: '8px'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.offers[key] || false}
                                            onChange={() => handleOfferChange(key)}
                                            style={{ cursor: 'pointer', width: '18px', height: '18px', flexShrink: 0 }}
                                        />
                                        <span style={{ color: '#333' }}>{label}</span>
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
                                                    transform: 'translateX(-100%)',
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
                                    {/* Offer Description - Only show when checkbox is checked */}
                                    {formData.offers[key] && (
                                        <div style={{ marginLeft: '28px', marginTop: '8px' }}>
                                            <label style={{ 
                                                display: 'block', 
                                                marginBottom: '6px', 
                                                fontSize: '12px', 
                                                color: '#666',
                                                fontWeight: '500'
                                            }}>
                                                Description More:
                                            </label>
                                            <textarea
                                                placeholder="Describe what you're offering or looking for in this partnership..."
                                                value={formData.offers[`${key}Description`] || ''}
                                                onChange={(e) => handleOfferDescriptionChange(key, e.target.value)}
                                                rows={3}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    backgroundColor: '#fff',
                                                    color: '#333',
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Social Media Section - Matching Influencer Profile Design */}
                    <div style={{ marginTop: '30px', marginBottom: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '2px solid #00c4cc' }}>
                        <h3 style={{ 
                            fontSize: '20px', 
                            marginBottom: '15px', 
                            color: '#00c4cc',
                            fontWeight: '700',
                            borderBottom: '2px solid #00c4cc',
                            paddingBottom: '10px',
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
                            marginBottom: '30px',
                            maxWidth: '400px',
                            margin: '0 auto 30px auto',
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

                        {/* Manual Social Media Inputs */}
                        <h4 style={{ color: '#333', fontSize: '1em', marginBottom: '15px', marginTop: '30px' }}>
                            Or Enter Social Media Handles Manually:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-group">
                                <FaInstagram className="form-icon" />
                                <input
                                    type="text"
                                    placeholder="Instagram username (e.g., yourbusiness)"
                                    value={formData.socialMedia.instagram}
                                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <FaFacebook className="form-icon" />
                                <input
                                    type="text"
                                    placeholder="Facebook page name or URL"
                                    value={formData.socialMedia.facebook}
                                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <FaLinkedin className="form-icon" />
                                <input
                                    type="text"
                                    placeholder="LinkedIn company page URL"
                                    value={formData.socialMedia.linkedin}
                                    onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/business-dashboard')}
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* Social Connect Modal for Instagram and Facebook */}
            <SocialConnectModal
                platform={selectedSocialPlatform}
                isOpen={showSocialModal}
                onClose={handleSocialModalClose}
                onSuccess={handleSocialModalSuccess}
            />

            {/* Image Editor Modal */}
            {showImageEditor && imageToEdit && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                >
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>
                            Crop & Resize Profile Picture
                        </h3>
                        <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '20px' }}>
                            Drag the image to reposition it, and use the zoom slider to resize. The circular area shows what will be visible.
                        </p>
                        
                        {/* Image Preview with Crop Area */}
                        <div 
                            data-image-container
                            style={{
                                position: 'relative',
                                width: '400px',
                                height: '400px',
                                margin: '0 auto 20px',
                                border: '3px solid #00c4cc',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: '#f5f5f5',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden',
                                borderRadius: '50%'
                            }}>
                                <img
                                    src={imageToEdit}
                                    alt="Preview"
                                    style={{
                                        width: `${400 * imageScale}px`,
                                        height: `${400 * imageScale}px`,
                                        objectFit: 'cover',
                                        position: 'absolute',
                                        left: `calc(50% + ${cropArea.x}px)`,
                                        top: `calc(50% + ${cropArea.y}px)`,
                                        transform: 'translate(-50%, -50%)',
                                        cursor: isDragging ? 'grabbing' : 'move',
                                        userSelect: 'none'
                                    }}
                                    onMouseDown={handleMouseDown}
                                    draggable={false}
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#666' }}>
                                Zoom: {Math.round(imageScale * 100)}%
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={imageScale}
                                onChange={(e) => setImageScale(parseFloat(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowImageEditor(false);
                                    setImageToEdit(null);
                                    document.getElementById('profilePictureInput').value = '';
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#999',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.9em',
                                    fontWeight: '600'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleImageCrop}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#00c4cc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.9em',
                                    fontWeight: '600'
                                }}
                            >
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessSettingsPage;

