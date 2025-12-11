// frontend/src/hooks/useDashboardData.js

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// 🚨 Accept refreshTrigger as a destructured property
const useDashboardData = ({ refreshTrigger }) => { 
    const { token } = useAuth();
    
    // Initialize data with default values
    const [data, setData] = useState({
        accountBalance: 0,
        budgetUsed: 0,
        newAlerts: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch('http://localhost:5000/api/v1/data/dashboard', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });

                const json = await res.json();

                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.error || 'Failed to fetch dashboard data.');
                }
            } catch (err) {
                setError('Network error: Could not connect to the backend server.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

    // 🚨 Add refreshTrigger to the dependency array. When this value changes, the hook re-runs.
    }, [token, refreshTrigger]); 

    return { data, loading, error };
};

export default useDashboardData;