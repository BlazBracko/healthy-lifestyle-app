import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker } from 'react-native-maps';
import axios from 'axios';
import { UserContext } from '../context/userContext'; 
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';
import { Colors } from '@/constants/Colors';

const ShowActivityScreen = () => {
    const { user } = useContext(UserContext);
    const route = useRoute();
    const { activityId } = route.params;
    const [activity, setActivity] = useState(null);
    const [error, setError] = useState('');
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        if (user && activityId) {
            axios.get(`${API_BASE_URL}/activities/${activityId}`)
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

    const getActivityColor = (type) => {
        const colors = {
            'run': '#ef4444',
            'walk': '#10b981',
            'cycle': '#3b82f6',
            'hike': '#f59e0b',
        };
        return colors[type?.toLowerCase()] || theme.gradientStart;
    };

    if (!user) return <Text style={[styles.errorText, { color: theme.error }]}>Please login to see your activities.</Text>;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView 
                contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Activity Details</Text>
                </View>

                {activity ? (
                    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                        <View style={[styles.activityHeader, { borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                            <View style={styles.activityTypeContainer}>
                                <View style={[styles.activityTypeDot, { backgroundColor: getActivityColor(activity.type) }]} />
                                <Text style={[styles.activityType, { color: theme.text }]}>{activity.type}</Text>
                            </View>
                            <Text style={[styles.activityDate, { color: theme.secondaryText }]}>
                                {new Date(activity.startTime).toLocaleDateString()}
                            </Text>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Duration</Text>
                                <Text style={[styles.statValue, { color: theme.text }]}>
                                    {calculateDuration(activity.startTime, activity.endTime)}
                                </Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Distance</Text>
                                <Text style={[styles.statValue, { color: theme.text }]}>
                                    {activity.distance ? activity.distance.toFixed(2) : 'N/A'} km
                                </Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Calories</Text>
                                <Text style={[styles.statValue, { color: theme.text }]}>
                                    {activity.caloriesBurned || 0}
                                </Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Steps</Text>
                                <Text style={[styles.statValue, { color: theme.text }]}>
                                    {activity.stepCount || 0}
                                </Text>
                            </View>

                            {activity.type?.toLowerCase() === 'run' && activity.distance && activity.endTime && activity.startTime && (
                                <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                    <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Pace</Text>
                                    <Text style={[styles.statValue, { color: theme.text }]}>
                                        {calculatePace(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))}
                                    </Text>
                                </View>
                            )}

                            {activity.type?.toLowerCase() === 'cycle' && activity.distance && activity.endTime && activity.startTime && (
                                <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                    <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Speed</Text>
                                    <Text style={[styles.statValue, { color: theme.text }]}>
                                        {calculateSpeed(activity.distance, new Date(activity.endTime) - new Date(activity.startTime))} km/h
                                    </Text>
                                </View>
                            )}

                            {activity.type?.toLowerCase() === 'hike' && (
                                <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                    <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Altitude</Text>
                                    <Text style={[styles.statValue, { color: theme.text }]}>
                                        {calculateAltitudeChange(activity.altitudeChanges)} m
                                    </Text>
                                </View>
                            )}
                        </View>

                        {activity.locationData && activity.locationData.length > 0 ? (
                            <View style={styles.mapContainer}>
                                <MapView
                                    key={activityId}
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: activity.locationData[0].latitude,
                                        longitude: activity.locationData[0].longitude,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    }}
                                    scrollEnabled={true}
                                    zoomEnabled={true}
                                >
                                    <Polyline
                                        coordinates={activity.locationData.map(loc => ({
                                            latitude: loc.latitude,
                                            longitude: loc.longitude
                                        }))}
                                        strokeColor={theme.gradientStart}
                                        strokeWidth={4}
                                    />
                                    {activity.locationData.length > 0 && (
                                        <>
                                            <Marker
                                                coordinate={{
                                                    latitude: activity.locationData[0].latitude,
                                                    longitude: activity.locationData[0].longitude
                                                }}
                                                title="Start"
                                                pinColor={theme.gradientStart}
                                            />
                                            <Marker
                                                coordinate={{
                                                    latitude: activity.locationData[activity.locationData.length - 1].latitude,
                                                    longitude: activity.locationData[activity.locationData.length - 1].longitude
                                                }}
                                                title="End"
                                                pinColor={theme.error}
                                            />
                                        </>
                                    )}
                                </MapView>
                            </View>
                        ) : (
                            <View style={[styles.noDataContainer, { backgroundColor: theme.background }]}>
                                <Text style={[styles.noDataText, { color: theme.secondaryText }]}>No location data available</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={[styles.errorContainer, { backgroundColor: theme.errorBackground }]}>
                        <Text style={[styles.errorText, { color: theme.error }]}>{error || 'No activities found.'}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
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
    header: {
        marginBottom: 24,
        paddingTop: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    card: {
        borderRadius: 20,
        padding: 24,
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
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    activityTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activityTypeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    activityType: {
        fontSize: 24,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    activityDate: {
        fontSize: 15,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        minWidth: '30%',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    mapContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
    },
    map: {
        width: '100%',
        height: 400,
    },
    noDataContainer: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    noDataText: {
        fontSize: 16,
        fontStyle: 'italic',
    },
    errorContainer: {
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default ShowActivityScreen;
