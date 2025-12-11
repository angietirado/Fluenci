// frontend/src/components/settings/PasswordSettingsForm.js

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaLock } from 'react-icons/fa';

const PasswordSettingsForm = () => {
    const { token, logout } = useAuth(); // We'll log the user out after a successful password change
    
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const { currentPassword, newPassword, confirmNewPassword } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError("New passwords do not match.");
            setLoading(false);
            return;
        }
        
        try {
            const res = await fetch('http://localhost:5000/api/v1/users/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const json = await res.json();

            if (json.success) {
                setSuccessMsg(json.message);
                // Clear form fields
                setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                
                // CRITICAL: Log user out for security after password change
                setTimeout(() => logout(), 2000); 

            } else {
                setError(json.error || 'Failed to change password.');
            }
        } catch (err) {
            setError('Network error: Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="settings-form" onSubmit={onSubmit}>
            {successMsg && <p className="alert alert-success">{successMsg}</p>}
            {error && <p className="alert alert-error">{error}</p>}

            {/* Current Password */}
            <div className="form-group">
                <FaLock className="form-icon" />
                <input
                    type="password"
                    placeholder="Current Password"
                    name="currentPassword"
                    value={currentPassword}
                    onChange={onChange}
                    required
                />
            </div>

            {/* New Password */}
            <div className="form-group">
                <FaLock className="form-icon" />
                <input
                    type="password"
                    placeholder="New Password (min 6 chars)"
                    name="newPassword"
                    value={newPassword}
                    onChange={onChange}
                    required
                    minLength="6"
                />
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
                <FaLock className="form-icon" />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    name="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={onChange}
                    required
                    minLength="6"
                />
            </div>

            <button type="submit" className="btn btn-secondary" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
            </button>
        </form>
    );
};

export default PasswordSettingsForm;