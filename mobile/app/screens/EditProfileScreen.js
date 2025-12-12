import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, useColorScheme, StatusBar, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';
import { UserContext } from '../context/userContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';
import { Colors } from '@/constants/Colors';

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
    const [success, setSuccess] = useState('');
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        if (user) {
            axios.get(`${API_BASE_URL}/users/${user._id}`, { timeout: 5000 })
                .then(response => {
                    const fetchedProfile = response.data;
                    setProfile({
                        name: fetchedProfile.name || '',
                        surname: fetchedProfile.surname || '',
                        username: fetchedProfile.username || '',
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

            // Naloži profilno sliko
            loadProfilePhoto();
        }
    }, [user]);

    const loadProfilePhoto = async () => {
        if (!user || !user.username) return;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/users/${user.username}/profile-photo`);
            if (response.data && response.data.image) {
                setPhotoPreview(`data:image/${response.data.format || 'png'};base64,${response.data.image}`);
            }
        } catch (error) {
            // Če slika ne obstaja, to ni napaka
            if (error.response?.status !== 404) {
                console.error('Error loading profile photo:', error);
            }
        }
    };

    const pickImage = async () => {
        // Zahtevaj dovoljenja
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload photos!');
            return;
        }

        // Odpri image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            
            // Validacija velikosti (5MB)
            if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                Alert.alert('Error', 'Image size must be less than 5MB');
                return;
            }

            setProfilePhoto(asset);
            setPhotoPreview(asset.uri);
            setErrors('');
        }
    };

    const takePhoto = async () => {
        // Zahtevaj dovoljenja
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera permissions to take photos!');
            return;
        }

        // Odpri kamero
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setProfilePhoto(asset);
            setPhotoPreview(asset.uri);
            setErrors('');
        }
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            'Select Photo',
            'Choose an option',
            [
                { text: 'Camera', onPress: takePhoto },
                { text: 'Gallery', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handlePhotoUpload = async () => {
        if (!profilePhoto || !user || !user.username) {
            Alert.alert('Error', 'Please select an image to upload');
            return;
        }

        setUploadingPhoto(true);
        setErrors('');

        try {
            // Ustvari FormData
            const formData = new FormData();
            formData.append('photo', {
                uri: profilePhoto.uri,
                type: 'image/jpeg',
                name: 'photo.jpg',
            });

            await axios.post(`${API_BASE_URL}/users/${user.username}/profile-photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000,
            });

            setSuccess('Profile photo uploaded successfully!');
            setProfilePhoto(null);
            // Osveži sliko
            await loadProfilePhoto();
            
            Alert.alert('Success', 'Profile photo uploaded successfully!');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to upload profile photo';
            setErrors(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleChange = (name, value) => {
        setProfile({ ...profile, [name]: value });
        setErrors('');
        setSuccess('');
    };

    const handleSubmit = async () => {
        setErrors('');
        setSuccess('');
        try {
            const updateData = {
                name: profile.name,
                surname: profile.surname,
                email: profile.email,
                age: profile.age ? parseInt(profile.age, 10) : undefined,
                height: profile.height ? parseInt(profile.height, 10) : undefined,
                weight: profile.weight ? parseFloat(profile.weight) : undefined,
                gender: profile.gender || undefined,
            };

            Object.keys(updateData).forEach(key => {
                if (updateData[key] === '' || updateData[key] === null || updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const res = await axios.put(`${API_BASE_URL}/users/${user._id}`, updateData, { timeout: 5000 });
            
            setSuccess('Profile updated successfully!');
            
            if (route.params?.onGoBack) {
                route.params.onGoBack();
            }
            
            setTimeout(() => {
                navigation.navigate('Profile');
            }, 1500);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
            setErrors(errorMessage);
            console.error('Error updating profile:', error);
        }
    };

    if (!user) return <Text style={[styles.loginMessage, { color: theme.error }]}>Please login to view this page.</Text>;

    const genderOptions = [
        { label: 'Select gender', value: null },
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
    ];

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Edit Profile</Text>
                        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Update your personal information</Text>
                    </View>

                    {/* Profile Photo Upload Section */}
                    <View style={[styles.photoSection, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.photoPreview}>
                            {photoPreview ? (
                                <Image source={{ uri: photoPreview }} style={styles.photoImage} />
                            ) : (
                                <View style={[styles.photoPlaceholder, { backgroundColor: theme.gradientStart }]}>
                                    <Text style={styles.photoPlaceholderText}>
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.photoButtons}>
                            <TouchableOpacity
                                style={[styles.photoButton, { backgroundColor: theme.gradientStart }]}
                                onPress={showImagePickerOptions}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.photoButtonText}>
                                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                                </Text>
                            </TouchableOpacity>
                            {profilePhoto && (
                                <TouchableOpacity
                                    style={[styles.photoSaveButton, { backgroundColor: '#48bb78' }]}
                                    onPress={handlePhotoUpload}
                                    disabled={uploadingPhoto}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.photoButtonText}>
                                        {uploadingPhoto ? 'Uploading...' : 'Save Photo'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                        <View style={styles.form}>
                            <View style={styles.formField}>
                                <Text style={[styles.label, { color: theme.text }]}>Name</Text>
                                <TextInput
                                    style={[
                                        styles.input, 
                                        { 
                                            backgroundColor: theme.inputBackground,
                                            borderColor: theme.inputBorder,
                                            color: theme.inputText,
                                        }
                                    ]}
                                    placeholder="Enter your name"
                                    placeholderTextColor={theme.placeholder}
                                    value={profile.name}
                                    onChangeText={(value) => handleChange('name', value)}
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={[styles.label, { color: theme.text }]}>Surname</Text>
                                <TextInput
                                    style={[
                                        styles.input, 
                                        { 
                                            backgroundColor: theme.inputBackground,
                                            borderColor: theme.inputBorder,
                                            color: theme.inputText,
                                        }
                                    ]}
                                    placeholder="Enter your surname"
                                    placeholderTextColor={theme.placeholder}
                                    value={profile.surname}
                                    onChangeText={(value) => handleChange('surname', value)}
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={[styles.label, { color: theme.text }]}>Email</Text>
                                <TextInput
                                    style={[
                                        styles.input, 
                                        { 
                                            backgroundColor: theme.inputBackground,
                                            borderColor: theme.inputBorder,
                                            color: theme.inputText,
                                        }
                                    ]}
                                    placeholder="Enter your email"
                                    placeholderTextColor={theme.placeholder}
                                    value={profile.email}
                                    onChangeText={(value) => handleChange('email', value)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={[styles.label, { color: theme.text }]}>Age</Text>
                                <TextInput
                                    style={[
                                        styles.input, 
                                        { 
                                            backgroundColor: theme.inputBackground,
                                            borderColor: theme.inputBorder,
                                            color: theme.inputText,
                                        }
                                    ]}
                                    placeholder="Enter your age"
                                    placeholderTextColor={theme.placeholder}
                                    value={profile.age}
                                    onChangeText={(value) => handleChange('age', value)}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={[styles.label, { color: theme.text }]}>Height (cm)</Text>
                                <TextInput
                                    style={[
                                        styles.input, 
                                        { 
                                            backgroundColor: theme.inputBackground,
                                            borderColor: theme.inputBorder,
                                            color: theme.inputText,
                                        }
                                    ]}
                                    placeholder="Enter your height in cm"
                                    placeholderTextColor={theme.placeholder}
                                    value={profile.height}
                                    onChangeText={(value) => handleChange('height', value)}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
                                <TextInput
                                    style={[
                                        styles.input, 
                                        { 
                                            backgroundColor: theme.inputBackground,
                                            borderColor: theme.inputBorder,
                                            color: theme.inputText,
                                        }
                                    ]}
                                    placeholder="Enter your weight in kg"
                                    placeholderTextColor={theme.placeholder}
                                    value={profile.weight}
                                    onChangeText={(value) => handleChange('weight', value)}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View style={styles.formField}>
                                <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
                                <RNPickerSelect
                                    placeholder={{
                                        label: 'Select gender',
                                        value: null,
                                        color: theme.placeholder,
                                    }}
                                    items={genderOptions.filter(opt => opt.value !== null)}
                                    onValueChange={(value) => handleChange('gender', value)}
                                    value={profile.gender}
                                    style={{
                                        inputIOS: [
                                            styles.picker,
                                            {
                                                backgroundColor: theme.inputBackground,
                                                borderColor: theme.inputBorder,
                                                color: theme.inputText,
                                            }
                                        ],
                                        inputAndroid: [
                                            styles.picker,
                                            {
                                                backgroundColor: theme.inputBackground,
                                                borderColor: theme.inputBorder,
                                                color: theme.inputText,
                                            }
                                        ],
                                        placeholder: {
                                            color: theme.placeholder,
                                        },
                                    }}
                                    useNativeAndroidPickerStyle={false}
                                />
                            </View>

                            {errors ? (
                                <View style={[styles.errorContainer, { backgroundColor: theme.errorBackground }]}>
                                    <Text style={[styles.errorText, { color: theme.error }]}>{errors}</Text>
                                </View>
                            ) : null}

                            {success ? (
                                <View style={[styles.successContainer, { backgroundColor: '#c6f6d5', borderColor: '#9ae6b4' }]}>
                                    <Text style={[styles.successText, { color: '#22543d' }]}>{success}</Text>
                                </View>
                            ) : null}

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity 
                                    style={[styles.button, { backgroundColor: theme.gradientStart }]} 
                                    onPress={handleSubmit}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.buttonText}>Update Profile</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.cancelButton, { backgroundColor: theme.secondaryText }]} 
                                    onPress={() => navigation.navigate('Profile')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    keyboardView: {
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
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
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
    form: {
        gap: 20,
    },
    formField: {
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 52,
        borderWidth: 2,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    picker: {
        height: 52,
        borderWidth: 2,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 8,
        gap: 12,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cancelButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorContainer: {
        padding: 14,
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    successContainer: {
        padding: 14,
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
    },
    successText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    loginMessage: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    photoSection: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    photoPreview: {
        marginBottom: 16,
    },
    photoImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#667eea',
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#667eea',
    },
    photoPlaceholderText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#ffffff',
    },
    photoButtons: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    photoButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    photoSaveButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        shadowColor: '#48bb78',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    photoButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default EditProfileScreen;
