import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import axios from 'axios';
import { UserContext } from '../context/userContext';
import { useNavigation } from '@react-navigation/native';
import { subscribeToTopic, unsubscribeFromTopic, publishMessage } from '../../services/mqttService';

const HomeScreen = () => {
    const { user } = useContext(UserContext);
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    /*
    // Example of how to publish status updates
    useEffect(() => {
      console.log(user); // Check if user details are loaded
      if (user && user.id) {
        const statusTopic = `users/${user.id}/status`;
        const activeStatusMessage = 'User is online';
        publishMessage(statusTopic, activeStatusMessage);
      }
    }, [user]);
    */  
    const fetchUsers = async () => {
      try {
          const response = await axios.get(`http://192.168.1.220:3001/users/follow-status/${user._id}`);
          setUsers(response.data);
      } catch (error) {
          console.error('Error fetching users:', error);
          setError('Failed to fetch users');
      }
    };

    const fetchActivities = async () => {
        if (user) {
            try {
                const response = await axios.get(`http://192.168.1.220:3001/activities/user/${user._id}`);
                const sortedActivities = response.data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
                setActivities(sortedActivities);
                setError('');
            } catch (error) {
                setError('Error fetching activities');
                console.error('Error fetching activities:', error);
            }
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchActivities();
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

    const handleFollowToggle = async (userId, isFollowed) => {
      try {
          const action = isFollowed ? 'unfollow' : 'follow';
          await axios.post(`http://192.168.1.220:3001/users/${action}`, { followerId: user._id, followingId: userId });
          /*if (!isFollowed) {
            const topic = `users/${userId}/status`;
            subscribeToTopic(topic);
            console.log(`Now following ${userId}'s status.`);
          } else {
            const topic = `users/${userId}/status`;
            unsubscribeFromTopic(topic);
            console.log(`Unfollowed ${userId}.`);
          }*/
          alert(`You are now ${isFollowed ? 'unfollowing' : 'following'} user ${userId}`);
          // Update list to show current follow status
          fetchUsers();
      } catch (error) {
          console.error(`Error ${isFollowed ? 'unfollowing' : 'following'} user:`, error);
      }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
        await fetchActivities();
        setRefreshing(false);
    };

    if (!user) return <Text style={styles.errorText}>Please login to view your activities.</Text>;

    return (
        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.title}>Users</Text>
            {users.map(userItem => (
                <Animated.View key={userItem._id} style={styles.userItem}>
                    <Text style={styles.userName}>{userItem.username}</Text>
                    <TouchableOpacity 
                        onPress={() => handleFollowToggle(userItem._id, userItem.isFollowed)}
                        style={userItem.isFollowed ? styles.unfollowButton : styles.followButton}
                    >
                        <Text style={styles.buttonText}>{userItem.isFollowed ? 'Unfollow' : 'Follow'}</Text>
                    </TouchableOpacity>
                </Animated.View>
            ))}
            <Text style={styles.title}>Your Activities</Text>
            {activities.length > 0 ? (
                activities.map(activity => (
                    <View key={activity._id} style={styles.activityItem}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ShowActivity', { activityId: activity._id })}
                            style={styles.activityLink}
                        >
                            <View style={styles.activityHeader}>
                                <Text style={styles.activityType}>{activity.type}</Text>
                                <Text style={styles.activityDate}>{new Date(activity.startTime).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.activityDetails}>
                                <View style={styles.activityDetail}>
                                    <Text style={styles.detailLabel}>Distance</Text>
                                    <Text style={styles.detailValue}>
                                        {activity.distance !== undefined ? activity.distance.toFixed(3) : 'N/A'} km
                                    </Text>
                                </View>
                                {activity.type.toLowerCase() === 'run' && (
                                <View style={styles.activityDetail}>
                                    <Text style={styles.detailLabel}>Pace</Text>
                                    <Text style={styles.detailValue}>
                                        {calculatePace(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))}
                                    </Text>
                                </View>
                            )}
                            {activity.type.toLowerCase() === 'hike' && (
                                <View style={styles.activityDetail}>
                                    <Text style={styles.detailLabel}>Altitude Change</Text>
                                    <Text style={styles.detailValue}>
                                        {calculateAltitudeChange(activity.altitudeChanges)} m
                                    </Text>
                                </View>
                            )}
                            {activity.type.toLowerCase() === 'cycle' && (
                                <View style={styles.activityDetail}>
                                    <Text style={styles.detailLabel}>Speed</Text>
                                    <Text style={styles.detailValue}>
                                        {calculateSpeed(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))} km/h
                                    </Text>
                                </View>
                            )}
                            {activity.type.toLowerCase() === 'walk' && (
                                <View style={styles.activityDetail}>
                                    <Text style={styles.detailLabel}>Steps</Text>
                                    <Text style={styles.detailValue}>{activity.stepCount}</Text>
                                </View>
                            )}
                                <View style={styles.activityDetail}>
                                    <Text style={styles.detailLabel}>Time</Text>
                                    <Text style={styles.detailValue}>{calculateDuration(activity.startTime, activity.endTime)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                        {activity.locationData && activity.locationData.length > 0 && (
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: activity.locationData[0].latitude,
                                    longitude: activity.locationData[0].longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                scrollEnabled={false} // Disable map scrolling
                                zoomEnabled={false} // Disable map zooming
                            >
                                <Polyline
                                    coordinates={activity.locationData.map(loc => ({
                                        latitude: loc.latitude,
                                        longitude: loc.longitude
                                    }))}
                                    strokeColor="#337aff" 
                                    strokeWidth={3}
                                />
                            </MapView>
                        )}
                    </View>
                ))
            ) : (
                <Text style={styles.errorText}>{error || 'No activities found.'}</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    activityItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 20,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    activityLink: {
        paddingBottom: 10,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    activityType: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    activityDate: {
        fontSize: 16,
        color: '#666',
    },
    activityDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    activityDetail: {
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    followButton: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      backgroundColor: '#0a84ff',
      borderRadius: 20,
    },
    unfollowButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: '#ff3b30',
        borderRadius: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    userItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: '#fff',
      borderRadius: 10,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    userName: {
      fontSize: 18,
      color: '#333',
    },
    map: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
});

export default HomeScreen;
