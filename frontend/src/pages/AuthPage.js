// frontend/src/pages/AuthPage.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import { FaArrowLeft, FaUser } from 'react-icons/fa';

const AuthPage = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Get the role from the state passed by the RoleSelectionPage
    const selectedRole = location.state?.selectedRole;

    // 🚨 Redirection check: If no role is selected, send the user back to the selector
    // Use useEffect to prevent infinite loops
    useEffect(() => {
        if (!selectedRole) {
            navigate('/', { replace: true });
        }
    }, [selectedRole, navigate]);

    // Return loading state while redirecting
    if (!selectedRole) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <p>Redirecting...</p>
            </div>
        );
    }

    const onAuthSuccess = () => {
        // The AuthContext handles the redirect to /dashboard upon successful auth.
    };

    const handleSwitchForm = () => setIsRegister(prev => !prev);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetMessage(null);
        setResetLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/v1/auth/forgotpassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: resetEmail }),
            });

            const data = await res.json();

            if (data.success) {
                // If we have a reset token (development mode), navigate to reset page
                if (data.resetToken) {
                    setResetMessage({ 
                        type: 'success', 
                        text: 'Redirecting to password reset page...' 
                    });
                    setTimeout(() => {
                        navigate(`/resetpassword/${data.resetToken}`);
                    }, 1000);
                } else {
                    // Production mode - email sent
                    setResetMessage({ 
                        type: 'success', 
                        text: 'Password reset email sent! Check your inbox.' 
                    });
                    setResetEmail('');
                    setTimeout(() => {
                        setShowForgotPassword(false);
                        setResetMessage(null);
                    }, 3000);
                }
            } else {
                setResetMessage({ type: 'error', text: data.error || 'Failed to send reset email.' });
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setResetMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setResetLoading(false);
        }
    };

    // Customize title based on selected role (e.g., "Influencer")
    const title = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);

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
                onClick={() => navigate('/', { replace: true })}
            >
                <FaArrowLeft /> Back
            </button>

            <div className="auth-card">
                <h2>{isRegister ? `Register as ${title}` : `Log In as ${title}`}</h2>

                {isRegister ? (
                    <Register onAuthSuccess={onAuthSuccess} role={selectedRole} />
                ) : (
                    <Login onAuthSuccess={onAuthSuccess} role={selectedRole} />
                )}

                <p className="switch-link">
                    {isRegister ? "Already have an account?" : "Don't have an account?"}
                </p>

                <div className="auth-links">
                    <button onClick={handleSwitchForm} className="text-button">
                        {isRegister ? 'Log In' : 'Register'}
                    </button>

                    {/* Forgot Password Link - Only show on Login */}
                    {!isRegister && (
                        <>
                            <span className="link-separator">•</span>
                            <button
                                type="button"
                                className="text-button"
                                onClick={() => setShowForgotPassword(true)}
                            >
                                Forgot Password?
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Reset Password</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        {resetMessage && (
                            <div className={`alert ${resetMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                                {resetMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleForgotPassword}>
                            <div className="form-group">
                                <FaUser className="form-icon" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={resetLoading}
                                    style={{ flex: 1 }}
                                >
                                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetMessage(null);
                                        setResetEmail('');
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;