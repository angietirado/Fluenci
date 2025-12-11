import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaLinkedin, FaSnapchat, FaPinterest, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import FacebookLoginButton from '../components/FacebookLoginButton';

const SocialMediaConnectionPage = () => {
    const { platform } = useParams();
    const navigate = useNavigate();
    const { user, token, dispatch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [manualHandle, setManualHandle] = useState('');
    const [savingManual, setSavingManual] = useState(false);

    // Handle browser back button - ensure influencer users stay on influencer pages
    useEffect(() => {
        if (!user || user.role !== 'influencer') return;
        
        // Check if user is on a business page and redirect them
        const checkAndRedirect = () => {
            const currentPath = window.location.pathname;
            if (currentPath.includes('business') && currentPath !== '/auth') {
                console.log('🔄 Influencer user detected on business page from connection page, redirecting to influencer profile');
                navigate('/influencer-onboarding?edit=true', { replace: true });
                return true;
            }
            return false;
        };
        
        // Check immediately
        if (checkAndRedirect()) {
            return;
        }
        
        // Handle browser back button
        const handlePopState = (event) => {
            setTimeout(() => {
                if (user && user.role === 'influencer') {
                    const newPath = window.location.pathname;
                    if (newPath.includes('business') && newPath !== '/auth') {
                        console.log('🔄 Back button took influencer user to business page, redirecting to influencer profile');
                        navigate('/influencer-onboarding?edit=true', { replace: true });
                    }
                }
            }, 50);
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [user, navigate]);

    const platformInfo = {
        instagram: {
            name: 'Instagram',
            icon: <FaInstagram />,
            color: '#E4405F',
            description: 'Connect your Instagram account to showcase your content and grow your audience. Note: Instagram uses Facebook Login for authentication.',
            placeholder: 'Instagram handle (e.g., @username) or URL'
        },
        youtube: {
            name: 'YouTube',
            icon: <FaYoutube />,
            color: '#FF0000',
            description: 'Connect your YouTube channel to share your videos and reach more viewers.',
            placeholder: 'YouTube channel name or URL'
        },
        tiktok: {
            name: 'TikTok',
            icon: <FaTiktok />,
            color: '#000000',
            description: 'Connect your TikTok account to display your short-form content.',
            placeholder: 'TikTok handle (e.g., @username) or URL'
        },
        x: {
            name: 'X (Twitter)',
            icon: <FaXTwitter />,
            color: '#000000',
            description: 'Connect your X (Twitter) account to share your thoughts and updates.',
            placeholder: 'X handle (e.g., @username) or URL'
        },
        facebook: {
            name: 'Facebook',
            icon: <FaFacebook />,
            color: '#1877F2',
            description: 'Connect your Facebook page to expand your reach.',
            placeholder: 'Facebook page name or URL'
        },
        linkedin: {
            name: 'LinkedIn',
            icon: <FaLinkedin />,
            color: '#0077B5',
            description: 'Connect your LinkedIn profile to showcase your professional network.',
            placeholder: 'LinkedIn profile URL'
        },
        snapchat: {
            name: 'Snapchat',
            icon: <FaSnapchat />,
            color: '#FFFC00',
            description: 'Connect your Snapchat account to share your stories.',
            placeholder: 'Snapchat username'
        },
        pinterest: {
            name: 'Pinterest',
            icon: <FaPinterest />,
            color: '#E60023',
            description: 'Connect your Pinterest account to showcase your boards and pins.',
            placeholder: 'Pinterest username or URL'
        }
    };

    const currentPlatform = platformInfo[platform] || platformInfo.instagram;

    useEffect(() => {
        if (!user || !token) {
            navigate('/auth');
            return;
        }
        
        // CRITICAL: If influencer user and flag is set, ensure it persists
        if (user.role === 'influencer') {
            const fromInfluencerProfile = sessionStorage.getItem('from_influencer_profile') === 'true';
            const storedReturnUrl = sessionStorage.getItem('oauth_return_url');
            
            // If flag is set or return URL matches influencer profile, ensure they're preserved
            if (fromInfluencerProfile || storedReturnUrl === '/influencer-onboarding?edit=true') {
                sessionStorage.setItem('from_influencer_profile', 'true');
                sessionStorage.setItem('oauth_return_url', '/influencer-onboarding?edit=true');
                localStorage.setItem('oauth_return_url_backup', '/influencer-onboarding?edit=true');
                console.log('🔵 Connection Page: Preserving influencer profile flags');
            }
            
            const currentPath = window.location.pathname;
            // If somehow on a business-related page, redirect immediately
            if (currentPath.includes('business') && currentPath !== '/auth') {
                console.log('🔄 Influencer user on business page in connection flow, redirecting to profile');
                navigate('/influencer-onboarding?edit=true', { replace: true });
                return;
            }
        }

        // Check if platform is already connected
        checkConnectionStatus();
        
        // Load existing manual handle
        const existingHandle = user.socialMedia?.[platform] || '';
        setManualHandle(existingHandle);
    }, [user, token, platform, navigate]);

    const checkConnectionStatus = async () => {
        if (!token) return;

        try {
            const res = await fetch('http://localhost:5000/api/v1/social/connections', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.success && data.data[platform]) {
                setIsConnected(data.data[platform].connected || false);
            }
        } catch (err) {
            console.error('Error checking connection status:', err);
        }
    };

    const handleOAuthConnect = async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const res = await fetch(`http://localhost:5000/api/v1/social/connect/${platform}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMessage = data.error || data.message || `Failed to initiate ${platform} connection.`;
                setError(errorMessage);
                setLoading(false);
                return;
            }

            if (data.success && data.authUrl) {
                // Validate that authUrl is not a placeholder
                if (data.authUrl.includes('YOUR_CLIENT_ID') || data.authUrl.includes('YOUR_CLIENT_KEY')) {
                    setError(`${currentPlatform.name} OAuth is not configured. Please use the manual entry option below.`);
                    setLoading(false);
                    return;
                }
                sessionStorage.setItem(`oauth_state_${platform}`, data.stateToken);
                // Store return URL - CRITICAL: Check user role FIRST, then flag
                const fromInfluencerProfile = sessionStorage.getItem('from_influencer_profile') === 'true';
                let returnUrl;
                
                // HIGHEST PRIORITY: If user is an influencer, always redirect to influencer profile
                if (user && user.role === 'influencer') {
                    returnUrl = '/influencer-onboarding?edit=true';
                    // Ensure flag is set for callback
                    sessionStorage.setItem('from_influencer_profile', 'true');
                    console.log('🔵 LinkedIn: Influencer user detected, setting return URL to profile:', returnUrl);
                } else if (fromInfluencerProfile) {
                    // User came from influencer profile page (backup check)
                    returnUrl = '/influencer-onboarding?edit=true';
                    sessionStorage.setItem('from_influencer_profile', 'true');
                    console.log('🔵 LinkedIn: Flag detected, setting return URL to profile:', returnUrl);
                } else {
                    // Business user or fallback
                    const currentPath = window.location.pathname;
                    if (user && user.role === 'business') {
                        returnUrl = '/business-dashboard';
                    } else {
                        returnUrl = currentPath.includes('business') ? '/business-dashboard' : '/influencer-settings';
                    }
                    console.log('🔵 LinkedIn: Setting return URL based on path/role:', returnUrl);
                }
                
                sessionStorage.setItem('oauth_return_url', returnUrl);
                localStorage.setItem('oauth_return_url_backup', returnUrl);
                console.log('🔵 LinkedIn: Final return URL stored:', returnUrl);
                console.log('🔵 LinkedIn: User role:', user?.role);
                console.log('🔵 LinkedIn: From influencer profile flag:', sessionStorage.getItem('from_influencer_profile'));
                // Use replace instead of href to avoid adding unnecessary history entries
                // This ensures browser back button works correctly
                window.location.replace(data.authUrl);
            } else {
                setError(`Failed to initiate ${platform} connection. Please try again.`);
                setLoading(false);
            }
        } catch (err) {
            console.error('OAuth connection error:', err);
            setError(`Error connecting to ${platform}. Please try again or use manual entry.`);
            setLoading(false);
        }
    };

    const handleManualSave = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSavingManual(true);

        if (!manualHandle.trim()) {
            setError('Please enter a handle or URL');
            setSavingManual(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/v1/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    socialMedia: {
                        [platform]: manualHandle.trim()
                    }
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(`${currentPlatform.name} handle saved successfully!`);
                
                // Update user context
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

                setTimeout(() => {
                    navigate('/influencer-settings');
                }, 1500);
            } else {
                setError(data.error || 'Failed to save handle. Please try again.');
            }
        } catch (err) {
            console.error('Save handle error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setSavingManual(false);
        }
    };

    if (!currentPlatform) {
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
                    onClick={() => navigate('/influencer-settings')}
                >
                    <FaArrowLeft /> Back
                </button>
                <div className="auth-card" style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center' }}>
                    <h2 style={{ color: '#00c4cc' }}>Invalid Platform</h2>
                    <p style={{ color: '#666', marginTop: '10px' }}>The platform you're trying to connect is not supported.</p>
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
                onClick={() => navigate('/influencer-settings')}
            >
                <FaArrowLeft /> Back
            </button>

            <div className="auth-card" style={{ maxWidth: '600px', margin: '50px auto' }}>
                {/* Platform Header */}
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '30px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: currentPlatform.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        color: '#fff',
                        marginBottom: '10px'
                    }}>
                        {currentPlatform.icon}
                    </div>
                    <h2 style={{ color: '#333', marginBottom: '10px' }}>
                        Connect {currentPlatform.name}
                    </h2>
                    <p style={{ color: '#666', fontSize: '0.95em', lineHeight: '1.6' }}>
                        {currentPlatform.description}
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success" style={{ marginBottom: '20px', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' }}>
                        {success}
                    </div>
                )}

                {/* Connection Status */}
                {isConnected && (
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#155724'
                    }}>
                        <FaCheckCircle style={{ fontSize: '20px' }} />
                        <span style={{ fontWeight: '600' }}>Connected</span>
                    </div>
                )}

                {/* Instagram Facebook Login Notice */}
                {platform === 'instagram' && !isConnected && (
                    <div style={{
                        padding: '12px 15px',
                        backgroundColor: '#E3F2FD',
                        border: '1px solid #90CAF9',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        color: '#1565C0',
                        fontSize: '0.9em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <FaFacebook style={{ fontSize: '18px' }} />
                        <div>
                            <strong>Note:</strong> Instagram uses Facebook Login for authentication. 
                            You'll be redirected to Facebook to authorize access to your Instagram account.
                        </div>
                    </div>
                )}

                {/* OAuth Connect Button */}
                <div style={{ marginBottom: '30px' }}>
                    <button
                        type="button"
                        onClick={handleOAuthConnect}
                        disabled={loading || isConnected}
                        style={{
                            width: '100%',
                            padding: '15px 20px',
                            backgroundColor: isConnected ? '#28a745' : currentPlatform.color,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1em',
                            fontWeight: '600',
                            cursor: (loading || isConnected) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'opacity 0.2s',
                            opacity: (loading || isConnected) ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && !isConnected) {
                                e.target.style.opacity = '0.9';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading && !isConnected) {
                                e.target.style.opacity = '1';
                            }
                        }}
                    >
                        {loading ? (
                            <>
                                <span>Connecting...</span>
                            </>
                        ) : isConnected ? (
                            <>
                                <FaCheckCircle />
                                <span>Already Connected</span>
                            </>
                        ) : (
                            <>
                                {currentPlatform.icon}
                                <span>Connect with {currentPlatform.name}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Facebook SDK Login Button (Alternative for Facebook) */}
                {platform === 'facebook' && !isConnected && (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '20px 0',
                            color: '#999'
                        }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                            <span style={{ padding: '0 15px', fontSize: '14px' }}>OR USE SDK LOGIN</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                        </div>
                        <div style={{ marginBottom: '30px' }}>
                            <FacebookLoginButton
                                scope="public_profile,email,pages_read_engagement,pages_show_list"
                                buttonText="Login with Facebook SDK"
                                onLoginSuccess={async (response) => {
                                    // This is the checkLoginState callback - Facebook provided this
                                    console.log('Facebook SDK Login Success:', response);
                                    
                                    if (response.status === 'connected' && response.authResponse) {
                                        try {
                                            // Send access token to backend to complete OAuth flow
                                            const res = await fetch('http://localhost:5000/api/v1/social/callback/facebook-sdk', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({
                                                    accessToken: response.authResponse.accessToken,
                                                    userID: response.authResponse.userID
                                                })
                                            });

                                            const data = await res.json();
                                            
                                            if (res.ok && data.success) {
                                                setSuccess('Facebook account connected successfully!');
                                                setIsConnected(true);
                                                // Refresh user data
                                                if (data.user) {
                                                    dispatch({
                                                        type: 'SET_USER',
                                                        payload: data.user
                                                    });
                                                }
                                            } else {
                                                setError(data.error || 'Failed to connect Facebook account.');
                                            }
                                        } catch (err) {
                                            console.error('Error connecting Facebook:', err);
                                            setError('Failed to connect Facebook account. Please try again.');
                                        }
                                    }
                                }}
                                onLoginFailure={(response) => {
                                    console.log('Facebook SDK Login Failed:', response);
                                    if (response.error) {
                                        setError(response.error);
                                    } else if (response.status !== 'connected') {
                                        setError('Facebook login was cancelled or failed.');
                                    }
                                }}
                                style={{ width: '100%' }}
                            />
                            <p style={{ 
                                fontSize: '12px', 
                                color: '#666', 
                                marginTop: '10px',
                                textAlign: 'center'
                            }}>
                                Uses Facebook SDK popup (stays on this page)
                            </p>
                        </div>
                    </>
                )}

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '30px 0',
                    color: '#999'
                }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                    <span style={{ padding: '0 15px', fontSize: '14px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                </div>

                {/* Manual Entry */}
                <form onSubmit={handleManualSave}>
                    <h3 style={{ 
                        fontSize: '16px', 
                        marginBottom: '15px', 
                        color: '#333',
                        fontWeight: '600'
                    }}>
                        Enter Handle Manually
                    </h3>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <div style={{ color: currentPlatform.color, fontSize: '20px' }}>
                            {currentPlatform.icon}
                        </div>
                        <input
                            type="text"
                            placeholder={currentPlatform.placeholder}
                            value={manualHandle}
                            onChange={(e) => setManualHandle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 45px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1em',
                                backgroundColor: '#fff',
                                color: '#333'
                            }}
                            onFocus={(e) => e.target.style.borderColor = currentPlatform.color}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={savingManual}
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            backgroundColor: savingManual ? '#ccc' : '#00c4cc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1em',
                            fontWeight: '600',
                            cursor: savingManual ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!savingManual) {
                                e.target.style.backgroundColor = '#009999';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!savingManual) {
                                e.target.style.backgroundColor = '#00c4cc';
                            }
                        }}
                    >
                        {savingManual ? 'Saving...' : 'Save Handle'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SocialMediaConnectionPage;
