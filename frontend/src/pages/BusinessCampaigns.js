import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_V1 } from '../config/api';

const API_BASE_URL = `${API_V1}/campaigns`;
const MSG_API_BASE_URL = `${API_V1}/messages`;

const BusinessCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const isBusiness = user && user.role === 'business';

    useEffect(() => {
        if (!isBusiness || !token) {
            navigate('/auth');
            return;
        }

        const fetchBusinessCampaigns = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${API_BASE_URL}/my-campaigns`, config);
                setCampaigns(response.data.data.campaigns);
                setLoading(false);
            } catch (err) {
                console.error("Management error:", err.response || err);
                setError(err.response?.data?.message || 'Failed to fetch campaigns.');
                setLoading(false);
            }
        };

        fetchBusinessCampaigns();
    }, [navigate, isBusiness, token]);
    
    // --- Application Acceptance Logic (Starts a chat) ---
    const handleAcceptApplicant = async (campaignId, influencerId) => {
        try {
            if (!window.confirm("Accepting this applicant will start a private chat. Proceed?")) {
                return;
            }

            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // 1. Start a chat with the influencer (uses startChat endpoint we created)
            const chatRes = await axios.post(`${MSG_API_BASE_URL}/start-chat/${influencerId}`, {}, config);
            
            // 2. Placeholder: You would update the campaign status here (e.g., set activeInfluencer and status='In Progress')
            // This requires a new endpoint like POST /api/campaigns/:id/accept

            alert(`Chat started with Influencer ID ${influencerId}. You can continue the discussion in the Messages tab.`);
            navigate('/messages'); 

        } catch (err) {
             alert(err.response?.data?.message || 'Failed to accept applicant or start chat.');
        }
    };

    if (!isBusiness) {
        return <div className="p-10 text-center text-red-600">Access Denied: This page is for Businesses only.</div>;
    }
    
    if (loading) {
        return <div className="p-10 text-center text-indigo-600">Loading your campaign manager...</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-600">Error: {error}</div>;
    }
    
    if (campaigns.length === 0) {
        return <div className="p-10 text-center text-gray-500">You haven't posted any campaigns yet.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 mt-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
                Campaign Management 💼
            </h1>
            <p className="text-lg text-gray-600 mb-10">
                View your active campaigns and the influencers who have applied.
            </p>

            {campaigns.map((campaign) => (
                <div key={campaign._id} className="bg-white p-8 mb-10 rounded-xl shadow-2xl border border-indigo-100">
                    <div className="flex justify-between items-start mb-4 border-b pb-4">
                        <h2 className="text-3xl font-extrabold text-indigo-700">{campaign.title}</h2>
                        <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                            campaign.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            Status: {campaign.status}
                        </span>
                    </div>

                    <p className="text-gray-700 mb-6">{campaign.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                        <div><strong className="text-gray-500">Compensation:</strong> <p>{campaign.compensation}</p></div>
                        <div><strong className="text-gray-500">Location:</strong> <p>{campaign.location}</p></div>
                        <div><strong className="text-gray-500">Type:</strong> <p>{campaign.type}</p></div>
                        <div><strong className="text-gray-500">Niches:</strong> <p>{campaign.nicheRequired.join(', ')}</p></div>
                    </div>

                    {/* --- APPLICANTS SECTION --- */}
                    <h3 className="text-xl font-bold mt-8 mb-4 border-t pt-4">
                        Applications ({campaign.applications.length})
                    </h3>
                    
                    {campaign.applications.length === 0 ? (
                        <p className="text-gray-500 italic">No influencers have applied yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaign.applications.map((influencer) => (
                                <div key={influencer._id} className="bg-gray-50 p-4 rounded-lg shadow border border-gray-200">
                                    <h4 className="font-semibold text-lg text-gray-900">{influencer.name}</h4>
                                    <p className="text-sm text-gray-600">
                                        Followers: <span className="font-medium">{influencer.followerCount?.toLocaleString() || 'N/A'}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Rate: <span className="font-medium">{(influencer.engagementRate * 100).toFixed(2) || 'N/A'}%</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Niches: {influencer.niche?.join(', ') || 'None'}</p>
                                    
                                    <button 
                                        onClick={() => handleAcceptApplicant(campaign._id, influencer._id)}
                                        className="mt-3 w-full py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                                    >
                                        Accept & Chat
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default BusinessCampaigns;