import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

const ActivityTracking = ({ route }) => {
    const { activityType, startTime, activityId } = route.params;
    const [position, setPosition] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        const sendLocationData = async (latitude, longitude, altitude) => {
            await fetch("http://192.168.1.220:3001/activities/update", {
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

        let subscriber = null;
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
                return;
            }

            subscriber = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.Highest,
                distanceInterval: 0,
                timeInterval: 2000
            }, (pos) => {
                const { latitude, longitude, altitude } = pos.coords;
                setPosition({ latitude, longitude, altitude });
                sendLocationData(latitude, longitude, altitude);
            });
        })();

        return () => {
            subscriber && subscriber.remove();
        };
    }, []);

    const handleEndActivity = async () => {
        const endTime = new Date();
        await fetch("http://192.168.1.220:3001/activities/end", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activityId,
                endTime: endTime.toISOString(),
            }),
        });
        navigation.navigate("Home"); // Change "Home" to your specific home or summary screen
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
            <Button title="End Activity" onPress={handleEndActivity} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default ActivityTracking;
