import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import axios from 'axios';
import { UserContext } from '../context/userContext'; 
import { useRoute } from '@react-navigation/native';

const ShowActivityScreen = () => {
    const { user } = useContext(UserContext);
    const route = useRoute();
    const { activityId } = route.params;
    const [activity, setActivity] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && activityId) {
            axios.get(`https://mallard-set-akita.ngrok-free.app/activities/${activityId}`)
                .then(response => {
                    console.log('Activity data:', response.data); 
                    setActivity(response.data);
                })
                .catch(error => {
                    setError('Failed to fetch the activity');
                    console.error('Error fetching the activity:', error);
                });
        }
    }, [user, activityId]);

    const calculateDuration = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = end - start;

        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);

        return `${hours > 0 ? hours + 'h ' : ''}${minutes}min ${seconds}s`;
    };


    if (!user) return <Text style={styles.errorText}>Please login to see your activities.</Text>;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Activity Details</Text>
            {activity ? (
                <View style={styles.detailsContainer}>
                    <View style={styles.infoContainer}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Type</Text>
                            <Text style={styles.infoValue}>{activity.type}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Duration</Text>
                            <Text style={styles.infoValue}>{calculateDuration(activity.startTime, activity.endTime)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Distance</Text>
                            <Text style={styles.infoValue}>{activity.distance ? activity.distance.toFixed(3) : 'N/A'} km</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Calories Burned</Text>
                            <Text style={styles.infoValue}>{activity.caloriesBurned}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Steps Count</Text>
                            <Text style={styles.infoValue}>{activity.stepCount}</Text>
                        </View>
                    </View>

                    {/* Map Container */}
                    {activity.locationData && activity.locationData.length > 0 ? (
                         <MapView
                            key={activityId}
                            style={styles.map}
                            initialRegion={{
                                latitude: activity.locationData[0].latitude,
                                longitude: activity.locationData[0].longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                        >
                            <Polyline
                                coordinates={activity.locationData.map(loc => ({
                                    latitude: loc.latitude,
                                    longitude: loc.longitude
                                }))}
                                strokeColor="#4A90E2" 
                                strokeWidth={4}
                            />
                        </MapView>
                    ) : (
                        <Text style={styles.noDataText}>No location data available.</Text>
                    )}
                </View>
            ) : <Text style={styles.errorText}>{error || 'No activities found.'}</Text>}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    detailsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    infoContainer: {
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    infoLabel: {
        fontSize: 16,
        color: '#666',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    map: {
        width: '100%',
        height: 400,
        borderRadius: 10,
        marginTop: 20,
    },
});

export default ShowActivityScreen;
