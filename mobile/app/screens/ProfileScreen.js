import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import { UserContext } from '../context/userContext';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const screenWidth = Dimensions.get('window').width;

const ProfileScreen = () => {
    const { user, logout } = useContext(UserContext);
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
    const navigation = useNavigation();

    useEffect(() => {
        refreshProfile();
    }, [user]);

    const refreshProfile = () => {
        if (user) {
            console.log(user._id);
            axios.get(`https://mallard-set-akita.ngrok-free.app/users/${user._id}`)
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
    };

    useEffect(() => {
        if (user) {
            axios.get(`https://mallard-set-akita.ngrok-free.app/activities/user/${user._id}`)
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
        weekAgo.setDate(today.getDate() - 6);

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

            stepsData.push(isNaN(dailySteps) ? 0 : dailySteps);
            distanceData.push(isNaN(dailyDistance) ? 0 : parseFloat(dailyDistance.toFixed(2)));
            altitudeData.push(isNaN(dailyAltitudeChange) ? 0 : dailyAltitudeChange);
        }

        return {
            steps: {
                labels,
                datasets: [
                    {
                        label: 'Steps',
                        data: stepsData,
                        color: (opacity = 1) => `rgba(45, 83, 189, ${opacity})`, // optional
                        strokeWidth: 2 // optional
                    }
                ]
            },
            distance: {
                labels,
                datasets: [
                    {
                        label: 'Distance',
                        data: distanceData,
                        color: (opacity = 1) => `rgba(252, 3, 161, ${opacity})`, // optional
                        strokeWidth: 2 // optional
                    }
                ]
            },
            altitude: {
                labels,
                datasets: [
                    {
                        label: 'Altitude change',
                        data: altitudeData,
                        color: (opacity = 1) => `rgba(250, 140, 50, ${opacity})`, // optional
                        strokeWidth: 2 // optional
                    }
                ]
            }
        };
    };

    const activityData = getActivityDataForLastWeek();

    if (!user) return <Text style={styles.loginMessage}>Please login to view this page.</Text>;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { onGoBack: () => refreshProfile() })} style={styles.editButton}>
                    <Icon name="edit" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.profileContainer}>
                <View style={styles.profileName}>
                    <Text style={styles.profileNameText}>{`${profile.name} ${profile.surname}`}</Text>
                    <Text style={styles.profileUsername}>{profile.username}</Text>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.infoText}>Age: <Text style={styles.infoValue}>{profile.age}</Text></Text>
                    <Text style={styles.infoText}>Height: <Text style={styles.infoValue}>{profile.height} cm</Text></Text>
                    <Text style={styles.infoText}>Weight: <Text style={styles.infoValue}>{profile.weight} kg</Text></Text>
                </View>
            </View>
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Steps in Last 7 Days</Text>
                <BarChart
                    data={activityData.steps}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(45, 83, 189, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                            borderRadius: 16
                        },
                        propsForDots: {
                            r: '6',
                            strokeWidth: '2',
                            stroke: '#2d53bd'
                        }
                    }}
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
                <Text style={styles.chartTitle}>Distance in Last 7 Days</Text>
                <LineChart
                    data={activityData.distance}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 2,
                        color: (opacity = 1) => `rgba(252, 3, 161, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                            borderRadius: 16
                        },
                        propsForDots: {
                            r: '6',
                            strokeWidth: '2',
                            stroke: '#fc03a1'
                        }
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
                <Text style={styles.chartTitle}>Altitude Change in Last 7 Days</Text>
                <LineChart
                    data={activityData.altitude}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 2,
                        color: (opacity = 1) => `rgba(250, 140, 50, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                            borderRadius: 16
                        },
                        propsForDots: {
                            r: '6',
                            strokeWidth: '2',
                            stroke: '#fa8c32'
                        }
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            </View>
            {errors && <Text style={styles.errorText}>{errors}</Text>}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    profileContainer: {
        marginBottom: 20,
    },
    profileName: {
        marginTop: 30,
        marginLeft: 8,
    },
    profileNameText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileUsername: {
        fontSize: 18,
        color: '#666',
    },
    profileInfo: {
        marginTop: 20,
        marginLeft: 8,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 5,
    },
    infoValue: {
        fontWeight: 'bold',
    },
    chartContainer: {
        marginTop: 20,
    },
    chartTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        marginTop: 20,
        textAlign: 'center',
    },
    loginMessage: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: 'gray',
    },
    logoutButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
});

export default ProfileScreen;
