import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, apiUrl } from '../config/api';

const API_BASE_URL = `${API_URL}/api/campaigns`;

const CampaignDiscovery = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({}); // Placeholder for future filters
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const isInfluencer = user?.userType === 'Influencer';

    useEffect(() => {
        if (!token || !isInfluencer) {
            navigate('/login');
            return;
        }

        const fetchCampaigns = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                };
                
                // Fetch all open campaigns
                const response = await axios.get(API_BASE_URL, config);
                setCampaigns(response.data.data.campaigns);
                setLoading(false);
            } catch (err) {
                console.error("Discovery error:", err.response || err);
                setError(err.response?.data?.message || 'Failed to fetch campaigns.');
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, [navigate, token, isInfluencer]);
    
    const handleApply = async (campaignId) => {
        if (!window.confirm("Are you sure you want to apply to this campaign?")) {
            return;
        }

        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };
            
            // Send application POST request
            await axios.post(`${API_BASE_URL}/${campaignId}/apply`, {}, config);
            
            alert('Application sent successfully!');
            // Refresh campaigns list or update the status locally (recommended)
            setCampaigns(prev => prev.map(c => 
                c._id === campaignId ? { ...c, applications: [...c.applications, user._id] } : c
            ));
            
        } catch (err) {
            const message = err.response?.data?.message || 'Application failed.';
            alert(message);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-indigo-600">Loading campaign opportunities...</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-600">Error: {error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 mt-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
                Campaign Discovery 🔎
            </h1>
            <p className="text-lg text-gray-600 mb-10">
                Found **{campaigns.length}** opportunities matching your potential interests.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {campaigns.map((campaign) => {
                    const hasApplied = campaign.applications.includes(user._id);

                    return (
                        <div key={campaign._id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-indigo-700 mb-2">{campaign.title}</h2>
                                <p className="text-sm text-gray-500 mb-4">Posted by: <span className="font-medium text-gray-700">{campaign.business.name}</span></p>
                                
                                <p className="text-gray-700 mb-4 line-clamp-3">{campaign.description}</p>
                                
                                <div className="space-y-2 text-sm mb-4">
                                    <p><strong>Compensation:</strong> <span className="font-semibold text-green-700">{campaign.compensation}</span></p>
                                    <p><strong>Type:</strong> {campaign.type}</p>
                                    <p><strong>Location:</strong> {campaign.location}</p>
                                    <p><strong>Niches:</strong> <span className="text-indigo-500">{campaign.nicheRequired.join(', ')}</span></p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleApply(campaign._id)}
                                disabled={hasApplied}
                                className={`w-full py-2 font-semibold rounded-lg transition duration-300 ${
                                    hasApplied
                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                {hasApplied ? 'Applied' : 'Apply Now'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {campaigns.length === 0 && (
                 <div className="p-10 text-center text-gray-500 text-xl border rounded-lg mt-10">
                    No open campaigns found at this time. Check back later!
                </div>
            )}
        </div>
    );
};

export default CampaignDiscovery;