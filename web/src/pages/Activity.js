import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../userContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Activity.css'; // Uvozite novo CSS datoteko

function Activity() {
    const { user } = useContext(UserContext);
    const { activityId } = useParams();
    const [activity, setActivity] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && activityId) { // Preverite tudi activityId poleg user
            axios.get(`http://localhost:3001/activities/${activityId}`)
                .then(response => {
                    setActivity(response.data);
                })
                .catch(error => {
                    setError('Failed to fetch the latest activity');
                    console.error('Error fetching the latest activity:', error);
                });
        }
    }, [user, activityId]); // Dodajte activityId kot odvisnost za useEffect

    if (!user) return <p>Please login to see your activities.</p>;

    return (
        <div className="activity-container">
            <h1 className="activity-title">Latest Activity</h1>
            {activity ? (
                <div>
                    <p className="activity-info">Type: {activity.type}</p>
                    <p className="activity-info">Start Time: {new Date(activity.startTime).toLocaleString()}</p>
                    <p className="activity-info">End Time: {new Date(activity.endTime).toLocaleString()}</p>
                    <p className="activity-info">Distance: {activity.distance.toFixed(2)} km</p>
                    <p className="activity-info">Calories Burned: {activity.caloriesBurned}</p>
                    <p className="activity-info">Steps Count: {activity.stepCount}</p>
                    
                    {/* Map Container */}
                    {activity.locationData && activity.locationData.length > 0 ? (
                        <MapContainer center={[activity.locationData[0].latitude, activity.locationData[0].longitude]} zoom={13} className="map-container">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Polyline pathOptions={{ color: 'blue' }} positions={activity.locationData.map(loc => [loc.latitude, loc.longitude])} />
                        </MapContainer>
                    ) : (
                        <p className="error-message">No location data available.</p>
                    )}
                </div>
            ) : <p className="error-message">{error || 'No activities found.'}</p>}
        </div>
    );
}

export default Activity;
