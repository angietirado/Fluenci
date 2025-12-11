import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] bg-gray-50 p-6 text-center">
            <h1 className="text-6xl font-extrabold text-gray-900 mb-4">
                Fluenci 🤝
            </h1>
            <p className="text-xl text-indigo-600 mb-8 max-w-2xl">
                The premier platform connecting businesses with the perfect influencers for impactful campaigns.
            </p>
            <div className="space-x-4">
                <Link to="/signup" className="px-6 py-3 bg-indigo-600 text-white text-lg font-medium rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300">
                    Get Started
                </Link>
                <Link to="/campaigns" className="px-6 py-3 bg-white border border-indigo-600 text-indigo-600 text-lg font-medium rounded-lg shadow-lg hover:bg-indigo-50 transition duration-300">
                    View Campaigns
                </Link>
            </div>
        </div>
    );
};

export default Home;