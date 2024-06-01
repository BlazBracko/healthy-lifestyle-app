import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import axios from 'axios';
import { UserContext } from '../context/userContext'; 
import { useRoute } from '@react-navigation/native';

const ActivityScreen = () => {
    const { user } = useContext(UserContext);
    const route = useRoute();
    const { activityId } = route.params;
    const [activity, setActivity] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && activityId) {
            axios.get(`http://192.168.1.100:3001/activities/${activityId}`)
                .then(response => {
                    console.log('Activity data:', response.data); 
                    setActivity(response.data);
                })
                .catch(error => {
                    setError('Failed to fetch the latest activity');
                    console.error('Error fetching the latest activity:', error);
                });
        }
    }, [user, activityId]);

    if (!user) return <Text>Please login to see your activities.</Text>;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Latest Activity</Text>
            {activity ? (
                <View>
                    <Text style={styles.info}>Type: {activity.type}</Text>
                    <Text style={styles.info}>Start Time: {new Date(activity.startTime).toLocaleString()}</Text>
                    <Text style={styles.info}>End Time: {new Date(activity.endTime).toLocaleString()}</Text>
                    <Text style={styles.info}>Distance: {activity.distance} m</Text>
                    <Text style={styles.info}>Calories Burned: {activity.caloriesBurned}</Text>
                    <Text style={styles.info}>Steps Count: {activity.stepCount}</Text>

                    {/* Map Container */}
                    {activity.locationData && activity.locationData.length > 0 ? (
                        <MapView // zemljevida ne prikaže
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
                                strokeColor="#000" 
                                strokeWidth={3}
                            />
                            {activity.locationData.map((loc, index) => (
                                <Marker
                                    key={index}
                                    coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                                    title={`Point ${index + 1}`}
                                />
                            ))}
                        </MapView>
                    ) : (
                        <Text>No location data available.</Text>
                    )}
                </View>
            ) : <Text>{error || 'No activities found.'}</Text>}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
        color: 'black',
    },
    info: {
        fontSize: 16,
        marginBottom: 10,
        color: 'black',
    },
    map: {
        width: '100%',
        height: 400,
        marginTop: 20,
    },
});

export default ActivityScreen;
