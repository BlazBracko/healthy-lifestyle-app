import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../userContext';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ActivitiesList.css';
import './Home.css'; 

function Home() {
    const { user } = useContext(UserContext);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/activities`)
            .then(response => {
              // Preverimo, ali je response.data array
              if (!Array.isArray(response.data)) {
                console.error('Invalid response format:', response.data);
                setError('Invalid data format received');
                return;
              }
              
              // Filtriramo aktivnosti, da odstranimo aktivnosti trenutnega uporabnika
              // Dodamo preverjanje, da userID obstaja, preden dostopamo do _id
              const filteredActivities = response.data.filter(activity => 
                activity && 
                activity.userID && 
                activity.userID._id && 
                activity.userID._id !== user._id
              );

            // Nato razvrstimo filtrirane aktivnosti po datumu začetka od najnovejše do najstarejše
            const sortedActivities = filteredActivities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

            setActivities(sortedActivities);
            setError(''); // Počistimo napako, če je bilo vse v redu
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

    const calculateAltitudeChange = (altitudeChanges) => {
        if (!altitudeChanges || altitudeChanges.length < 2) return 0;

        let totalChange = 0;
        for (let i = 1; i < altitudeChanges.length; i++) {
            totalChange += Math.abs(altitudeChanges[i].altitude - altitudeChanges[i - 1].altitude);
        }
        return Math.round(totalChange);
    };

    const calculatePace = (distance, duration) => {
        if (distance === 0) return '0:00 min/km';
        const pace = duration / distance;
        const minutes = Math.floor(pace / 60000);
        const seconds = Math.floor((pace % 60000) / 1000);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
    };

    const calculateSpeed = (distance, duration) => {
        if (duration === 0) return 0;
        return (distance / (duration / 3600000)).toFixed(2); // vrne hitrost v km/h
    };

    if (!user) {
        return (
            <div className="landing-container">
                <section className="hero-section">
                    <div className="hero-content">
                        <div className="hero-icon">🏃</div>
                        <h1 className="hero-title">Track Your Healthy Lifestyle</h1>
                        <p className="hero-subtitle">
                            Monitor your activities, track your progress, and stay motivated on your journey to a healthier life.
                        </p>
                        <Link to="/login" className="cta-button">Get Started</Link>
                    </div>
                </section>

                <section className="features-section">
                    <div className="feature-card">
                        <span className="feature-icon">📍</span>
                        <h3 className="feature-title">GPS Tracking</h3>
                        <p className="feature-description">
                            Track your routes with real-time GPS location. See your path on interactive maps and analyze your movements.
                        </p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">📊</span>
                        <h3 className="feature-title">Activity Analytics</h3>
                        <p className="feature-description">
                            Monitor distance, pace, speed, altitude changes, and calories burned. Get detailed insights into your workouts.
                        </p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🏃‍♂️</span>
                        <h3 className="feature-title">Multiple Activities</h3>
                        <p className="feature-description">
                            Track running, walking, cycling, and hiking. Each activity type has specialized metrics tailored to your workout.
                        </p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">👥</span>
                        <h3 className="feature-title">Community</h3>
                        <p className="feature-description">
                            Discover activities from other users, get inspired, and share your achievements with the community.
                        </p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">📱</span>
                        <h3 className="feature-title">Mobile App</h3>
                        <p className="feature-description">
                            Track activities on the go with our mobile app. Start and stop activities anytime, anywhere.
                        </p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🌤️</span>
                        <h3 className="feature-title">Weather Integration</h3>
                        <p className="feature-description">
                            See weather conditions for your activities. Plan your workouts based on current weather data.
                        </p>
                    </div>
                </section>

                <section className="stats-section">
                    <h2 className="stats-title">Start Your Journey Today</h2>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-number">4</div>
                            <div className="stat-label">Activity Types</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">24/7</div>
                            <div className="stat-label">Tracking</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">100%</div>
                            <div className="stat-label">Free</div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="activities-container">
                <p>Other People's Activities</p>
                {activities.length > 0 ? (
                    <ul className="activities-list">
                        {activities.map(activity => (
                            <li key={activity._id} className="activity-item" data-type={activity.type?.toLowerCase()}>
                                <Link to={`/activity/${activity._id}`} className="activity-link">
                                <div className="user-name">{activity.userID.name} {activity.userID.surname}</div>
                                <div className="activity-header">
                                    <strong>{activity.type}</strong>
                                    <span className="activity-date">{new Date(activity.startTime).toLocaleDateString()}</span>
                                </div>
                                    <div className="activity-details">
                                        <div className="activity-detail">
                                            <small>Distance</small>
                                            <strong>{activity.distance?.toFixed(2) ?? 'N/A'} km</strong>
                                        </div>
                                        {activity.type.toLowerCase() === 'run' && (
                                            <div className="activity-detail">
                                                <small>Pace</small>
                                                <strong>{calculatePace(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))}</strong>
                                            </div>
                                        )}
                                        {activity.type.toLowerCase() === 'hike' && (
                                            <div className="activity-detail">
                                                <small>Altitude Change</small>
                                                <strong>{calculateAltitudeChange(activity.altitudeChanges)} m</strong>
                                            </div>
                                        )}
                                        {activity.type.toLowerCase() === 'cycle' && (
                                            <div className="activity-detail">
                                                <small>Speed</small>
                                                <strong>{calculateSpeed(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))} km/h</strong>
                                            </div>
                                        )}
                                        {activity.type.toLowerCase() === 'walk' && (
                                            <div className="activity-detail">
                                                <small>Steps</small>
                                                <strong>{activity.stepCount}</strong>
                                            </div>
                                        )}
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

export default Home;