import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import { UserContext } from '../context/userContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const EditProfileScreen = () => {
    const { user } = useContext(UserContext);
    const [profile, setProfile] = useState({
        name: '',
        surname: '',
        username: '',
        email: '',
        age: '',
        height: '',
        weight: '',
        gender: ''
    });
    const [errors, setErrors] = useState('');
    const navigation = useNavigation();
    const route = useRoute();

    useEffect(() => {
        if (user) {
            axios.get(`https://mallard-set-akita.ngrok-free.app/users/${user.id}`, { timeout: 5000 })
                .then(response => {
                    const fetchedProfile = response.data;
                    setProfile({
                        name: fetchedProfile.name || '',
                        surname: fetchedProfile.surname || '',
                        email: fetchedProfile.email || '',
                        age: fetchedProfile.age ? fetchedProfile.age.toString() : '',
                        height: fetchedProfile.height ? fetchedProfile.height.toString() : '',
                        weight: fetchedProfile.weight ? fetchedProfile.weight.toString() : '',
                        gender: fetchedProfile.gender || ''
                    });
                })
                .catch(error => {
                    setErrors('Failed to fetch profile');
                    console.error('Error fetching profile:', error);
                });
        }
    }, [user]);

    const handleChange = (name, value) => {
        setProfile({ ...profile, [name]: value });
    };

    const handleSubmit = async () => {
        try {
            const res = await axios.put(`https://mallard-set-akita.ngrok-free.app/users/${user.id}`, profile, { timeout: 5000 });
            route.params.onGoBack();
            navigation.navigate('Profile');
        } catch (error) {
            setErrors('Failed to update profile');
            console.error('Error updating profile:', error);
        }
    };

    if (!user) return <Text style={styles.loginMessage}>Please login to view this page.</Text>;

    const genderOptions = [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
    ];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Edit Profile</Text>
            </View>
            <View style={styles.formField}>
                <Text style={styles.label}>Name:</Text>
                <TextInput
                    style={styles.input}
                    value={profile.name}
                    onChangeText={(value) => handleChange('name', value)}
                />
            </View>
            <View style={styles.formField}>
                <Text style={styles.label}>Surname:</Text>
                <TextInput
                    style={styles.input}
                    value={profile.surname}
                    onChangeText={(value) => handleChange('surname', value)}
                />
            </View>
            <View style={styles.formField}>
                <Text style={styles.label}>Email:</Text>
                <TextInput
                    style={styles.input}
                    value={profile.email}
                    onChangeText={(value) => handleChange('email', value)}
                    keyboardType="email-address"
                />
            </View>
            <View style={styles.formField}>
                <Text style={styles.label}>Age:</Text>
                <TextInput
                    style={styles.input}
                    value={profile.age}
                    onChangeText={(value) => handleChange('age', value)}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.formField}>
                <Text style={styles.label}>Height (cm):</Text>
                <TextInput
                    style={styles.input}
                    value={profile.height}
                    onChangeText={(value) => handleChange('height', value)}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.formField}>
                <Text style={styles.label}>Weight (kg):</Text>
                <TextInput
                    style={styles.input}
                    value={profile.weight}
                    onChangeText={(value) => handleChange('weight', value)}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.formField}>
                <Text style={styles.label}>Gender:</Text>
                <RNPickerSelect
                    placeholder={{
                        label: 'Select a gender...',
                        value: null,
                        color: '#6e6869',
                    }}
                    items={genderOptions}
                    onValueChange={(value) => handleChange('gender', value)}
                    value={profile.gender}
                    style={{
                        inputIOS: styles.picker,
                        inputAndroid: styles.picker,
                        placeholder: styles.placeholder,
                    }}
                    useNativeAndroidPickerStyle={false}
                />
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.navigate('Profile')}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
            {errors && <Text style={styles.errorText}>{errors}</Text>}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    formField: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        backgroundColor: '#f9f9f9',
    },
    picker: {
        width: '100%',
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E2E2',
        borderWidth: 1,
        borderRadius: 4,
        color: 'black',
        alignSelf: 'center',
        marginBottom: 20,
    },
    placeholder: {
        color: '#6e6869',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
        backgroundColor: '#4A90E2', // Light blue for the update button
    },
    cancelButton: {
        backgroundColor: '#003f7f', // Dark blue for the cancel button
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginTop: 20,
        textAlign: 'center',
    },
    loginMessage: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: 'gray',
    },
});

export default EditProfileScreen;
