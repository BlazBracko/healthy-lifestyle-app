import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../userContext';
import axios from 'axios';
import './MyActivities.css'; // Importirajte CSS datoteko za slog

function MyActivities() {
    const { user } = useContext(UserContext);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/activities/user/${user.id}`)
                .then(response => {
                    setActivities(response.data);
                })
                .catch(error => {
                    setError('Failed to fetch activities');
                    console.error('Error fetching activities:', error);
                });
        }
    }, [user]);

    if (!user) return <p>Please login to view your activities.</p>;

    return (
        <div className="activities-container">
            <h1>Your Activities</h1>
            {activities.length > 0 ? (
                <ul className="activities-list">
                    {activities.map(activity => (
                        <li key={activity._id} className="activity-item">
                            <Link to={`/activity/${activity._id}`} className="activity-link">
                                {activity.type} on {new Date(activity.startTime).toLocaleDateString()}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : <p>{error || 'No activities found.'}</p>}
        </div>
    );
}

export default MyActivities;
