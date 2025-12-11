import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook to use Facebook SDK
 * @returns {Object} Object containing FB instance, loading state, and helper functions
 */
const useFacebookSDK = () => {
    const [fbReady, setFbReady] = useState(false);
    const [fbError, setFbError] = useState(null);
    const [loginStatus, setLoginStatus] = useState(null);

    useEffect(() => {
        // Check if Facebook SDK is already loaded
        if (window.FB) {
            setFbReady(true);
            // Check login status when SDK is ready
            checkLoginStatus();
            return;
        }

        // Wait for FB to be initialized
        const checkFB = setInterval(() => {
            if (window.FB) {
                setFbReady(true);
                clearInterval(checkFB);
                // Check login status when SDK becomes ready
                checkLoginStatus();
            }
        }, 100);

        // Timeout after 10 seconds
        const timeout = setTimeout(() => {
            clearInterval(checkFB);
            if (!window.FB) {
                setFbError('Facebook SDK failed to load. Please check your App ID configuration.');
            }
        }, 10000);

        return () => {
            clearInterval(checkFB);
            clearTimeout(timeout);
        };
    }, []);

    /**
     * Check Facebook login status
     * This is the function Facebook provided: FB.getLoginStatus()
     * @param {Function} callback - Optional callback function to handle the response
     * @returns {Promise} Promise that resolves with the login status response
     */
    const checkLoginStatus = useCallback((callback) => {
        if (!window.FB) {
            const error = 'Facebook SDK is not loaded yet.';
            if (callback) callback({ status: 'unknown', error });
            return Promise.reject(error);
        }

        return new Promise((resolve, reject) => {
            window.FB.getLoginStatus(function(response) {
                // Response structure Facebook provided:
                // {
                //     status: 'connected', // or 'not_authorized', 'unknown'
                //     authResponse: {
                //         accessToken: '...',
                //         expiresIn: '...',
                //         signedRequest: '...',
                //         userID: '...'
                //     }
                // }
                
                setLoginStatus(response);
                
                if (callback) {
                    callback(response);
                }
                
                if (response.status === 'connected') {
                    resolve(response);
                } else {
                    resolve(response); // Still resolve, but status will indicate not connected
                }
            });
        });
    }, []);

    /**
     * Login with Facebook SDK (popup method)
     * Alternative to OAuth redirect flow
     * @param {Object} options - Login options (scope, etc.)
     * @returns {Promise} Promise that resolves with the login response
     */
    const login = useCallback((options = {}) => {
        if (!window.FB) {
            const error = 'Facebook SDK is not loaded yet.';
            return Promise.reject(error);
        }

        return new Promise((resolve, reject) => {
            window.FB.login(function(response) {
                if (response.status === 'connected') {
                    setLoginStatus(response);
                    resolve(response);
                } else {
                    reject(new Error('Facebook login failed or was cancelled.'));
                }
            }, {
                scope: options.scope || 'pages_read_engagement,pages_show_list',
                ...options
            });
        });
    }, []);

    /**
     * Logout from Facebook SDK
     * @returns {Promise} Promise that resolves when logout is complete
     */
    const logout = useCallback(() => {
        if (!window.FB) {
            return Promise.reject('Facebook SDK is not loaded yet.');
        }

        return new Promise((resolve) => {
            window.FB.logout(function(response) {
                setLoginStatus({ status: 'unknown' });
                resolve(response);
            });
        });
    }, []);

    return {
        FB: window.FB,
        fbReady,
        fbError,
        loginStatus,
        checkLoginStatus,
        login,
        logout
    };
};

export default useFacebookSDK;
