import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../userContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
        <div>
            <h1>Latest Activity</h1>
            {activity ? (
                <div>
                    <p>Type: {activity.type}</p>
                    <p>Start Time: {new Date(activity.startTime).toLocaleString()}</p>
                    <p>End Time: {new Date(activity.endTime).toLocaleString()}</p>
                    <p>Distance: {activity.distance} km</p>
                    <p>Calories Burned: {activity.caloriesBurned}</p>
                    <p>Steps Count: {activity.stepCount}</p>
                    
                    {/* Map Container */}
                    <MapContainer center={[activity.locationData[0].latitude, activity.locationData[0].longitude]} zoom={13} style={{ height: 400, width: "100%" }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Polyline pathOptions={{ color: 'blue' }} positions={activity.locationData.map(loc => [loc.latitude, loc.longitude])} />
                    </MapContainer>
                </div>
            ) : <p>{error || 'No activities found.'}</p>}
        </div>
    );
}

export default Activity;
