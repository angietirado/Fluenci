// frontend/src/components/layout/Sidebar.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaCog, FaSignOutAlt } from 'react-icons/fa'; // FaCog for settings
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout, user } = useAuth();
    const isAdmin = user && user.role === 'admin';

    return (
        <nav className="sidebar">
            <h1 className="logo">Fluenci</h1>
            <ul className="nav-links">
                
                {/* Dashboard */}
                <li>
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                        <FaTachometerAlt /> Dashboard
                    </NavLink>
                </li>

                {/* 🚨 NEW: Settings */}
                <li>
                    <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                        <FaCog /> Settings
                    </NavLink>
                </li>

                {/* Admin Link (Conditional) */}
                {isAdmin && (
                    <li>
                        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
                            <FaUsers /> Admin
                        </NavLink>
                    </li>
                )}
            </ul>

            {/* Logout button remains the same */}
            <div className="sidebar-footer">
                <button onClick={logout} className="btn-logout">
                    <FaSignOutAlt /> Logout
                </button>
                <p className="user-info">Logged in as: {user ? user.name : 'Guest'}</p>
            </div>
        </nav>
    );
};

export default Sidebar;