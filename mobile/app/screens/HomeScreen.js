import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useColorScheme, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import axios from 'axios';
import { UserContext } from '../context/userContext';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';
import { Colors } from '@/constants/Colors';

const HomeScreen = () => {
    const { user } = useContext(UserContext);
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const fetchUsers = async () => {
      if (!user || !user._id) {
          setUsers([]);
          return;
      }
      try {
          const response = await axios.get(`${API_BASE_URL}/users/follow-status/${user._id}`);
          setUsers(response.data || []);
      } catch (error) {
          console.error('Error fetching users:', error);
          setError('Failed to fetch users');
          setUsers([]);
      }
    };

    const fetchActivities = async () => {
        if (user) {
            try {
                const response = await axios.get(`${API_BASE_URL}/activities/user/${user._id}`);
                const activitiesData = Array.isArray(response.data) ? response.data : [];
                const sortedActivities = activitiesData.sort((a, b) => {
                    const dateA = a.startTime ? new Date(a.startTime) : new Date(0);
                    const dateB = b.startTime ? new Date(b.startTime) : new Date(0);
                    return dateB - dateA;
                });
                setActivities(sortedActivities);
                setError('');
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    setActivities([]);
                    setError('');
                } else {
                    setError('Error fetching activities');
                    console.error('Error fetching activities:', error);
                    setActivities([]);
                }
            }
        }
    };

    useEffect(() => {
        if (user && user._id) {
            fetchUsers();
            fetchActivities();
        } else {
            setUsers([]);
            setActivities([]);
            setError('');
        }
    }, [user]);

    const calculateDuration = (startTime, endTime) => {
      if (!startTime || !endTime) return 'N/A';
      const start = new Date(startTime);
      const end = new Date(endTime);
      const duration = end - start;

      if (isNaN(duration) || duration < 0) return 'N/A';

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
        if (!distance || distance === 0 || !duration || duration === 0) return '0.00';
        return (distance / (duration / 3600000)).toFixed(2);
    };

    const calculatePace = (distance, duration) => {
        if (!distance || distance === 0 || !duration || duration === 0) return '0:00 min/km';
        const pace = duration / distance;
        const minutes = Math.floor(pace / 60000);
        const seconds = Math.floor((pace % 60000) / 1000);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
    };

    const handleFollowToggle = async (userId, isFollowed) => {
        if (!user || !user._id) {
            return;
        }
      try {
          const action = isFollowed ? 'unfollow' : 'follow';
          await axios.post(`${API_BASE_URL}/users/${action}`, { followerId: user._id, followingId: userId });
          fetchUsers();
      } catch (error) {
          console.error(`Error ${isFollowed ? 'unfollowing' : 'following'} user:`, error);
      }
    };

    const onRefresh = async () => {
        if (!user || !user._id) {
            setRefreshing(false);
            return;
        }
        setRefreshing(true);
        await fetchUsers();
        await fetchActivities();
        setRefreshing(false);
    };

    if (!user) return <Text style={[styles.errorText, { color: theme.error }]}>Please login to view your activities.</Text>;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView 
                contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
                showsVerticalScrollIndicator={false}
            >
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Users</Text>
                {users.length > 0 ? (
                    users.map(userItem => (
                        <View key={userItem._id} style={[styles.userCard, { backgroundColor: theme.cardBackground }]}>
                            <View style={styles.userInfo}>
                                <Text style={[styles.userEmoji]}>👤</Text>
                                <Text style={[styles.userName, { color: theme.text }]}>{userItem.username}</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => handleFollowToggle(userItem._id, userItem.isFollowed)}
                                style={[
                                    styles.followButton, 
                                    { backgroundColor: userItem.isFollowed ? theme.error : theme.gradientStart }
                                ]}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.buttonText}>
                                    {userItem.isFollowed ? 'Unfollow' : 'Follow'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No users found</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Activities</Text>
                {activities.length > 0 ? (
                    activities.map(activity => (
                        <View key={activity._id} style={[styles.activityCard, { backgroundColor: theme.cardBackground }]}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ShowActivity', { activityId: activity._id })}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.activityHeader, { borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                                    <View style={styles.activityTypeContainer}>
                                        <View style={[styles.activityTypeDot, { backgroundColor: getActivityColor(activity.type) }]} />
                                        <Text style={[styles.activityType, { color: theme.text }]}>{activity.type}</Text>
                                    </View>
                                    <Text style={[styles.activityDate, { color: theme.secondaryText }]}>
                                        {new Date(activity.startTime).toLocaleDateString()}
                                    </Text>
                                </View>
                                
                                <View style={styles.activityDetails}>
                                    <View style={[styles.activityDetail, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Distance</Text>
                                        <Text style={[styles.detailValue, { color: theme.text }]}>
                                            {activity.distance ? activity.distance.toFixed(2) : 'N/A'} km
                                        </Text>
                                    </View>
                                    
                                    {activity.type.toLowerCase() === 'run' && activity.distance && activity.endTime && activity.startTime && (
                                        <View style={[styles.activityDetail, { backgroundColor: theme.background }]}>
                                            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Pace</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                                {calculatePace(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))}
                                            </Text>
                                        </View>
                                    )}
                                    
                                    {activity.type.toLowerCase() === 'hike' && (
                                        <View style={[styles.activityDetail, { backgroundColor: theme.background }]}>
                                            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Altitude</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                                {calculateAltitudeChange(activity.altitudeChanges)} m
                                            </Text>
                                        </View>
                                    )}
                                    
                                    {activity.type.toLowerCase() === 'cycle' && activity.distance && activity.endTime && activity.startTime && (
                                        <View style={[styles.activityDetail, { backgroundColor: theme.background }]}>
                                            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Speed</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                                {calculateSpeed(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))} km/h
                                            </Text>
                                        </View>
                                    )}
                                    
                                    {activity.type.toLowerCase() === 'walk' && (
                                        <View style={[styles.activityDetail, { backgroundColor: theme.background }]}>
                                            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Steps</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                                {activity.stepCount || 0}
                                            </Text>
                                        </View>
                                    )}
                                    
                                    <View style={[styles.activityDetail, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Time</Text>
                                        <Text style={[styles.detailValue, { color: theme.text }]}>
                                            {calculateDuration(activity.startTime, activity.endTime)}
                                        </Text>
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
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    <Polyline
                                        coordinates={activity.locationData.map(loc => ({
                                            latitude: loc.latitude,
                                            longitude: loc.longitude
                                        }))}
                                        strokeColor={theme.gradientStart}
                                        strokeWidth={4}
                                    />
                                </MapView>
                            )}
                        </View>
                    ))
                ) : (
                    <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{error || 'No activities found.'}</Text>
                )}
            </View>
        </ScrollView>
        </SafeAreaView>
    );
};

const getActivityColor = (type) => {
    const colors = {
        'run': '#ef4444',
        'walk': '#10b981',
        'cycle': '#3b82f6',
        'hike': '#f59e0b',
    };
    return colors[type?.toLowerCase()] || '#667eea';
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 10,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    userEmoji: {
        fontSize: 24,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
    },
    followButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    activityCard: {
        borderRadius: 20,
        marginBottom: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    activityTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    activityTypeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    activityType: {
        fontSize: 20,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    activityDate: {
        fontSize: 14,
        fontWeight: '500',
    },
    activityDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    activityDetail: {
        flex: 1,
        minWidth: '30%',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    map: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginTop: 8,
        overflow: 'hidden',
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default HomeScreen;
