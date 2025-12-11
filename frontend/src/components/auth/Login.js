import React, { useState } from 'react';
import { FaUser, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = ({ onAuthSuccess, role }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const authContext = useAuth();
    const dispatch = authContext?.dispatch;
    
    // Safety check
    if (!dispatch) {
        console.error('AuthContext dispatch is not available. Make sure AuthProvider wraps the App.');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, role }),
            });

            // Check if response is ok before parsing
            const contentType = res.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                console.error('Non-JSON response:', text);
                setError('Server returned an invalid response. Please check if the backend is running.');
                return;
            }

            const data = await res.json();

            // Check HTTP status code first
            if (!res.ok) {
                setError(data.error || 'Login failed. Please check your credentials.');
                console.error('Login failed:', {
                    status: res.status,
                    statusText: res.statusText,
                    data: data
                });
                return;
            }

            if (data.success) {
                if (dispatch) {
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: {
                            token: data.token,
                            user: data.data,
                        },
                    });
                } else {
                    // Fallback: store token in localStorage manually
                    localStorage.setItem('token', data.token);
                    console.warn('AuthContext dispatch not available, using localStorage fallback');
                }

                // Check if user needs onboarding
                if (role === 'influencer' && data.data && !data.data.onboardingComplete) {
                    navigate('/influencer-onboarding', { replace: true });
                } else if (role === 'business' && data.data && !data.data.onboardingComplete) {
                    navigate('/business-settings', { replace: true });
                } else {
                    const targetDashboard = role === 'business' ? '/business-dashboard' : '/influencer-dashboard';
                    navigate(targetDashboard, { replace: true });
                }
            } else {
                setError(data.error || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            
            // More specific error messages
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                setError('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
            } else if (err.message.includes('JSON')) {
                setError('Server returned an invalid response. Please check the backend logs.');
            } else {
                setError(`An error occurred: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
                <FaUser className="form-icon" />
                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div className="form-group">
                <FaLock className="form-icon" />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
        </form>
    );
};

export default Login;