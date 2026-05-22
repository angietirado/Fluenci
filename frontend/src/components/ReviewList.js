import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_V1 } from '../config/api';

const API_BASE_URL = `${API_V1}/reviews`;

const ReviewList = ({ userId, userName }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');
    
    useEffect(() => {
        if (!userId || !token) return;

        const fetchReviews = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`${API_BASE_URL}/${userId}`, config);
                setReviews(res.data.data.reviews);
                setLoading(false);
            } catch (err) {
                console.error("Review fetch error:", err);
                setError('Failed to load reviews.');
                setLoading(false);
            }
        };

        fetchReviews();
    }, [userId, token]);

    if (loading) return <p className="text-center text-indigo-500">Loading reviews...</p>;
    if (error) return <p className="text-center text-red-500">Error: {error}</p>;

    return (
        <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Reviews for {userName} ({reviews.length})</h3>
            
            {reviews.length === 0 ? (
                <p className="text-gray-500 italic">No reviews have been submitted for this user yet.</p>
            ) : (
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review._id} className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xl font-extrabold text-indigo-600">
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700 mb-3 italic">"{review.comment}"</p>
                            <div className="text-sm text-gray-600 border-t pt-2">
                                <span className="font-semibold">{review.reviewer.name}</span>, a {review.reviewer.userType}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Collaboration: {review.campaign.title}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewList;