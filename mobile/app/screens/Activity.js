import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';

const Activity = () => {
    const [selectedValue, setSelectedValue] = useState(null);
    const navigation = useNavigation();

    const placeholder = {
        label: 'Select a workout type...',
        value: null,
    };

    const options = [
        { label: 'Run', value: 'run' },
        { label: 'Walk', value: 'walk' },
        { label: 'Cycle', value: 'cycle' },
    ];

    const handleStartActivity = async () => {
        if (selectedValue) {
            const startTime = new Date(); // Capture the current time
            const response = await fetch("http://192.168.1.220:3001/activities", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userID: '664db607c84fefbc8cce789a',
                    type: selectedValue,
                    startTime: startTime.toISOString(),
                }),
            });
    
            const data = await response.json();
            if (response.ok) {
                navigation.navigate("ActivityTracking", {
                    type: selectedValue,
                    startTime: startTime.toISOString(),
                    activityId: data.activityId, // Assuming the server responds with an ID for the activity
                });
            } else {
                console.error('Failed to start activity', data);
            }
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
                    placeholder: {
                        color: 'gray',
                    },
                }}
            />
            {selectedValue && <Text style={styles.label}>Selected: {selectedValue}</Text>}
            <TouchableOpacity style={styles.button} onPress={handleStartActivity}>
                <Text style={styles.buttonText}>Start Activity</Text>
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
    },
    picker: {
        width: 300,
        padding: 10,
        backgroundColor: '#fff',
        borderColor: '#ccc',
        borderWidth: 1,
        color: 'black',
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        color: 'black',
    },
    button: {
        backgroundColor: 'blue',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
        alignItems: 'center',
        width: 150,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default Activity;
