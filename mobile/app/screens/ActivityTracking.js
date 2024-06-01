import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Pedometer } from 'expo-sensors';

const ActivityTracking = ({ route }) => {
    const { activityType, startTime, activityId } = route.params;
    const [position, setPosition] = useState(null);
    const [stepCount, setStepCount] = useState(0);
    const navigation = useNavigation();

    useEffect(() => {
        const sendLocationData = async (latitude, longitude, altitude) => {
            await fetch("http://192.168.1.100:3001/activities/update", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activityId,
                    latitude,
                    longitude,
                    altitude,
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
                sendLocationData(latitude, longitude, altitude);
            });
        })();

        const startPedometer = async () => {
            const isAvailable = await Pedometer.isAvailableAsync();
            if (!isAvailable) {
                console.warn('Pedometer is not available on this device.');
                return;
            }

            Pedometer.watchStepCount(result => {
                setStepCount(result.steps);
            });
        };

        startPedometer();

        return () => {
            locationSubscriber && locationSubscriber.remove();
        };
    }, []);

    const handleEndActivity = async () => {
        const endTime = new Date();
        await fetch("http://192.168.1.100:3001/activities/end", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activityId,
                endTime: endTime.toISOString(),
                stepCount, 
            }),
        });
        navigation.navigate("Home"); 
    };

    return (
        <View style={styles.container}>
            <Text>Tracking {activityType}</Text>
            <Text>Activity started at: {new Date(startTime).toLocaleTimeString()}</Text>
            {position && (
                <>
                    <Text>Latitude: {position.latitude}</Text>
                    <Text>Longitude: {position.longitude}</Text>
                    <Text>Altitude: {position.altitude ? position.altitude.toFixed(2) + ' meters' : 'Not available'}</Text>
                </>
            )}
            <Text>Steps: {stepCount}</Text>
            <Button title="End Activity" onPress={handleEndActivity} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    }
});

export default ActivityTracking;
