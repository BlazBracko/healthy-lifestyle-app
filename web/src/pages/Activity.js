import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../userContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Activity.css';

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

    const calculateDuration = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = end - start;

        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);

        return `${hours > 0 ? hours + 'h ' : ''}${minutes}min ${seconds}s`;
    };

    const calculateAltitudeChange = (altitudeChanges) => {
        if (!altitudeChanges || altitudeChanges.length < 2) return 0;

        let totalChange = 0;
        for (let i = 1; i < altitudeChanges.length; i++) {
            totalChange += Math.abs(altitudeChanges[i].altitude - altitudeChanges[i - 1].altitude);
        }
        return Math.round(totalChange);
    };

    const calculateSpeed = (distance, duration) => {
        if (duration === 0) return 0;
        return (distance / (duration / 3600000)).toFixed(2); // vrne hitrost v km/h
    };

    const calculatePace = (distance, duration) => {
        if (distance === 0) return '0:00 min/km';
        const pace = duration / distance;
        const minutes = Math.floor(pace / 60000);
        const seconds = Math.floor((pace % 60000) / 1000);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
    };
    

    if (!user) return <p>Please login to see your activities.</p>;

    return (
        <div className="activity-container">
            {activity ? (
                <div>
                    <div className="activity-header">
                        <strong>{activity.type}</strong>
                        <span className="activity-date">{new Date(activity.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="activity-info-container">
                        <div className="activity-info-column">
                            <div className="activity-info">
                                <small>Duration</small>
                                <strong>{calculateDuration(activity.startTime, activity.endTime)}</strong>
                            </div>
                            <div className="activity-info">
                                <small>Distance</small>
                                <strong>{activity.distance.toFixed(2)} km</strong>
                            </div>
                        </div>
                        <div className="activity-info-column">
                            <div className="activity-info">
                                <small>Calories Burned</small>
                                <strong>{activity.caloriesBurned}</strong>
                            </div>
                            <div className="activity-info">
                                <small>Altitude change</small>
                                <strong>{calculateAltitudeChange(activity.altitudeChanges)} m</strong>
                            </div>
                        </div>
                        <div className="activity-info-column">
                        {activity.type !== 'Cycle' && (
                            <div className="activity-info">
                                <small>Steps Count</small>
                                <strong>{activity.stepCount}</strong>
                            </div>
                        )}
                        {activity.type === 'Cycle' && (
                            <div className="activity-info">
                                <small>Average speed</small>
                                <strong>{calculateSpeed(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))} km/h</strong>
                            </div>
                        )}
                        {activity.type === 'Run' && (
                            <div className="activity-info">
                                <small>Average pace</small>
                                <strong>{calculatePace(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))} </strong>
                            </div>
                        )}
                        </div>
                    </div>

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