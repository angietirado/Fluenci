import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SocialCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const authContext = useAuth();
    const token = authContext?.token;
    const user = authContext?.user;
    const dispatch = authContext?.dispatch;
    const [status, setStatus] = useState('Processing connection...');
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            const platform = searchParams.get('platform');
            const state = searchParams.get('state');
            const errorParam = searchParams.get('error');

            // Get return URL from sessionStorage IMMEDIATELY - before any async operations
            // This ensures we capture it even if sessionStorage gets cleared
            const storedReturnUrl = sessionStorage.getItem('oauth_return_url') || localStorage.getItem('oauth_return_url_backup');
            const fromInfluencerProfile = sessionStorage.getItem('from_influencer_profile') === 'true';
            console.log('🔍 OAuth Callback - Stored Return URL (sessionStorage):', sessionStorage.getItem('oauth_return_url'));
            console.log('🔍 OAuth Callback - Backup Return URL (localStorage):', localStorage.getItem('oauth_return_url_backup'));
            console.log('🔍 From Influencer Profile Flag:', fromInfluencerProfile);
            console.log('🔍 Current User Role:', user?.role);
            console.log('🔍 Current Path:', window.location.pathname);
            console.log('🔍 Document Referrer:', document.referrer);
            
            // Get return URL from sessionStorage (where user came from) - get it once at the start
            const getReturnUrl = () => {
                // Highest priority: Check if we came from influencer profile page
                // Also check stored return URL to see if it matches influencer profile
                const currentStored = sessionStorage.getItem('oauth_return_url');
                const currentFlag = sessionStorage.getItem('from_influencer_profile') === 'true';
                
                if (currentFlag || fromInfluencerProfile || currentStored === '/influencer-onboarding?edit=true') {
                    console.log('✅ Using influencer profile return URL (from flag or stored URL)');
                    // Clear the flag after using it
                    sessionStorage.removeItem('from_influencer_profile');
                    return '/influencer-onboarding?edit=true';
                }
                
                // Second priority: Check stored return URL
                if (storedReturnUrl) {
                    console.log('✅ Using stored return URL:', storedReturnUrl);
                    return storedReturnUrl;
                }
                // Try sessionStorage again (in case it was set after we started) - use already declared currentStored
                if (currentStored) {
                    console.log('✅ Using current sessionStorage return URL:', currentStored);
                    return currentStored;
                }
                // Try localStorage backup
                const backupStored = localStorage.getItem('oauth_return_url_backup');
                if (backupStored) {
                    console.log('✅ Using localStorage backup return URL:', backupStored);
                    return backupStored;
                }
                // Fallback: check user role to determine correct dashboard
                console.log('⚠️ No return URL found, checking user role:', user?.role);
                if (user && user.role === 'business') {
                    console.log('✅ Fallback: Redirecting business user to /business-dashboard');
                    return '/business-dashboard';
                }
                console.log('⚠️ Fallback: Defaulting to /influencer-onboarding?edit=true');
                return '/influencer-onboarding?edit=true';
            };

            if (errorParam) {
                const returnUrl = getReturnUrl();
                setError(`Connection failed: ${errorParam}`);
                setTimeout(() => {
                    sessionStorage.removeItem('oauth_return_url');
                    navigate(returnUrl);
                }, 3000);
                return;
            }

            // Check if we have tokens already (from backend exchange) or need code
            const accessToken = searchParams.get('accessToken');
            const hasTokens = !!accessToken;
            const code = searchParams.get('code');
            
            if (!platform || (!code && !hasTokens)) {
                const returnUrl = getReturnUrl();
                setError('Invalid callback parameters');
                setTimeout(() => {
                    sessionStorage.removeItem('oauth_return_url');
                    navigate(returnUrl);
                }, 3000);
                return;
            }

            if (!token) {
                setError('Please log in to complete the connection');
                setTimeout(() => {
                    navigate('/auth');
                }, 3000);
                return;
            }

            try {
                // Verify state token (only if we have a state parameter)
                if (state) {
                    const storedState = sessionStorage.getItem(`oauth_state_${platform}`);
                    if (storedState && storedState !== state) {
                        const returnUrl = getReturnUrl();
                        setError('Security verification failed. Please try again.');
                        setTimeout(() => {
                            sessionStorage.removeItem('oauth_return_url');
                            navigate(returnUrl);
                        }, 3000);
                        return;
                    }
                }

                setStatus(`Completing ${platform} connection...`);

                // Check if tokens were already exchanged by backend (e.g., YouTube)
                const refreshToken = searchParams.get('refreshToken');
                const channelId = searchParams.get('channelId');
                const channelName = searchParams.get('channelName');
                const followers = searchParams.get('followers');

                // Prepare request body
                const requestBody = {};
                if (hasTokens) {
                    // Tokens already exchanged by backend
                    requestBody.accessToken = accessToken;
                    requestBody.refreshToken = refreshToken || null;
                    if (channelId) requestBody.channelId = channelId;
                    if (channelName) requestBody.channelName = channelName;
                    if (followers) requestBody.followers = parseInt(followers);
                } else {
                    // Code needs to be exchanged (for platforms not yet fully implemented)
                    requestBody.code = code;
                }

                const res = await fetch(`http://localhost:5000/api/v1/social/complete/${platform}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody),
                });

                const data = await res.json();

                if (data.success) {
                    setStatus(`Successfully connected ${platform}!`);
                    
                    // Get return URL BEFORE clearing sessionStorage
                    const returnUrl = getReturnUrl();
                    console.log('✅ Success! Final return URL:', returnUrl);
                    console.log('✅ About to navigate to:', returnUrl);
                    
                    // Clear state token and return URL (but keep backup for debugging)
                    sessionStorage.removeItem(`oauth_state_${platform}`);
                    sessionStorage.removeItem('oauth_return_url');
                    // Don't clear localStorage backup yet - keep it for debugging

                    // Refresh user data
                    try {
                        const userRes = await fetch('http://localhost:5000/api/v1/auth/me', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const userData = await userRes.json();
                        if (userData.success && dispatch) {
                            dispatch({
                                type: 'SET_USER',
                                payload: userData.data
                            });
                        }
                    } catch (err) {
                        console.error('Error refreshing user:', err);
                    }

                    console.log('🚀 Redirecting to:', returnUrl);
                    console.log('🚀 User role at redirect time:', user?.role);

                    setTimeout(() => {
                        console.log('🚀 Executing redirect to:', returnUrl);
                        console.log('🚀 Current location before redirect:', window.location.href);
                        // Clear localStorage backup after successful redirect
                        localStorage.removeItem('oauth_return_url_backup');
                        // Use window.location for more reliable redirect
                        window.location.href = `${window.location.origin}${returnUrl}?connected=true`;
                    }, 2000);
                } else {
                    const returnUrl = getReturnUrl();
                    setError(data.error || 'Failed to complete connection');
                    sessionStorage.removeItem('oauth_return_url');
                    setTimeout(() => {
                        navigate(returnUrl);
                    }, 3000);
                }
            } catch (err) {
                console.error('Callback error:', err);
                const returnUrl = getReturnUrl();
                setError('An error occurred while completing the connection');
                sessionStorage.removeItem('oauth_return_url');
                setTimeout(() => {
                    navigate(returnUrl);
                }, 3000);
            }
        };

        handleCallback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, navigate, token, dispatch, user]);

    return (
        <div className="role-selection-wrapper">
            <div className="header-graphic">
                <div className="shape-1"></div>
                <div className="shape-2"></div>
                <div className="shape-3"></div>
                <div className="shape-4"></div>
                <div className="shape-5"></div>
            </div>

            <div className="auth-card" style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center' }}>
                {error ? (
                    <>
                        <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>Connection Failed</h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>{error}</p>
                        <p style={{ color: '#999', fontSize: '0.9em' }}>Redirecting back to onboarding...</p>
                    </>
                ) : (
                    <>
                        <h2 style={{ color: '#00c4cc', marginBottom: '20px' }}>Connecting Account</h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>{status}</p>
                        <div style={{ 
                            width: '50px', 
                            height: '50px', 
                            border: '4px solid #00c4cc',
                            borderTop: '4px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto'
                        }}></div>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </>
                )}
            </div>
        </div>
    );
};

export default SocialCallback;

