import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import RoleSelectionPage from './pages/RoleSelectionPage';
import AuthPage from './pages/AuthPage';
import InfluencerDashboardPage from './pages/InfluencerDashboardPage';
import InfluencerOnboarding from './pages/InfluencerOnboarding';
import InfluencerSettingsPage from './pages/InfluencerSettingsPage';
import SocialCallback from './pages/SocialCallback';
import SocialMediaConnectionPage from './pages/SocialMediaConnectionPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import BusinessSettingsPage from './pages/BusinessSettingsPage';
import BusinessAccountSettingsPage from './pages/BusinessAccountSettingsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Messaging from './pages/Messaging';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Import your global CSS file where all styles (including graphics) are defined
import './styles/DashboardLayout.css';

function App() {
    try {
        return (
            <ErrorBoundary>
                <AuthProvider>
                    <Router>
                        <Routes>
                            {/* Route 1: Initial Role Selection Page */}
                            <Route path="/" element={<RoleSelectionPage />} />

                            {/* Route 2: Login/Register Page (requires role to be passed in state) */}
                            <Route path="/auth" element={<AuthPage />} />

                            {/* Route 3: Influencer Onboarding */}
                            <Route path="/influencer-onboarding" element={<InfluencerOnboarding />} />

                            {/* Route 4: Influencer Settings */}
                            <Route path="/influencer-settings" element={<InfluencerSettingsPage />} />

                            {/* Route 5: Social Media OAuth Callback */}
                            <Route path="/social-callback" element={<SocialCallback />} />

                            {/* Route 5.5: Social Media Connection Page */}
                            <Route path="/connect-social/:platform" element={<SocialMediaConnectionPage />} />

                            {/* Route 6: Influencer Dashboard */}
                            <Route path="/influencer-dashboard" element={<InfluencerDashboardPage />} />

                            {/* Route 7: Business Dashboard */}
                            <Route path="/business-dashboard" element={<BusinessDashboardPage />} />

                            {/* Route 8: Business Settings (Profile) */}
                            <Route path="/business-settings" element={<BusinessSettingsPage />} />

                            {/* Route 9: Business Account Settings */}
                            <Route path="/business-account-settings" element={<BusinessAccountSettingsPage />} />

                            {/* Route 9: Reset Password Page */}
                            <Route path="/resetpassword/:resetToken" element={<ResetPasswordPage />} />

                            {/* Route 10: Messaging */}
                            <Route path="/messaging" element={<Messaging />} />

                            {/* Route 11: Privacy Policy */}
                            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                            {/* Optional: Add a catch-all route for 404 pages */}
                            {/* <Route path="*" element={<h1>404 Not Found</h1>} /> */}
                        </Routes>
                    </Router>
                </AuthProvider>
            </ErrorBoundary>
        );
    } catch (error) {
        console.error('App render error:', error);
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <h1>Application Error</h1>
                <p>{error.message}</p>
            </div>
        );
    }
}

export default App;