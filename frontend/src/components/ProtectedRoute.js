import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component now accepts a 'requiredRole' prop
const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, loading, user } = useAuth();
    
    // 1. Handle Loading State
    if (loading) {
        return <div style={{padding: '50px', textAlign: 'center'}}>Authenticating...</div>;
    }

    // 2. Handle Authentication (Must be logged in)
    if (!isAuthenticated) {
        return <Navigate to="/" replace />; // Redirect to login if not authenticated
    }
    
    // 3. Handle Role-Based Access (If a role is required)
    if (requiredRole) {
        const userRole = user ? user.role : 'user'; // Default to 'user' if undefined
        
        // Define accepted roles. We can make 'admin' supersede 'user'.
        // For simplicity, we just check if the user's role matches the required role.
        if (userRole !== requiredRole) {
            // If the role doesn't match (e.g., 'user' tries to access 'admin' route)
            console.warn(`Access Denied: User role '${userRole}' cannot access route requiring '${requiredRole}'`);
            
            // Redirect unauthorized users to the dashboard
            return <Navigate to="/dashboard" replace />;
        }
    }

    // 4. Access Granted
    return children ? children : <Outlet />;
};

export default ProtectedRoute;