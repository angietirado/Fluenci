import React from 'react';
// Import the Menu icon
import { FaSignOutAlt, FaUserCircle, FaBars } from 'react-icons/fa'; 
import { useAuth } from '../../context/AuthContext'; 

const Header = () => {
    const { user, dispatch } = useAuth();

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
    };
    
    const userName = user ? user.name.split(' ')[0] : 'Guest';

    return (
        <header className="header">
            {/* 🚨 MOBILE MENU BUTTON: Only visible on small screens (via CSS) */}
            <button 
                className="mobile-menu-btn" 
                style={{
                    border: 'none', 
                    backgroundColor: 'transparent', 
                    cursor: 'pointer',
                    color: '#34495e',
                    marginRight: '15px',
                    fontSize: '18px'
                }}
                /* In a real app, this button would toggle a mobile sidebar drawer */
            >
                <FaBars />
            </button> 
            {/* --------------------------------------------- */}

            <div className="header-title">
                Dashboard Overview
            </div>
            
            <div className="header-profile">
                {/* User Profile Info */}
                <div className="header-user-info">
                    <FaUserCircle size={24} />
                    <span>Hello, {userName}</span>
                </div>

                {/* Logout Button */}
                <button 
                    onClick={handleLogout}
                    className="logout-btn"
                >
                    <FaSignOutAlt size={16} />
                    Logout
                </button>
            </div>
        </header>
    );
};

export default Header;