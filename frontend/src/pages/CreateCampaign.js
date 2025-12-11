import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/campaigns';

const CreateCampaign = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Paid Post',
        compensation: '',
        location: '',
        nicheRequired: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    useEffect(() => {
        if (!token || user?.userType !== 'Business') {
            navigate('/dashboard'); // Restrict access to Businesses only
        }
    }, [token, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        };

        try {
            const res = await axios.post(API_BASE_URL, formData, config);
            setLoading(false);
            alert(`Campaign "${res.data.data.campaign.title}" posted successfully!`);
            navigate('/my-campaigns');
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to post campaign.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 mt-10 bg-white shadow-2xl rounded-xl border border-indigo-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">
                Post New Campaign Opportunity ✨
            </h1>
            
            {error && <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500" />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" rows="4" value={formData.description} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500"></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Collaboration Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500">
                            <option value="Paid Post">Paid Post</option>
                            <option value="Free Product">Free Product</option>
                            <option value="Affiliate">Affiliate</option>
                            <option value="Trade">Trade (Service/Exchange)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="compensation" className="block text-sm font-medium text-gray-700">Compensation Details</label>
                        <input type="text" name="compensation" placeholder="e.g., $500, Free Luxury Watch" value={formData.compensation} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                        <input type="text" name="location" placeholder="e.g., Remote, Los Angeles, CA" value={formData.location} onChange={handleChange} required className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="nicheRequired" className="block text-sm font-medium text-gray-700">Required Niche(s)</label>
                        <input type="text" name="nicheRequired" placeholder="e.g., Food, Travel, Fitness (comma separated)" value={formData.nicheRequired} onChange={handleChange} className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500" />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-50">
                    {loading ? 'Posting...' : 'Post Campaign'}
                </button>
            </form>
        </div>
    );
};

export default CreateCampaign;