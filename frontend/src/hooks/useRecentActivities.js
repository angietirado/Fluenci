// frontend/src/hooks/useRecentActivities.js

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL, apiUrl } from '../config/api';

// 🚨 Accept refreshTrigger as a destructured property
const useRecentActivities = ({ refreshTrigger }) => { 
    const { token } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchActivities = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`${API_URL}/api/v1/data/activities`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });

                const json = await res.json();

                if (json.success) {
                    setActivities(json.data);
                } else {
                    setError(json.error || 'Failed to fetch activities.');
                }
            } catch (err) {
                setError('Network error: Could not connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();

    // 🚨 Add refreshTrigger to the dependency array. When this value changes, the hook re-runs.
    }, [token, refreshTrigger]); 

    return { activities, loading, error };
};

export default useRecentActivities;