import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, useColorScheme, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/userContext';
import { API_BASE_URL } from '../config/api';
import { Colors } from '@/constants/Colors';

const Activity = () => {
    const { user } = useContext(UserContext);
    const [selectedValue, setSelectedValue] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const workoutTypes = [
        { label: 'Run', value: 'Run', icon: '🏃', color: '#ef4444' },
        { label: 'Walk', value: 'Walk', icon: '🚶', color: '#10b981' },
        { label: 'Cycle', value: 'Cycle', icon: '🚴', color: '#3b82f6' },
        { label: 'Hike', value: 'Hike', icon: '🥾', color: '#f59e0b' },
    ];

    const handleStartActivity = async () => {
        if (selectedValue) {
            setIsLoading(true);
            const startTime = new Date();
            try {
                const response = await fetch(`${API_BASE_URL}/activities`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userID: user._id,
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView 
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.text }]}>New Activity</Text>
                            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                                Choose your workout type to start tracking
                            </Text>
                        </View>

                        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                            <View style={styles.form}>
                                <Text style={[styles.label, { color: theme.text }]}>Select Workout Type</Text>
                                
                                <View style={styles.workoutGrid}>
                                    {workoutTypes.map((workout) => (
                                        <TouchableOpacity
                                            key={workout.value}
                                            style={[
                                                styles.workoutButton,
                                                selectedValue === workout.value 
                                                    ? { 
                                                        backgroundColor: workout.color,
                                                        borderColor: workout.color,
                                                        borderWidth: 3,
                                                    }
                                                    : {
                                                        backgroundColor: theme.inputBackground,
                                                        borderColor: theme.inputBorder,
                                                        borderWidth: 2,
                                                    }
                                            ]}
                                            onPress={() => setSelectedValue(workout.value)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.workoutIcon}>{workout.icon}</Text>
                                            <Text style={[
                                                styles.workoutLabel,
                                                { color: selectedValue === workout.value ? '#ffffff' : theme.text }
                                            ]}>
                                                {workout.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity 
                                    style={[
                                        styles.button, 
                                        (!selectedValue || isLoading) ? styles.disabledButton : { backgroundColor: theme.gradientStart }
                                    ]}
                                    onPress={handleStartActivity}
                                    disabled={!selectedValue || isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Start Activity</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
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
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    card: {
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 12,
    },
    form: {
        gap: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    workoutGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
    },
    workoutButton: {
        flex: 1,
        minWidth: '45%',
        aspectRatio: 1,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    workoutIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    workoutLabel: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    button: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    disabledButton: {
        backgroundColor: '#a0aec0',
        shadowOpacity: 0,
        elevation: 0,
    },
});

export default Activity;
