import React, { useMemo, useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const BusinessMap = ({ businesses, height = '400px' }) => {
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [businessLocations, setBusinessLocations] = useState([]);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Default center (can be adjusted based on user location or businesses)
    const defaultCenter = useMemo(() => ({
        lat: 40.7128, // New York City default
        lng: -74.0060
    }), []);

    // Geocode location strings to coordinates
    useEffect(() => {
        const geocodeLocations = async () => {
            if (!window.google || !mapLoaded || !window.google.maps) return;

            const geocoder = new window.google.maps.Geocoder();
            const locations = [];

            // Process businesses in batches to avoid rate limiting
            for (const business of businesses) {
                if (business.location) {
                    try {
                        const result = await new Promise((resolve, reject) => {
                            geocoder.geocode(
                                { address: business.location },
                                (results, status) => {
                                    if (status === 'OK' && results[0]) {
                                        resolve({
                                            lat: results[0].geometry.location.lat(),
                                            lng: results[0].geometry.location.lng()
                                        });
                                    } else {
                                        reject(status);
                                    }
                                }
                            );
                        });

                        locations.push({
                            ...business,
                            coordinates: result
                        });
                    } catch (error) {
                        console.log(`Could not geocode location: ${business.location}`, error);
                        // Skip businesses without valid locations
                    }
                    
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            setBusinessLocations(locations);
        };

        if (businesses.length > 0 && mapLoaded && window.google && window.google.maps) {
            geocodeLocations();
        }
    }, [businesses, mapLoaded]);

    // Calculate map center based on business locations
    const mapCenter = useMemo(() => {
        if (businessLocations.length === 0) return defaultCenter;

        const avgLat = businessLocations.reduce((sum, b) => sum + b.coordinates.lat, 0) / businessLocations.length;
        const avgLng = businessLocations.reduce((sum, b) => sum + b.coordinates.lng, 0) / businessLocations.length;

        return { lat: avgLat, lng: avgLng };
    }, [businessLocations, defaultCenter]);

    const mapContainerStyle = {
        width: '100%',
        height: height,
        borderRadius: '8px',
        overflow: 'hidden'
    };

    const mapOptions = {
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    };

    // Get Google Maps API key from environment variable
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

    if (!apiKey) {
        return (
            <div style={{
                width: '100%',
                height: height,
                borderRadius: '8px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '14px',
                padding: '20px',
                textAlign: 'center'
            }}>
                Google Maps API key not configured. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file.
            </div>
        );
    }

    return (
        <LoadScript
            googleMapsApiKey={apiKey}
            onLoad={() => setMapLoaded(true)}
        >
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={businessLocations.length > 0 ? 12 : 10}
                options={mapOptions}
            >
                {businessLocations.map((business, index) => {
                    if (!window.google || !business.coordinates) return null;
                    
                    return (
                        <Marker
                            key={business._id || index}
                            position={business.coordinates}
                            onClick={() => setSelectedBusiness(business)}
                            icon={{
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="16" cy="16" r="10" fill="#00c4cc" stroke="#fff" stroke-width="2"/>
                                        <circle cx="16" cy="16" r="4" fill="#fff"/>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(32, 32),
                                anchor: new window.google.maps.Point(16, 16)
                            }}
                        />
                    );
                })}

                {selectedBusiness && selectedBusiness.coordinates && (
                    <InfoWindow
                        position={selectedBusiness.coordinates}
                        onCloseClick={() => setSelectedBusiness(null)}
                    >
                        <div style={{ padding: '5px', maxWidth: '200px' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                {selectedBusiness.name}
                            </h4>
                            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>
                                {selectedBusiness.location}
                            </p>
                            {selectedBusiness.businessCategory && (
                                <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
                                    {selectedBusiness.businessCategory}
                                </p>
                            )}
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </LoadScript>
    );
};

export default BusinessMap;

