import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { API_V1 } from '../config/api';

// Register Chart.js components (Make sure to run: npm install chart.js react-chartjs-2)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE_URL = `${API_V1}/analytics`;

const AnalyticsDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/auth');
            return;
        }

        const fetchAnalytics = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${API_BASE_URL}/dashboard`, config);
                setMetrics(response.data.data.metrics);
                setLoading(false);
            } catch (err) {
                console.error("Analytics fetch error:", err.response || err);
                setError(err.response?.data?.message || 'Failed to fetch dashboard metrics.');
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [navigate, token]);

    if (loading) {
        return <div className="p-10 text-center text-indigo-600">Calculating performance metrics...</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-600">Error: {error}</div>;
    }
    
    if (!metrics) {
         return <div className="p-10 text-center text-gray-500">No data available to display.</div>;
    }

    const isBusiness = metrics.userType === 'Business';
    const chartLabels = metrics.campaignData.map(d => d.month);
    
    // Chart Data Setup
    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: isBusiness ? 'Total Spend ($)' : 'Total Reach',
                data: metrics.campaignData.map(d => isBusiness ? d.spend : d.reach),
                borderColor: isBusiness ? 'rgb(79, 70, 229)' : 'rgb(6, 182, 212)',
                backgroundColor: isBusiness ? 'rgba(79, 70, 229, 0.5)' : 'rgba(6, 182, 212, 0.5)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: isBusiness ? 'Monthly Campaign Spend Overview' : 'Monthly Campaign Reach Overview',
            },
        },
        scales: {
             y: {
                beginAtZero: true
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 mt-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
                {isBusiness ? 'Business Analytics Dashboard 📊' : 'Influencer Performance Dashboard 📈'}
            </h1>
            
            {/* --- Key Metrics Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <MetricCard title="Total Collaborations" value={metrics.totalCollaborations} color="indigo" />
                <MetricCard title="Average Rating" value={metrics.averageRating + ' / 5.0'} color="green" />
                
                {isBusiness ? (
                    <MetricCard title="Total Spend" value={`$${metrics.totalSpend}`} color="red" />
                ) : (
                    <MetricCard title="Avg. Engagement Rate" value={metrics.averageEngagement} color="cyan" />
                )}
            </div>

            {/* --- Data Visualization --- */}
            <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance Trend</h2>
                <div className="h-96">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, color }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border-l-8 border-${color}-500`}>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`mt-1 text-3xl font-extrabold text-${color}-700`}>{value}</p>
    </div>
);

export default AnalyticsDashboard;