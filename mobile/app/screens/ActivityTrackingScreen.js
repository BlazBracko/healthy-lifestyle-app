import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useColorScheme, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Pedometer } from 'expo-sensors';
import MapView, { Circle, Polyline } from 'react-native-maps';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Colors } from '@/constants/Colors';

const TASK_NAME = 'background-update-time';

const defineBackgroundTask = () => {
    TaskManager.defineTask(TASK_NAME, async () => {
        console.log('Background task executed');
        return BackgroundFetch.Result.NewData;
    });
};

const registerBackgroundFetch = async () => {
    try {
        return await BackgroundFetch.registerTaskAsync(TASK_NAME, {
            minimumInterval: 60,
            stopOnTerminate: false,
            startOnBoot: true,
        });
    } catch (error) {
        console.debug('Background fetch registration failed (expected in Expo Go):', error.message);
        return null;
    }
};

const unregisterBackgroundFetch = async () => {
    return BackgroundFetch.unregisterTaskAsync(TASK_NAME);
};

const ActivityTracking = () => {
    const route = useRoute();
    const { activityType, startTime, activityId } = route.params;
    const [position, setPosition] = useState(null);
    const [stepCount, setStepCount] = useState(0);
    const [initialStepCount, setInitialStepCount] = useState(0);
    const [caloriesBurned, setCaloriesBurned] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [locationHistory, setLocationHistory] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const mapRef = useRef(null);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        defineBackgroundTask();
        registerBackgroundFetch();

        setElapsedTime(0);
        setStepCount(0);
        setCaloriesBurned(0);
        
        // Preveri povezavo z API-jem ob zagonu
        (async () => {
            try {
                const testResponse = await fetch(`${API_BASE_URL}/health`, { 
                    method: 'GET',
                    timeout: 5000 
                }).catch(() => null);
                if (testResponse) {
                    console.log('API connection test: OK');
                } else {
                    console.warn('API connection test: Failed - server may be unreachable');
                    console.warn('API Base URL:', API_BASE_URL);
                }
            } catch (error) {
                console.warn('API connection test error:', error.message);
            }
        })();

        const sendActivityData = async (latitude, longitude, altitude, stepCount, caloriesBurned) => {
            try {
                const response = await fetch(`${API_BASE_URL}/activities/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        activityId,
                        latitude,
                        longitude,
                        altitude,
                        stepCount,
                        caloriesBurned,
                    }),
                });
                
                if (!response.ok) {
                    console.warn('Activity update failed:', response.status);
                }
            } catch (error) {
                console.debug('Activity update error (non-critical):', error.message);
            }
        };

        let locationSubscriber = null;
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
                return;
            }

            locationSubscriber = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.Highest,
                distanceInterval: 0,
                timeInterval: 2000
            }, (pos) => {
                const { latitude, longitude, altitude } = pos.coords;
                setPosition({ latitude, longitude, altitude });
                setLocationHistory(prev => [...prev, { latitude, longitude }]);
                sendActivityData(latitude, longitude, altitude, stepCount, caloriesBurned);

                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.002,
                        longitudeDelta: 0.002,
                    }, 1000);
                }
            });
        })();

        const startPedometer = async () => {
            if (activityType === 'Walk' || activityType === 'Run' || activityType === 'Hike') {
                const isAvailable = await Pedometer.isAvailableAsync();
                if (!isAvailable) {
                    console.warn('Pedometer is not available on this device.');
                    return;
                }

                let baselineSteps = 0;
                let isFirstReading = true;

                Pedometer.watchStepCount(result => {
                    const totalSteps = result.steps || 0;
                    
                    if (isFirstReading) {
                        baselineSteps = totalSteps;
                        setInitialStepCount(baselineSteps);
                        isFirstReading = false;
                        console.log('Baseline step count set:', baselineSteps);
                    }
                    
                    const activitySteps = Math.max(0, totalSteps - baselineSteps);
                    setStepCount(activitySteps);
                    console.log('Total steps:', totalSteps, 'Baseline:', baselineSteps, 'Activity steps:', activitySteps);
                });
            }
        };

        startPedometer();

        return () => {
            locationSubscriber && locationSubscriber.remove();
            unregisterBackgroundFetch();
        };

    }, [activityType]);

    useEffect(() => {
        const calculateCaloriesBurned = () => {
            let calories = 0;
            if (activityType === 'Walk') {
                calories = stepCount * 0.04;
            } else if (activityType === 'Run') {
                calories = stepCount * 0.06;
            } else if (activityType === 'Cycle') {
                const durationInMinutes = (new Date() - new Date(startTime)) / (1000 * 60);
                calories = durationInMinutes * 8;
            }
            setCaloriesBurned(Math.round(calories));
        };

        calculateCaloriesBurned();
    }, [stepCount, activityType, startTime]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setElapsedTime(prevElapsedTime => prevElapsedTime + 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getActivityColor = (type) => {
        const colors = {
            'Run': '#ef4444',
            'Walk': '#10b981',
            'Cycle': '#3b82f6',
            'Hike': '#f59e0b',
        };
        return colors[type] || theme.gradientStart;
    };

    const getActivityIcon = (type) => {
        const icons = {
            'Run': '🏃',
            'Walk': '🚶',
            'Cycle': '🚴',
            'Hike': '🥾',
        };
        return icons[type] || '🏃';
    };

    const handleEndActivity = async () => {
        // Prepreči večkratno klicanje
        if (isProcessing) {
            return;
        }

        setIsProcessing(true);
        const endTime = new Date();
        const finalStepCount = stepCount;
        const finalCaloriesBurned = caloriesBurned;
        
        console.log('Ending activity with:', {
            activityId,
            stepCount: finalStepCount,
            caloriesBurned: finalCaloriesBurned
        });
        
        // Retry logika - poskusi 3x
        let success = false;
        let lastError = null;
        const endpoint = `${API_BASE_URL}/activities/end`;
        
        console.log('API Base URL:', API_BASE_URL);
        console.log('Full endpoint:', endpoint);
        console.log('Activity ID:', activityId);
        
        // Preveri, ali aktivnost sploh obstaja na strežniku
        try {
            const checkResponse = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
                method: 'GET',
            }).catch(() => null);
            
            if (checkResponse && checkResponse.ok) {
                console.log('Activity exists on server');
            } else {
                console.warn('Activity may not exist on server or server is unreachable');
            }
        } catch (error) {
            console.warn('Could not verify activity existence:', error.message);
        }
        
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`Attempt ${attempt} to end activity...`);
                
                // Uporabi axios namesto fetch za boljšo kompatibilnost z React Native
                const response = await axios.post(endpoint, {
                    activityId,
                    endTime: endTime.toISOString(),
                    stepCount: finalStepCount,
                    caloriesBurned: finalCaloriesBurned, 
                }, {
                    timeout: 15000, // 15 sekund timeout
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                console.log('Activity ended successfully:', response.data);
                success = true;
                break;
            } catch (error) {
                if (error.response) {
                    // Strežnik je odgovoril z error statusom
                    console.warn(`Failed to end activity (attempt ${attempt}):`, error.response.status, error.response.data);
                    lastError = new Error(`Server error: ${error.response.status} - ${JSON.stringify(error.response.data).substring(0, 100)}`);
                    
                    // Če je 404 ali 500, ne poskusi več
                    if (error.response.status === 404 || error.response.status === 500) {
                        console.log('Server error detected, stopping retries');
                        break;
                    }
                } else if (error.request) {
                    // Request je bil poslan, vendar ni bilo odgovora
                    console.error(`Error ending activity (attempt ${attempt}): No response from server`);
                    lastError = error;
                } else {
                    // Napaka pri nastavitvi requesta
                    console.error(`Error ending activity (attempt ${attempt}):`, error.message);
                    lastError = error;
                }
                
                // Če ni zadnji poskus, počakaj malo pred naslednjim poskusom
                if (attempt < 3) {
                    const delay = 1000 * attempt; // 1s, 2s delay
                    console.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // Resetiraj state
        setElapsedTime(0); 
        setStepCount(0);
        setCaloriesBurned(0);
        setIsProcessing(false);
        
        // Če se ni uspelo shraniti, prikaži uporabniku opozorilo
        if (!success) {
            Alert.alert(
                'Connection Error',
                'Unable to save activity to server. Please check your internet connection and try again later.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate("Home")
                    }
                ],
                { cancelable: false }
            );
        } else {
            // Uspešno shranjeno - navigiraj na Home
            navigation.navigate("Home");
        }
    };

    const handleCancelActivity = async () => {
        // Prepreči večkratno klicanje
        if (isProcessing) {
            return;
        }

        Alert.alert(
            'Cancel Activity',
            'Are you sure you want to cancel this activity? All progress will be lost.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setIsProcessing(true);
                        const url = `${API_BASE_URL}/activities/${activityId}`;
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 10000);

                            const response = await fetch(url, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                signal: controller.signal,
                            });

                            clearTimeout(timeoutId);

                            if (response.ok) {
                                console.log("Activity canceled successfully");
                            } else {
                                throw new Error(`Failed to cancel activity: ${response.status}`);
                            }
                        } catch (error) {
                            if (error.name !== 'AbortError') {
                                console.error('Error while canceling the activity:', error);
                            }
                        } finally {
                            setElapsedTime(0); 
                            setStepCount(0);
                            setCaloriesBurned(0);
                            setIsProcessing(false);
                            navigation.navigate("Home");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {position && (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={{
                            latitude: position.latitude,
                            longitude: position.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                    >
                        {locationHistory.length > 1 && (
                            <Polyline
                                coordinates={locationHistory}
                                strokeColor={getActivityColor(activityType)}
                                strokeWidth={4}
                            />
                        )}
                        <Circle
                            center={position}
                            radius={8}
                            strokeColor={getActivityColor(activityType)}
                            fillColor={`${getActivityColor(activityType)}80`}
                        />
                    </MapView>
                )}

                <View style={[styles.detailsContainer, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.activityHeader}>
                        <View style={styles.activityTypeContainer}>
                            <Text style={styles.activityIcon}>{getActivityIcon(activityType)}</Text>
                            <Text style={[styles.activityType, { color: theme.text }]}>Tracking {activityType}</Text>
                        </View>
                        <View style={[styles.timerContainer, { backgroundColor: theme.background }]}>
                            <Text style={[styles.timer, { color: getActivityColor(activityType) }]}>
                                {formatTime(elapsedTime)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        {(activityType === 'Walk' || activityType === 'Run' || activityType === 'Hike') && (
                            <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Steps</Text>
                                <Text style={[styles.statValue, { color: theme.text }]}>{stepCount}</Text>
                            </View>
                        )}
                        {caloriesBurned > 0 && (
                            <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Calories</Text>
                                <Text style={[styles.statValue, { color: theme.text }]}>{Math.round(caloriesBurned)}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.startTime, { color: theme.secondaryText }]}>
                        Started at {new Date(startTime).toLocaleTimeString()}
                    </Text>
                </View>

                <View style={[
                    styles.buttonContainer, 
                    { 
                        backgroundColor: theme.cardBackground,
                        borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                    }
                ]}>
                    <TouchableOpacity 
                        style={[
                            styles.finishButton, 
                            { 
                                backgroundColor: isProcessing ? theme.secondaryText : getActivityColor(activityType),
                                opacity: isProcessing ? 0.6 : 1
                            }
                        ]} 
                        onPress={handleEndActivity}
                        activeOpacity={0.8}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Finish Activity</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[
                            styles.cancelButton, 
                            { 
                                backgroundColor: theme.error,
                                opacity: isProcessing ? 0.6 : 1
                            }
                        ]} 
                        onPress={handleCancelActivity}
                        activeOpacity={0.8}
                        disabled={isProcessing}
                    >
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    detailsContainer: {
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    activityHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    activityTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    activityIcon: {
        fontSize: 32,
    },
    activityType: {
        fontSize: 24,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    timerContainer: {
        padding: 20,
        borderRadius: 20,
        minWidth: 200,
        alignItems: 'center',
    },
    timer: {
        fontSize: 48,
        fontWeight: '700',
        letterSpacing: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
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
        fontSize: 28,
        fontWeight: '700',
    },
    startTime: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        paddingBottom: 20,
        borderTopWidth: 1,
    },
    finishButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ActivityTracking;
