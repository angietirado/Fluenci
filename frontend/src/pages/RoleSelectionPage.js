// frontend/src/pages/RoleSelectionPage.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
//import Header from '../components/layout/Header'; // Reusing header/sidebar styles

const RoleSelectionPage = () => {
    const navigate = useNavigate();

    const selectRole = (role) => {
        // Navigate to the AuthPage and pass the selected role as state
        navigate('/auth', { state: { selectedRole: role } });
    };

    return (
        <div className="role-selection-wrapper">
            
            <div className = "header-graphic">
                <div className="shape-1"></div>
                <div className="shape-2"></div>
                <div className="shape-3"></div>
                <div className="shape-4"></div>
                <div className="shape-5"></div>
            </div>

            <div className="role-selection-card">
                <div className = "welcome-text">
                    <h1>WELCOME TO</h1>
                    <h1 className="fluenci-title">FLUENCI</h1>
                </div>
                
                <p className="question-text">Are you a(n):</p>

                <div className="role-buttons">
                    <button 
                        className="btn btn-influencer" 
                        onClick={() => selectRole('influencer')}
                    >
                        INFLUENCER
                    </button>
                    <button 
                        className="btn btn-business" 
                        onClick={() => selectRole('business')}
                    >
                        BUSINESS
                    </button>
                </div>
                
                {/* <p className="note">
                    *The experience and dashboard will be customized based on your choice.
                </p> */}
            </div>
        </div>
    );
};

export default RoleSelectionPage;