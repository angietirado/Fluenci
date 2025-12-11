import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { resetToken } = useParams();
    const navigate = useNavigate();

    // Check if reset token exists
    useEffect(() => {
        if (!resetToken) {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, [resetToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`http://localhost:5000/api/v1/auth/resetpassword/${resetToken}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle HTTP error status codes
                setError(data.error || 'Failed to reset password. The link may be invalid or expired.');
                return;
            }

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                setError(data.error || 'Failed to reset password. The link may be invalid or expired.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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

            <div className="auth-card">
                <h2 style={{ color: '#00c4cc', marginBottom: '10px' }}>Reset Password</h2>
                <p style={{ color: '#666', marginBottom: '30px', fontSize: '0.9em' }}>
                    Enter your new password below.
                </p>

                {success ? (
                    <div className="alert alert-success">
                        <strong>Success!</strong> Your password has been reset. Redirecting to login...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="form-group">
                            <FaLock className="form-icon" />
                            <input
                                type="password"
                                placeholder="New Password (min 6 chars)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>

                        <div className="form-group">
                            <FaLock className="form-icon" />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                        </button>

                        <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
                            Remember your password?{' '}
                            <button
                                type="button"
                                className="text-button"
                                onClick={() => navigate('/')}
                                style={{ display: 'inline', padding: 0 }}
                            >
                                Back to Login
                            </button>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
