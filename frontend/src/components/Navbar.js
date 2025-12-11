import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md fixed w-full top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center text-2xl font-bold text-indigo-600">
                            Fluenci
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {token && (
                                <>
                                    <Link to="/dashboard" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-indigo-600">
                                        Dashboard
                                    </Link>
                                    {user?.userType === 'Business' && (
                                        <>
                                            <Link to="/campaigns/new" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-indigo-600">
                                                Post Offer
                                            </Link>
                                            <Link to="/my-campaigns" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-indigo-600">
                                                My Campaigns
                                            </Link>
                                        </>
                                    )}
                                    {user?.userType === 'Influencer' && (
                                        <Link to="/campaigns" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-indigo-600">
                                            Discover
                                        </Link>
                                    )}
                                    <Link to="/messages" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-indigo-600">
                                        Messages
                                    </Link>
                                    <Link to="/analytics" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-indigo-600">
                                        Analytics
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {!token ? (
                            <>
                                <Link to="/login" className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-2">
                                    Log In
                                </Link>
                                <Link to="/signup" className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                    Sign Up
                                </Link>
                            </>
                        ) : (
                            <button 
                                onClick={handleLogout}
                                className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;