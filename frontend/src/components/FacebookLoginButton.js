import React, { useEffect, useRef, useState } from 'react';
import useFacebookSDK from '../hooks/useFacebookSDK';

/**
 * Facebook Login Button Component
 * This implements the Facebook Login button using the SDK
 * 
 * Facebook provided these codes:
 * - <fb:login-button scope="public_profile,email" onlogin="checkLoginState();"></fb:login-button>
 * - function checkLoginState() { FB.getLoginStatus(function(response) { statusChangeCallback(response); }); }
 * 
 * This React component provides the same functionality in a React-friendly way
 */
const FacebookLoginButton = ({ 
    onLoginSuccess, 
    onLoginFailure, 
    scope = 'public_profile,email,pages_read_engagement,pages_show_list',
    buttonText = 'Continue with Facebook',
    className = '',
    style = {}
}) => {
    const { fbReady, fbError, checkLoginStatus } = useFacebookSDK();
    const [loading, setLoading] = useState(false);
    const buttonRef = useRef(null);

    /**
     * This is the checkLoginState function Facebook provided
     * It checks the login status after the user interacts with the button
     */
    const checkLoginState = (response) => {
        console.log('Facebook Login Status:', response);
        
        if (response.status === 'connected') {
            // User successfully logged in
            if (onLoginSuccess) {
                onLoginSuccess(response);
            }
        } else {
            // Login failed or was cancelled
            if (onLoginFailure) {
                onLoginFailure(response);
            }
        }
        setLoading(false);
    };

    /**
     * Handle button click - triggers Facebook SDK login
     */
    const handleLoginClick = () => {
        if (!fbReady || !window.FB) {
            console.error('Facebook SDK is not ready');
            if (onLoginFailure) {
                onLoginFailure({ error: 'Facebook SDK is not loaded' });
            }
            return;
        }

        setLoading(true);

        // Use Facebook SDK login (popup method)
        window.FB.login(function(response) {
            // After login attempt, check the status
            // This is equivalent to calling checkLoginState()
            checkLoginState(response);
        }, {
            scope: scope
        });
    };

    /**
     * Alternative: Use XFBML button (the fb:login-button tag Facebook provided)
     * This renders the Facebook-styled button automatically
     */
    useEffect(() => {
        if (fbReady && window.FB && buttonRef.current) {
            // Parse XFBML elements (like <fb:login-button>)
            window.FB.XFBML.parse(buttonRef.current);
        }
    }, [fbReady]);

    if (fbError) {
        return (
            <div style={{ padding: '10px', color: 'red' }}>
                Facebook SDK Error: {fbError}
            </div>
        );
    }

    if (!fbReady) {
        return (
            <button 
                disabled 
                className={className}
                style={{ ...style, opacity: 0.6, cursor: 'not-allowed' }}
            >
                Loading Facebook...
            </button>
        );
    }

    return (
        <div>
            {/* Option 1: Custom React Button (Recommended) */}
            <button
                ref={buttonRef}
                onClick={handleLoginClick}
                disabled={loading || !fbReady}
                className={className}
                style={{
                    backgroundColor: '#1877F2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    ...style
                }}
            >
                {loading ? (
                    <>
                        <span>Connecting...</span>
                    </>
                ) : (
                    <>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        {buttonText}
                    </>
                )}
            </button>

            {/* Option 2: XFBML Button (Facebook's native button) */}
            {/* Uncomment this if you want to use Facebook's native styled button */}
            {/* 
            <div ref={buttonRef}>
                <fb:login-button 
                    scope={scope}
                    onlogin="window.handleFacebookLogin"
                />
            </div>
            */}
        </div>
    );
};

export default FacebookLoginButton;
