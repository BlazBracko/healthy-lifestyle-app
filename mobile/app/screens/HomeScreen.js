import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import axios from 'axios';
import { UserContext } from '../context/userContext'; 
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
    const { user } = useContext(UserContext);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchActivities = async () => {
        if (user) {
            try {
                const response = await axios.get(`http://172.20.10.5:3001/activities/user/${user.id}`);
                setActivities(response.data);
            } catch (error) {
                setError('Failed to fetch activities');
                console.error('Error fetching activities:', error);
            }
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchActivities();
        setRefreshing(false);
    };

    const calculateDuration = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = end - start;

        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);

        return `${hours > 0 ? hours + 'h ' : ''}${minutes}min ${seconds}s`;
    };

    if (!user) return <Text style={styles.errorText}>Please login to view your activities.</Text>;

    return (
        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
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
                                <View style={styles.activityDetail}>
                                    <Text style={styles.detailLabel}>Steps</Text>
                                    <Text style={styles.detailValue}>{activity.stepCount}</Text>
                                </View>
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
                                    strokeColor="#000" 
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
        marginBottom: 10,
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
    map: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
});

export default HomeScreen;
