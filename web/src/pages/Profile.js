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

            const dailySteps = dailyActivities.reduce((total, activity) => total + (activity.stepCount || 0), 0);
            const dailyDistance = dailyActivities.reduce((total, activity) => total + (activity.distance || 0), 0);
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
            distanceData.push(dailyDistance ? dailyDistance.toFixed(2) : 0);
            altitudeData.push(dailyAltitudeChange);
        }

        return {
            steps: {
                labels,
                datasets: [
                    {
                        label: 'Steps',
                        data: stepsData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderRadius: 8,
                        borderSkipped: false,
                    }
                ]
            },
            distance: {
                labels,
                datasets: [
                    {
                        label: 'Distance',
                        data: distanceData,
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#764ba2',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    }
                ]
            },
            altitude: {
                labels,
                datasets: [
                    {
                        label: 'Altitude change',
                        data: altitudeData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        fill: true,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
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
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Steps in Last 7 Days',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#1a202c',
                    padding: {
                        bottom: 20
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Steps',
                        color: '#718096',
                        font: {
                            size: 14,
                            weight: '500'
                        }
                    }
                }
            }
        },
        distance: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Distance in Last 7 Days',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#1a202c',
                    padding: {
                        bottom: 20
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distance (km)',
                        color: '#718096',
                        font: {
                            size: 14,
                            weight: '500'
                        }
                    }
                }
            }
        },
        altitude: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Altitude Change in Last 7 Days',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#1a202c',
                    padding: {
                        bottom: 20
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Altitude Change (m)',
                        color: '#718096',
                        font: {
                            size: 14,
                            weight: '500'
                        }
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
                    <div className="profile-info-item">
                        <p>Age</p>
                        <strong>{profile.age || 'N/A'}</strong>
                    </div>
                    <div className="profile-info-item">
                        <p>Height</p>
                        <strong>{profile.height ? `${profile.height} cm` : 'N/A'}</strong>
                    </div>
                    <div className="profile-info-item">
                        <p>Weight</p>
                        <strong>{profile.weight ? `${profile.weight} kg` : 'N/A'}</strong>
                    </div>
                    {profile.gender && (
                        <div className="profile-info-item">
                            <p>Gender</p>
                            <strong>{profile.gender}</strong>
                        </div>
                    )}
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
