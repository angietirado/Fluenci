import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaInstagram, FaFacebook, FaTimes, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import FacebookLoginButton from './FacebookLoginButton';

const SocialConnectModal = ({ platform, isOpen, onClose, onSuccess }) => {
    const { user, token, dispatch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [manualHandle, setManualHandle] = useState('');
    const [savingManual, setSavingManual] = useState(false);

    const platformInfo = {
        instagram: {
            name: 'Instagram',
            icon: <FaInstagram />,
            color: '#E4405F',
            description: 'Connect your Instagram account to showcase your content and grow your audience. Note: Instagram uses Facebook Login for authentication.',
            placeholder: 'Instagram handle (e.g., @username) or URL'
        },
        facebook: {
            name: 'Facebook',
            icon: <FaFacebook />,
            color: '#1877F2',
            description: 'Connect your Facebook page to expand your reach.',
            placeholder: 'Facebook page name or URL'
        }
    };

    const currentPlatform = platformInfo[platform];

    useEffect(() => {
        if (!isOpen || !user || !token) return;

        // CRITICAL: If influencer user and flag is set, ensure it persists
        if (user.role === 'influencer') {
            const fromInfluencerProfile = sessionStorage.getItem('from_influencer_profile') === 'true';
            const storedReturnUrl = sessionStorage.getItem('oauth_return_url');
            
            // If flag is set or return URL matches influencer profile, ensure they're preserved
            if (fromInfluencerProfile || storedReturnUrl === '/influencer-onboarding?edit=true') {
                sessionStorage.setItem('from_influencer_profile', 'true');
                sessionStorage.setItem('oauth_return_url', '/influencer-onboarding?edit=true');
                localStorage.setItem('oauth_return_url_backup', '/influencer-onboarding?edit=true');
                console.log('🔵 Modal: Preserving influencer profile flags');
            } else {
                // Always set for influencer users opening modal from profile page
                const currentPath = window.location.pathname;
                if (currentPath.includes('influencer-onboarding')) {
                    sessionStorage.setItem('from_influencer_profile', 'true');
                    sessionStorage.setItem('oauth_return_url', '/influencer-onboarding?edit=true');
                    localStorage.setItem('oauth_return_url_backup', '/influencer-onboarding?edit=true');
                    console.log('🔵 Modal: Setting influencer profile flags from current path');
                }
            }
        }

        // Load existing manual handle
        const existingHandle = user.socialMedia?.[platform] || '';
        setManualHandle(existingHandle);

        // Check connection status
        checkConnectionStatus();
    }, [isOpen, platform, user, token]);

    const checkConnectionStatus = async () => {
        if (!token) return false;

        try {
            const res = await fetch('http://localhost:5000/api/v1/social/connections', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.success && data.data[platform]) {
                const connected = data.data[platform].connected || false;
                setIsConnected(connected);
                return connected;
            }
            return false;
        } catch (err) {
            console.error('Error checking connection status:', err);
            return false;
        }
    };

    const handleOAuthConnect = async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            // HIGHEST PRIORITY: Check user role first - if influencer, always redirect to profile
            const fromInfluencerProfile = sessionStorage.getItem('from_influencer_profile') === 'true';
            let returnUrl;
            
            // If user is an influencer, always redirect to influencer profile page
            if (user && user.role === 'influencer') {
                returnUrl = '/influencer-onboarding?edit=true';
                // Ensure flag is set for callback
                sessionStorage.setItem('from_influencer_profile', 'true');
                console.log('🔵 Instagram/Facebook: Influencer user detected, setting return URL to profile:', returnUrl);
            } else if (fromInfluencerProfile) {
                // User came from influencer profile page (backup check)
                returnUrl = '/influencer-onboarding?edit=true';
                sessionStorage.setItem('from_influencer_profile', 'true');
                console.log('🔵 Instagram/Facebook: Flag detected, setting return URL to profile:', returnUrl);
            } else {
                // Determine return URL based on current page
                const currentPath = window.location.pathname;
                
                if (currentPath.includes('influencer-onboarding')) {
                    returnUrl = '/influencer-onboarding?edit=true';
                    sessionStorage.setItem('from_influencer_profile', 'true');
                } else if (currentPath.includes('influencer-settings')) {
                    returnUrl = '/influencer-settings';
                } else if (currentPath.includes('business-settings')) {
                    returnUrl = '/business-settings';
                } else if (currentPath.includes('business')) {
                    returnUrl = '/business-dashboard';
                } else {
                    returnUrl = '/influencer-dashboard'; // Default
                }
            }
            
            // Store return URL
            sessionStorage.setItem('oauth_return_url', returnUrl);
            localStorage.setItem('oauth_return_url_backup', returnUrl);

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
                // Triple-check return URL is set before redirecting (use the calculated returnUrl)
                sessionStorage.setItem('oauth_return_url', returnUrl);
                localStorage.setItem('oauth_return_url_backup', returnUrl);
                // Ensure flag is set if influencer user
                if (user && user.role === 'influencer') {
                    sessionStorage.setItem('from_influencer_profile', 'true');
                }
                console.log('🔵 Instagram/Facebook: About to redirect to OAuth. Return URL:', returnUrl);
                console.log('🔵 Instagram/Facebook: User role:', user?.role);
                console.log('🔵 Instagram/Facebook: From Influencer Profile Flag:', sessionStorage.getItem('from_influencer_profile'));
                
                // Use replace instead of href to avoid adding to browser history
                // This way, clicking back from OAuth provider will go back to the correct page
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

        try {
            const res = await fetch('http://localhost:5000/api/v1/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    socialMedia: {
                        [platform]: manualHandle
                    }
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess('Social media handle saved successfully!');
                if (dispatch && data.user) {
                    dispatch({
                        type: 'SET_USER',
                        payload: data.user
                    });
                }
                if (onSuccess) {
                    onSuccess(platform);
                }
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

    if (!isOpen || !currentPlatform) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#666',
                        padding: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    <FaTimes />
                </button>

                {/* Modal Content */}
                <div style={{ padding: '40px' }}>
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
                            color: '#fff'
                        }}>
                            {currentPlatform.icon}
                        </div>
                        <h2 style={{ color: '#333', marginBottom: '10px', fontSize: '24px' }}>
                            Connect {currentPlatform.name}
                        </h2>
                        <p style={{ color: '#666', fontSize: '0.95em', lineHeight: '1.6' }}>
                            {currentPlatform.description}
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 15px',
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            border: '1px solid #f5c6cb',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            padding: '12px 15px',
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            border: '1px solid #c3e6cb',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <FaCheckCircle />
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
                    {!isConnected && (
                        <div style={{ marginBottom: '30px' }}>
                            <button
                                type="button"
                                onClick={handleOAuthConnect}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '15px 20px',
                                    backgroundColor: loading ? '#ccc' : currentPlatform.color,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1em',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span>Connecting...</span>
                                    </>
                                ) : (
                                    <>
                                        {currentPlatform.icon}
                                        <span>Connect with {currentPlatform.name}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

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
                                        if (response.status === 'connected' && response.authResponse) {
                                            try {
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
                                                    checkConnectionStatus();
                                                    if (data.user && dispatch) {
                                                        dispatch({
                                                            type: 'SET_USER',
                                                            payload: data.user
                                                        });
                                                    }
                                                    if (onSuccess) {
                                                        onSuccess('facebook');
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
                                        if (response.error) {
                                            setError(response.error);
                                        } else if (response.status !== 'connected') {
                                            setError('Facebook login was cancelled or failed.');
                                        }
                                    }}
                                    style={{ width: '100%' }}
                                />
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
                        >
                            {savingManual ? 'Saving...' : 'Save Handle'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SocialConnectModal;
