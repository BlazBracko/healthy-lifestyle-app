import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from "../userContext";
import './Profile.css'; 
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

function Profile() {
    const { user } = useContext(UserContext);
    const [profile, setProfile] = useState({
        name: '',
        surname: '',
        username: '',
        email: '',
        age: '',
        height: '',
        weight: '',
        gender: ''
    });
    const [activities, setActivities] = useState([]);
    const [errors, setErrors] = useState('');
    const navigate = useNavigate(); // Uporabimo useNavigate

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/users/${user.id}`)
                .then(response => {
                    const fetchedProfile = response.data;
                    setProfile({
                        name: fetchedProfile.name || '',
                        surname: fetchedProfile.surname || '',
                        username: fetchedProfile.username || '',
                        email: fetchedProfile.email || '',
                        age: fetchedProfile.age || '',
                        height: fetchedProfile.height || '',
                        weight: fetchedProfile.weight || '',
                        gender: fetchedProfile.gender || ''
                    });
                })
                .catch(error => setErrors('Failed to fetch profile'));
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/activities/user/${user.id}`)
                .then(response => {
                    setActivities(response.data);
                })
                .catch(error => {
                    setErrors('Failed to fetch activities');
                    console.error('Error fetching activities:', error);
                });
        }
    }, [user]);

    const getActivityDataForLastWeek = () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);

        // Filtriramo aktivnosti, ki so se zgodile v zadnjem tednu.
        const filteredActivities = activities.filter(activity => {
            const activityDate = new Date(activity.startTime);
            return activityDate >= weekAgo && activityDate <= today;
        });

        const stepsData = [];
        const distanceData = [];
        const altitudeData = [];
        const labels = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekAgo);
            date.setDate(weekAgo.getDate() + i);
            labels.push(date.toLocaleDateString());

            const dailyActivities = filteredActivities.filter(activity => {
                const activityDate = new Date(activity.startTime);
                return activityDate.toLocaleDateString() === date.toLocaleDateString();
            });

            const dailySteps = dailyActivities.reduce((total, activity) => total + activity.stepCount, 0);
            const dailyDistance = dailyActivities.reduce((total, activity) => total + activity.distance, 0);
            // Calculate daily altitude change
            const dailyAltitudeChange = dailyActivities.reduce((total, activity) => {
                let altitudeChange = 0;
                const altitudeChanges = activity.altitudeChanges;
                if (altitudeChanges && altitudeChanges.length > 1) {
                    for (let j = 1; j < altitudeChanges.length; j++) {
                        altitudeChange += Math.abs(altitudeChanges[j].altitude - altitudeChanges[j - 1].altitude);
                    }
                }
                return total + altitudeChange;
            }, 0);

            stepsData.push(dailySteps);
            distanceData.push(dailyDistance.toFixed(2));
            altitudeData.push(dailyAltitudeChange);
        }

        return {
            steps: {
                labels,
                datasets: [
                    {
                        label: 'Steps in Last 7 Days',
                        data: stepsData,
                        borderColor: '#2d53bd',
                        backgroundColor: '#2d53bd',
                    }
                ]
            },
            distance: {
                labels,
                datasets: [
                    {
                        label: 'Distance in Last 7 Days (km)',
                        data: distanceData,
                        borderColor: '#ff6347',
                        backgroundColor: '#ff6347',
                    }
                ]
            },
            altitude: {
                labels,
                datasets: [
                    {
                        label: 'Altitude change in Last 7 Days (m)',
                        data: altitudeData,
                        borderColor: '#32a852',
                        backgroundColor: '#32a852',
                    }
                ]
            }
        };
    };

    const activityData = getActivityDataForLastWeek();

    if (!user) return <p>Please login to view this page.</p>;

    return (
        <div className="profile-container">
            <button className="edit-profile-button" onClick={() => navigate('/editprofile')}>
            <FontAwesomeIcon icon={faEdit} size="lg" />
            </button>
            <div className="profile-details">
                <div className="profile-name">
                    <h2>{`${profile.name} ${profile.surname}`}</h2>
                    <p>{profile.username}</p>
                </div>
                <div className="profile-info">
                    <p>Age: <strong>{profile.age}</strong></p>
                    <p>Height: <strong>{profile.height} cm</strong></p>
                    <p>Weight: <strong>{profile.weight} kg</strong></p>
                </div>
            </div>
            <div className="activity-chart-container">
                <h2>Activity in Last 7 Days</h2>
                {/*Line komponenta iz react-chartjs-2 sprejme podatke preko data propa. Ti podatki so vrnjeni iz funkcije getActivityDataForLastWeek*/}
                <Line data={activityData.distance} />
                <Line data={activityData.steps} />
                <Line data={activityData.altitude} />
            </div>
            {errors && <p className="error-message">{errors}</p>}
        </div>
    );
}

export default Profile;
