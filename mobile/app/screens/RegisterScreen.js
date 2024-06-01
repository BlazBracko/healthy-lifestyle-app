import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

const RegisterScreen = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function registerForPushNotificationsAsync() {
        let token;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus === 'granted') {
            token = (await Notifications.getExpoPushTokenAsync()).data;
        }

        return token;
    }

    const handleRegister = async () => {
        if (!username || !email || !name || !surname || !password) {
            Alert.alert("Please fill all fields");
            return;
        }
        
        const token = await registerForPushNotificationsAsync();

        if (!token) {
            Alert.alert("Failed to get a push token");
            return;
        }

        try {
            const response = await fetch('http://192.168.1.100:3001/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, surname, username, email, password, token
                })
            });
            const jsonData = await response.json();

            if (response.status === 201) {
                Alert.alert("Success", "You have registered successfully!");
                setUsername('');
                setEmail('');
                setName('');
                setSurname('');
                setPassword('');
                setError('');
            } else {
                setError(jsonData.message || "Registration failed");
                Alert.alert("Registration Failed", jsonData.message);
            }
        } catch (error) {
            console.error(error);
            setError("Failed to connect to the server.");
            Alert.alert("Network Error", "Failed to connect to the server.");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Surname"
                value={surname}
                onChangeText={setSurname}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <View style={styles.buttonContainer}>
                <Button title="Register" onPress={handleRegister} />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        height: 40,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FFF', // Optional: makes the border visible
        padding: 10,
        borderRadius: 5,
    },
    buttonContainer: {
        marginTop: 20,
    },
    error: {
        color: 'red',
        marginTop: 10,
    }
});

export default RegisterScreen;
