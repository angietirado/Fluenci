// frontend/src/pages/SettingsPage.js

import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ProfileSettingsForm from '../components/settings/ProfileSettingsForm';
import PasswordSettingsForm from '../components/settings/PasswordSettingsForm';

const SettingsPage = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main-content">
                <Header title="Account Settings" />
                <main className="dashboard-main">
                    <div className="dashboard-content-area">
                        
                        <h2>Account Management</h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>
                            Update your personal information and change your password.
                        </p>

                        <div className="settings-grid">
                            {/* Profile Update Form */}
                            <section className="dashboard-section profile-section">
                                <h3>Personal Information</h3>
                                <ProfileSettingsForm />
                            </section>

                            {/* Password Update Form */}
                            <section className="dashboard-section password-section">
                                <h3>Password Settings</h3>
                                <PasswordSettingsForm />
                            </section>
                        </div>
                        
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;