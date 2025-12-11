import React, { createContext, useReducer, useEffect, useContext, useCallback } from 'react';

// 1. Initial State
// Safely get token from localStorage (check if window is available)
const getInitialToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token') || null;
    }
    return null;
};

const initialState = {
    user: null, 
    token: getInitialToken(), 
    isAuthenticated: false,
    loading: true // Indicates we are checking local storage/validating token
};

// 2. The Auth Reducer 
const AuthReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            // On successful login/registration, save token and user data
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                token: action.payload.token,
                user: action.payload.user,
                isAuthenticated: true,
                loading: false,
            };
        case 'LOGOUT':
            // On logout, remove token and clear state
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                user: null,
                isAuthenticated: false,
                loading: false,
            };
        case 'SET_USER':
            // Used to set user data after page reload using validated token
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                loading: false,
            };
        case 'AUTH_FAIL':
            // If token is invalid/missing or fetching user fails
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                user: null,
                isAuthenticated: false,
                loading: false,
            };
        default:
            return state;
    }
};

// 3. Create the Context
const AuthContext = createContext(initialState);

// 4. Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AuthReducer, initialState);

    // Use useCallback to memoize the function, preventing it from 
    // being redefined on every render.
    const fetchCurrentUser = useCallback(async (current_token) => {
        try {
            const res = await fetch('http://localhost:5000/api/v1/auth/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${current_token}`
                },
            });

            const data = await res.json();
            
            if (data.success) {
                dispatch({
                    type: 'SET_USER',
                    payload: data.data 
                });
            } else {
                dispatch({ type: 'AUTH_FAIL' });
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            dispatch({ type: 'AUTH_FAIL' });
        }
    }, [dispatch]); // Dependency on dispatch is standard practice

    // Effect to check local storage for a token on component mount
    // CRITICAL FIX: The empty dependency array [] ensures this runs ONLY ONCE.
    useEffect(() => {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
            dispatch({ type: 'AUTH_FAIL' });
            return;
        }

        const tokenFromStorage = localStorage.getItem('token');
        if (tokenFromStorage) {
            fetchCurrentUser(tokenFromStorage);
        } else {
            // Immediately set loading to false if no token is found
            dispatch({ type: 'AUTH_FAIL' });
        }
    }, [fetchCurrentUser]); // fetchCurrentUser is memoized, so this runs once

    // Value exposed to consuming components
    const value = {
        ...state,
        dispatch,
    };

    // Return the context provider
    return (
        <AuthContext.Provider value={value}>
            {/* We render the children immediately, letting the individual routes (like ProtectedRoute) 
            handle the loading state instead of blocking the entire app.
            */}
            {children} 
        </AuthContext.Provider>
    );
};

// 5. Custom Hook for easy access
export const useAuth = () => {
    return useContext(AuthContext);
};