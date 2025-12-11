import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = ({ onAuthSuccess, role }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { dispatch } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Client-side password validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            console.log('Sending registration request...');
            // Call the backend register API
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: role, // Pass the role (business or influencer)
                }),
            });

            console.log('Response status:', res.status);

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                // If response is not JSON, read text to see what happened (e.g. HTML error page)
                const text = await res.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            console.log('Response data:', data);

            if (!res.ok) {
                // Handle error response (status 400, etc.)
                const errorMessage = data.error || data.message || 'Registration failed. Please try again.';
                setError(errorMessage);
                setLoading(false);
                return;
            }

            if (data.success) {
                // Dispatch LOGIN_SUCCESS to AuthContext
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: {
                        token: data.token,
                        user: data.data,
                    },
                });

                // Navigate to onboarding for influencers, settings for businesses (first time)
                if (role === 'influencer') {
                    navigate('/influencer-onboarding', { replace: true });
                } else {
                    // Check if business has completed onboarding
                    if (data.data && !data.data.onboardingComplete) {
                        navigate('/business-settings', { replace: true });
                    } else {
                        navigate('/business-dashboard', { replace: true });
                    }
                }
            } else {
                // Handle error response
                const errorMessage = data.error || data.message || 'Registration failed. Please try again.';
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Registration error details:', err);
            setError(`Registration failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic label logic (Business Name vs. Full Name)
    const nameLabel = role === 'business' ? 'Business Name' : 'Full Name';

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
                <FaUser className="form-icon" />
                <input
                    type="text"
                    name="fullName"
                    placeholder={nameLabel}
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <FaEnvelope className="form-icon" />
                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <FaLock className="form-icon" />
                <input
                    type="password"
                    name="password"
                    placeholder="Choose Password (min 6 chars)"
                    value={formData.password}
                    onChange={handleChange}
                    minLength="6"
                    required
                />
            </div>

            <div className="form-group">
                <FaLock className="form-icon" />
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
        </form>
    );
};

export default Register;