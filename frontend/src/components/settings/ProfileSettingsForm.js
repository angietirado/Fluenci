// frontend/src/components/settings/ProfileSettingsForm.js

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUserCircle, FaEnvelope, FaGlobe, FaFileAlt } from 'react-icons/fa';

const ProfileSettingsForm = () => {
    const { user, token, loadUser } = useAuth();
    
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        background: user.background || '',
        personalWebsite: user.personalWebsite || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const { name, email, background, personalWebsite } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await fetch('http://localhost:5000/api/v1/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, background, personalWebsite })
            });

            const json = await res.json();

            if (json.success) {
                setSuccessMsg('Profile updated successfully!');
                // Reload user context to update the UI globally
                loadUser(); 
            } else {
                setError(json.error || 'Failed to update profile.');
            }
        } catch (err) {
            setError('Network error: Could not connect to the server.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMsg(null), 3000); 
        }
    };

    return (
        <form className="settings-form" onSubmit={onSubmit}>
            {successMsg && <p className="alert alert-success">{successMsg}</p>}
            {error && <p className="alert alert-error">{error}</p>}

            {/* Name Input */}
            <div className="form-group">
                <FaUserCircle className="form-icon" />
                <input
                    type="text"
                    placeholder="Full Name"
                    name="name"
                    value={name}
                    onChange={onChange}
                    required
                />
            </div>

            {/* Background Input */}
            <div className="form-group">
                <FaFileAlt className="form-icon" style={{ alignSelf: 'flex-start', marginTop: '12px' }} />
                <textarea
                    placeholder="Background (Tell us about yourself, your experience, etc.)"
                    name="background"
                    value={background}
                    onChange={onChange}
                    rows="4"
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        minHeight: '100px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00c4cc'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
            </div>

            {/* Personal Website Input */}
            <div className="form-group">
                <FaGlobe className="form-icon" />
                <input
                    type="url"
                    placeholder="Personal Website URL (e.g., https://yourwebsite.com)"
                    name="personalWebsite"
                    value={personalWebsite}
                    onChange={onChange}
                />
            </div>

            {/* Email Input */}
            <div className="form-group">
                <FaEnvelope className="form-icon" />
                <input
                    type="email"
                    placeholder="Email Address"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Save Profile'}
            </button>
        </form>
    );
};

export default ProfileSettingsForm;