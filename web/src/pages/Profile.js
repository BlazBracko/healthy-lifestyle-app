import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from "../userContext";
import './Profile.css'; 
import { Line, Bar } from 'react-chartjs-2';
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
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/users/${user._id}`)
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
            axios.get(`http://localhost:3001/activities/user/${user._id}`)
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
            labels.push(date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }));

            const dailyActivities = filteredActivities.filter(activity => {
                const activityDate = new Date(activity.startTime);
                return activityDate.toLocaleDateString() === date.toLocaleDateString();
            });

            const dailySteps = dailyActivities.reduce((total, activity) => total + activity.stepCount, 0);
            const dailyDistance = dailyActivities.reduce((total, activity) => total + activity.distance, 0);
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
                        label: 'Steps',
                        data: stepsData,
                        borderColor: '#2d53bd',
                        backgroundColor: 'rgba(45, 83, 189)',
                        type: 'bar'
                    }
                ]
            },
            distance: {
                labels,
                datasets: [
                    {
                        label: 'Distance',
                        data: distanceData,
                        borderColor: 'rgba(252, 3, 161)',
                        backgroundColor: 'rgba(252, 3, 161)',
                        fill: false,
                        tension: 0.4,
                    }
                ]
            },
            altitude: {
                labels,
                datasets: [
                    {
                        label: 'Altitude change',
                        data: altitudeData,
                        borderColor: 'rgba(250, 140, 50)',
                        backgroundColor: 'rgba(250, 140, 50, 0.2)',  // More transparent
                        fill: true,
                        pointBackgroundColor: 'rgba(250, 140, 50)',
                        pointBorderColor: 'rgba(250, 140, 50)',
                        pointRadius: 5,
                        tension: 0.4,
                    }
                ]
            }
        };
    };

    const activityData = getActivityDataForLastWeek();

    const options = {
        steps: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Steps in Last 7 Days',
                    font: {
                        size: 18
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(value, index, values) {
                            return new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Steps'
                    }
                }
            }
        },
        distance: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distance in Last 7 Days',
                    font: {
                        size: 18
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(value, index, values) {
                            return new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Distance (km)'
                    }
                }
            }
        },
        altitude: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Altitude Change in Last 7 Days',
                    font: {
                        size: 18
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(value, index, values) {
                            return new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Altitude Change (m)'
                    }
                }
            }
        }
    };

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
                <Bar data={activityData.steps} options={options.steps} />
                <Line data={activityData.distance} options={options.distance} />
                <Line data={activityData.altitude} options={options.altitude} />
            </div>
            {errors && <p className="error-message">{errors}</p>}
        </div>
    );
}

export default Profile;
