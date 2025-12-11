import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    if (!user) return null; // Wait for user data to load/be processed

    const isBusiness = user.userType === 'Business';

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 mt-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome back, {user.name}! 👋
            </h1>
            <p className="text-xl text-indigo-600 mb-10">
                Your **{user.userType}** Dashboard
            </p>

            {/* --- Quick Links --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <DashboardCard 
                    title="Analytics" 
                    description="View performance metrics, ratings, and trends." 
                    link="/analytics" 
                    color="bg-purple-500"
                />
                <DashboardCard 
                    title="Messages" 
                    description="Check your ongoing chats and start new collaborations." 
                    link="/messages" 
                    color="bg-cyan-500"
                />
                {isBusiness ? (
                    <>
                        <DashboardCard 
                            title="Manage Campaigns" 
                            description="Review influencer applications and track campaign status." 
                            link="/my-campaigns" 
                            color="bg-indigo-500"
                        />
                        <DashboardCard 
                            title="Post a New Offer" 
                            description="Start a new collaboration by posting a campaign." 
                            link="/campaigns/new" 
                            color="bg-green-500"
                        />
                    </>
                ) : (
                    <>
                        <DashboardCard 
                            title="Discover Campaigns" 
                            description="Browse the latest opportunities matching your niche." 
                            link="/campaigns" 
                            color="bg-yellow-500"
                        />
                        <DashboardCard 
                            title="Update Profile" 
                            description="Keep your follower count and engagement rate current." 
                            link="/profile-settings" 
                            color="bg-gray-500"
                        />
                    </>
                )}
            </div>
            
            {/* You could add a live feed or quick summary here */}
            <div className="mt-16 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800">Your Stats Summary</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 text-lg">
                    {user.averageRating !== undefined && (
                        <p><strong>Average Rating:</strong> <span className="text-yellow-600 font-bold">{user.averageRating.toFixed(2)} / 5</span></p>
                    )}
                    {user.followerCount !== undefined && (
                        <p><strong>Followers:</strong> {user.followerCount.toLocaleString()}</p>
                    )}
                    {user.engagementRate !== undefined && (
                        <p><strong>Engagement Rate:</strong> {(user.engagementRate * 100).toFixed(2)}%</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardCard = ({ title, description, link, color }) => (
    <Link to={link} className={`block p-6 ${color} text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition duration-300`}>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
        <span className="mt-4 inline-block font-semibold text-sm border-b border-white opacity-80">
            Go &rarr;
        </span>
    </Link>
);

export default Dashboard;