import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/userContext';

const Activity = () => {
    const { user } = useContext(UserContext);
    const [selectedValue, setSelectedValue] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const placeholder = {
        label: 'Select a workout type...',
        value: null,
        color: '#6e6869',
    };

    const options = [
        { label: 'Run', value: 'Run' },
        { label: 'Walk', value: 'Walk' },
        { label: 'Cycle', value: 'Cycle' },
        { label: 'Hike', value: 'Hike' },
    ];

    const handleStartActivity = async () => {
        if (selectedValue) {
            setIsLoading(true);
            const startTime = new Date();
            try {
                const response = await fetch("https://mallard-set-akita.ngrok-free.app/activities", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userID: user.id,
                        type: selectedValue,
                        startTime: startTime.toISOString(),
                    }),
                });

                const data = await response.json();
                setIsLoading(false);

                if (response.ok) {
                    console.log('Activity started successfully', data);
                    navigation.navigate("ActivityTracking", {
                        activityType: selectedValue,
                        startTime: startTime.toISOString(),
                        activityId: data.activityId,
                    });
                } else {
                    console.error('Failed to start activity', data);
                }
            } catch (error) {
                setIsLoading(false);
                console.error('Error starting activity', error);
            }
        } else {
            console.log('No workout type selected');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select a workout type:</Text>
            <RNPickerSelect
                placeholder={placeholder}
                items={options}
                onValueChange={value => setSelectedValue(value)}
                value={selectedValue}
                style={{
                    inputIOS: styles.picker,
                    inputAndroid: styles.picker,
                    placeholder: styles.placeholder,
                }}
                useNativeAndroidPickerStyle={false}
            />
            <TouchableOpacity style={[styles.button, (!selectedValue || isLoading) ? styles.disabledButton : {}]}
                onPress={handleStartActivity}
                disabled={!selectedValue || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Text style={styles.buttonText}>Start Activity</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#EDEDEF', // A modern, light grey background
    },
    picker: {
        width: 300,
        padding: 10,
        backgroundColor: '#FFFFFF', // White background for the picker for a clean look
        borderColor: '#E2E2E2', // Light border color
        borderWidth: 1,
        borderRadius: 4,
        color: 'black',
        alignSelf: 'center',
        marginBottom: 20,
    },
    placeholder: {
        color: '#6e6869',
    },
    label: {
        fontSize: 18,
        marginBottom: 10,
        color: '#333',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 5,
        marginTop: 20,
        alignItems: 'center',
        width: 150,
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowColor: '#000',
        shadowOffset: { height: 2, width: 0 },
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#879cc4',
    },
});

export default Activity;
