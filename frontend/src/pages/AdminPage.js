// frontend/src/pages/AdminPage.js

import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext'; 

const AdminPage = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const res = await fetch('http://localhost:5000/api/v1/users', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // CRITICAL: Attach the JWT for the protected route
                        'Authorization': `Bearer ${token}`
                    },
                });

                const json = await res.json();

                if (json.success) {
                    setUsers(json.data);
                } else {
                    // This will catch the 403 Forbidden error from the server
                    setError(json.error || 'Failed to fetch user data. Access Denied.');
                }
            } catch (err) {
                setError('Network error: Could not connect to the server.');
            } finally {
                setLoading(false);
            }
        };
        
        // Only fetch if token exists
        if (token) {
            fetchUsers();
        }

    }, [token]);

    // Handle Loading and Error States
    const renderContent = () => {
        if (loading) return <p>Loading user data...</p>;
        if (error) return <p style={{color: 'red'}}>ERROR: {error}</p>;

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4' }}>
                        <th style={tableHeaderStyle}>ID</th>
                        <th style={tableHeaderStyle}>Name</th>
                        <th style={tableHeaderStyle}>Email</th>
                        <th style={tableHeaderStyle}>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tableCellStyle}>{user._id.slice(-6)}</td>
                            <td style={tableCellStyle}>{user.name}</td>
                            <td style={tableCellStyle}>{user.email}</td>
                            <td style={tableCellStyle}>{user.role}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main-content">
                <Header />
                <main className="dashboard-main">
                    <div className="dashboard-content-area">
                        <h2>🔑 User Management Panel</h2>
                        <p style={{ marginBottom: '20px' }}>
                            This data is restricted to administrators only.
                        </p>
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

const tableHeaderStyle = { padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' };
const tableCellStyle = { padding: '10px', textAlign: 'left' };

export default AdminPage;