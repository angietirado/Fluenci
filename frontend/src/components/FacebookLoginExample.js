import React, { useEffect, useState } from 'react';
import useFacebookSDK from '../hooks/useFacebookSDK';

/**
 * Example component showing how to use Facebook SDK login functions
 * This demonstrates the FB.getLoginStatus() function Facebook provided
 * 
 * Note: Your app uses OAuth redirect flow, but this shows SDK-based login as an alternative
 */
const FacebookLoginExample = () => {
    const { fbReady, fbError, loginStatus, checkLoginStatus, login, logout } = useFacebookSDK();
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    // Check login status when component mounts and SDK is ready
    useEffect(() => {
        if (fbReady) {
            checkLoginStatus((response) => {
                console.log('Facebook Login Status:', response);
                
                // If user is connected, you can fetch their info
                if (response.status === 'connected') {
                    fetchUserInfo(response.authResponse.accessToken);
                }
            });
        }
    }, [fbReady, checkLoginStatus]);

    /**
     * Fetch user information using the access token
     */
    const fetchUserInfo = async (accessToken) => {
        try {
            const response = await fetch(
                `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
            );
            const data = await response.json();
            setUserInfo(data);
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    /**
     * Handle Facebook SDK login (popup method)
     * Alternative to OAuth redirect flow
     */
    const handleSDKLogin = async () => {
        setLoading(true);
        try {
            const response = await login({
                scope: 'pages_read_engagement,pages_show_list'
            });
            
            if (response.status === 'connected') {
                console.log('Login successful:', response);
                // Fetch user info
                fetchUserInfo(response.authResponse.accessToken);
            }
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle logout
     */
    const handleLogout = async () => {
        try {
            await logout();
            setUserInfo(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (fbError) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <p>Facebook SDK Error: {fbError}</p>
                <p>Make sure you've configured your App ID in index.html</p>
            </div>
        );
    }

    if (!fbReady) {
        return <div style={{ padding: '20px' }}>Loading Facebook SDK...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h3>Facebook SDK Login Example</h3>
            
            {/* Display login status */}
            <div style={{ marginBottom: '20px' }}>
                <h4>Login Status:</h4>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                    {JSON.stringify(loginStatus, null, 2)}
                </pre>
            </div>

            {/* Display user info if logged in */}
            {loginStatus?.status === 'connected' && userInfo && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '4px' }}>
                    <h4>User Information:</h4>
                    <p><strong>Name:</strong> {userInfo.name}</p>
                    <p><strong>ID:</strong> {userInfo.id}</p>
                    {userInfo.email && <p><strong>Email:</strong> {userInfo.email}</p>}
                    <p><strong>Access Token:</strong> {loginStatus.authResponse.accessToken.substring(0, 20)}...</p>
                </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {loginStatus?.status !== 'connected' ? (
                    <button 
                        onClick={handleSDKLogin} 
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#1877F2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Logging in...' : 'Login with Facebook SDK'}
                    </button>
                ) : (
                    <button 
                        onClick={handleLogout}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                )}
                
                <button 
                    onClick={() => checkLoginStatus((response) => {
                        alert(`Status: ${response.status}`);
                    })}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Check Login Status
                </button>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '4px' }}>
                <p><strong>Note:</strong> This example shows SDK-based login (popup).</p>
                <p>Your app currently uses <strong>OAuth redirect flow</strong> which redirects to Facebook and back.</p>
                <p>Both methods work - SDK login stays on your page, redirect flow navigates away.</p>
            </div>
        </div>
    );
};

export default FacebookLoginExample;
