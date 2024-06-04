import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../userContext';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ActivitiesList.css'; // Importirajte CSS datoteko za slog

function MyActivities() {
    const { user } = useContext(UserContext);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/activities/user/${user.id}`)
                .then(response => {
                    //od najnovejše do najstarejše
                    const sortedActivities = response.data.sort((a, b) => {
                        return new Date(b.startTime) - new Date(a.startTime);
                    });
                    setActivities(sortedActivities);
                })
                .catch(error => {
                    setError('Failed to fetch activities');
                    console.error('Error fetching activities:', error);
                });
        }
    }, [user]);

    const calculateDuration = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = end - start;

        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);

        return `${hours > 0 ? hours + 'h ' : ''}${minutes}min ${seconds}s`;
    };

    if (!user) return <p>Please login to view your activities.</p>;

    return (
        <div className="main-container">
            <div className="activities-container">
                <p>Your Activities</p>
                {activities.length > 0 ? (
                    <ul className="activities-list">
                        {activities.map(activity => (
                            <li key={activity._id} className="activity-item">
                                <Link to={`/activity/${activity._id}`} className="activity-link">
                                <div className="activity-header">
                                    <strong>{activity.type}</strong>
                                    <span className="activity-date">{new Date(activity.startTime).toLocaleDateString()}</span>
                                </div>
                                    <div className="activity-details">
                                        <div className="activity-detail">
                                            <small>Distance</small>
                                            <strong>{activity.distance ? activity.distance.toFixed(2) : 0} km</strong>
                                        </div>
                                        <div className="activity-detail">
                                            <small>Steps</small>
                                            <strong>{activity.stepCount}</strong>
                                        </div>
                                        <div className="activity-detail">
                                            <small>Time</small>
                                            <strong>{calculateDuration(activity.startTime, activity.endTime)}</strong>
                                        </div>
                                    </div>
                                </Link>
                                {/* Map Container */}
                                {activity.locationData && activity.locationData.length > 0 && (
                                    <MapContainer 
                                        center={[activity.locationData[0].latitude, activity.locationData[0].longitude]} 
                                        zoom={13} 
                                        className="map-container"
                                        scrollWheelZoom={false} // Onemogočite zoomiranje z miško
                                        doubleClickZoom={false} // Onemogočite zoomiranje z dvojnim klikom
                                        dragging={false} // Onemogočite premikanje zemljevida
                                        zoomControl={false} // Skrijte kontrolnik za zoomiranje
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Polyline pathOptions={{ color: 'blue' }} positions={activity.locationData.map(loc => [loc.latitude, loc.longitude])} />
                                    </MapContainer>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : <p>{error || 'No activities found.'}</p>}
            </div>
        </div>
    );
}

export default MyActivities;