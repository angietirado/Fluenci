import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaEnvelope, FaLock, FaKey } from 'react-icons/fa';

const BusinessAccountSettingsPage = () => {
    const navigate = useNavigate();
    const { user, token, dispatch, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [email, setEmail] = useState('');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    // Protect route - redirect if not logged in or not a business
    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user || !token) {
            navigate('/auth', { replace: true });
            return;
        }
        
        if (user.role !== 'business') {
            navigate('/influencer-dashboard', { replace: true });
            return;
        }

        setIsChecking(false);
        setResetEmail(user.email || '');
        setEmail(user.email || '');
    }, [user, token, navigate, authLoading]);

    const handleEmailChange = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setEmailLoading(true);

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            setEmailLoading(false);
            return;
        }

        // Check if email has changed
        if (email === user.email) {
            setError('Email is the same as your current email.');
            setEmailLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/v1/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess('Email updated successfully!');
                setIsEditingEmail(false);
                setResetEmail(email); // Update reset email too
                
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
            } else {
                setError(data.error || 'Failed to update email. Please try again.');
            }
        } catch (err) {
            console.error('Update email error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/v1/auth/forgotpassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: resetEmail }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(data.message || 'Password reset email sent! Check your inbox and spam folder.');
                setShowResetPassword(false);
            } else {
                setError(data.error || 'Failed to send password reset email. Please try again.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
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
                onClick={() => navigate('/business-dashboard')}
            >
                <FaArrowLeft /> Back
            </button>

            <div className="auth-card" style={{ maxWidth: '600px', margin: '50px auto' }}>
                <h2 style={{ color: '#00c4cc', marginBottom: '10px', textAlign: 'center' }}>
                    Account Settings
                </h2>
                <p style={{ color: '#666', marginBottom: '30px', textAlign: 'center', fontSize: '0.9em' }}>
                    Manage your account information and security settings.
                </p>

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

                {/* Email Section */}
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '12px', 
                        fontSize: '14px', 
                        color: '#666',
                        fontWeight: '500'
                    }}>
                        Email Address:
                    </label>
                    {!isEditingEmail ? (
                        <>
                            <div className="form-group">
                                <FaEnvelope className="form-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 45px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '1em',
                                        backgroundColor: '#f5f5f5',
                                        color: '#666',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditingEmail(true)}
                                style={{
                                    marginTop: '10px',
                                    padding: '8px 16px',
                                    backgroundColor: '#00c4cc',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.9em',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#009999'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#00c4cc'}
                            >
                                Change Email
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleEmailChange}>
                            <div className="form-group">
                                <FaEnvelope className="form-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
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
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={emailLoading}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px',
                                        backgroundColor: emailLoading ? '#ccc' : '#00c4cc',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.9em',
                                        fontWeight: '600',
                                        cursor: emailLoading ? 'not-allowed' : 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    {emailLoading ? 'Saving...' : 'Save Email'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditingEmail(false);
                                        setEmail(user?.email || '');
                                        setError(null);
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#6c757d',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.9em',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Password Section */}
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '12px', 
                        fontSize: '14px', 
                        color: '#666',
                        fontWeight: '500'
                    }}>
                        Password:
                    </label>
                    <div className="form-group">
                        <FaLock className="form-icon" />
                        <input
                            type="password"
                            value="••••••••"
                            disabled
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 45px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1em',
                                backgroundColor: '#f5f5f5',
                                color: '#666',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>
                </div>

                {/* Reset Password Section */}
                {!showResetPassword ? (
                    <div style={{ marginBottom: '30px' }}>
                        <button
                            type="button"
                            onClick={() => setShowResetPassword(true)}
                            style={{
                                width: '100%',
                                padding: '12px 20px',
                                backgroundColor: '#00c4cc',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1em',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#009999'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#00c4cc'}
                        >
                            <FaKey />
                            Reset Password
                        </button>
                    </div>
                ) : (
                    <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>
                            Reset Password
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                            We'll send a password reset link to your email address: <strong>{user?.email}</strong>
                        </p>
                        <form onSubmit={handleResetPassword}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '10px 20px',
                                        backgroundColor: loading ? '#ccc' : '#00c4cc',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.9em',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResetPassword(false);
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.9em',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusinessAccountSettingsPage;

