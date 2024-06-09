import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Pedometer } from 'expo-sensors';
import MapView, { Circle } from 'react-native-maps';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const TASK_NAME = 'background-update-time';

const defineBackgroundTask = () => {
    TaskManager.defineTask(TASK_NAME, async () => {
        // Task definition logic
        console.log('Background task executed');
        return BackgroundFetch.Result.NewData;
    });
};

const registerBackgroundFetch = async () => {
    return BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 60, // 1 minute
        stopOnTerminate: false,
        startOnBoot: true,
    });
};

const unregisterBackgroundFetch = async () => {
    return BackgroundFetch.unregisterTaskAsync(TASK_NAME);
};

const ActivityTracking = ({ route }) => {
    const { activityType, startTime, activityId } = route.params;
    const [position, setPosition] = useState(null);
    const [stepCount, setStepCount] = useState(0);
    const [caloriesBurned, setCaloriesBurned] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const mapRef = useRef(null);
    const navigation = useNavigation();

    useEffect(() => {
        defineBackgroundTask();
        registerBackgroundFetch();

        setElapsedTime(0);
        setStepCount(0);
        setCaloriesBurned(0);

        const sendActivityData = async (latitude, longitude, altitude, stepCount, caloriesBurned) => {
            await fetch("https://mallard-set-akita.ngrok-free.app/activities/update", {
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

                Pedometer.watchStepCount(result => {
                    setStepCount(result.steps);
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

    const handleEndActivity = async () => {
        const endTime = new Date();
        await fetch("https://mallard-set-akita.ngrok-free.app/activities/end", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activityId,
                endTime: endTime.toISOString(),
                stepCount,
                caloriesBurned, 
            }),
        });
        setElapsedTime(0); 
        setStepCount(0);
        setCaloriesBurned(0);
        navigation.navigate("Home");
    };

    const handleCancelActivity = async () => {
        const url = `https://mallard-set-akita.ngrok-free.app/activities/${activityId}`;
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                console.log("Activity canceled successfully");
            } else {
                throw new Error(`Failed to cancel activity: ${response.status}`);
            }
        } catch (error) {
            console.error('Error while canceling the activity:', error);
        }
        setElapsedTime(0); 
        setStepCount(0);
        setCaloriesBurned(0);
        navigation.navigate("Home");
    };

    return (
        <View style={styles.container}>
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
                    <Circle
                        center={position}
                        radius={6}
                        strokeColor="rgba(0, 112, 255, 1)"
                        fillColor="rgba(0, 112, 255, 0.3)"
                    />
                </MapView>
            )}
            <View style={styles.detailsContainer}>
                <Text style={styles.activityType}>Tracking {activityType}</Text>
                <Text style={styles.time}>Activity started at: {new Date(startTime).toLocaleTimeString()}</Text>
                <Text style={styles.timer}>Time: {formatTime(elapsedTime)}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleEndActivity}>
                    <Text style={styles.buttonText}>Finish</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelActivity}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    map: {
        flex: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    detailsContainer: {
        flex: 3,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    activityType: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    time: {
        fontSize: 18,
        marginVertical: 10,
    },
    timer: {
        fontSize: 36,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    button: {
        flex: 1,
        marginHorizontal: 10,
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#003f7f',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ActivityTracking;
