import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <-- Imports your global styles (like the sketchbook theme)
import App from './App'; // <-- Imports your main App component
// src/index.js (or src/App.js)
import './styles/DashboardLayout.css'; // Add this line
// ... (rest of the file)

// If you were using Redux or a similar state management system, 
// the Provider wrapper would go here.

// Uses the new React 18+ way to mount the application
const rootElement = document.getElementById('root');

if (!rootElement) {
    console.error('Root element not found! Make sure index.html has <div id="root"></div>');
} else {
    const root = ReactDOM.createRoot(rootElement);

    // Renders the main App component into the element with id="root" 
    // (which is in public/index.html)
    try {
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
        console.log('App rendered successfully');
    } catch (error) {
        console.error('Error rendering app:', error);
        root.render(
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <h1>Application Error</h1>
                <p>{error.message}</p>
                <pre>{error.stack}</pre>
            </div>
        );
    }
}