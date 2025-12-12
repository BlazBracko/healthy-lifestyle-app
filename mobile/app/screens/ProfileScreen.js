import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useColorScheme, StatusBar, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { UserContext } from '../context/userContext';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../config/api';
import { Colors } from '@/constants/Colors';

const screenWidth = Dimensions.get('window').width;

const ProfileScreen = () => {
    const { user, logout } = useContext(UserContext);
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
    const [activities, setActivities] = useState([]);
    const [errors, setErrors] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        refreshProfile();
    }, [user]);

    const refreshProfile = () => {
        if (user) {
            axios.get(`${API_BASE_URL}/users/${user._id}`)
                .then(response => {
                    const fetchedProfile = response.data;
                    setProfile({
                        name: fetchedProfile.name || '',
                        surname: fetchedProfile.surname || '',
                        username: fetchedProfile.username || '',
                        email: fetchedProfile.email || '',
                        age: fetchedProfile.age || '',
                        height: fetchedProfile.height || '',
                        weight: fetchedProfile.weight || '',
                        gender: fetchedProfile.gender || ''
                    });
                })
                .catch(error => setErrors('Failed to fetch profile'));

            // Naloži profilno sliko
            loadProfilePhoto();
        }
    };

    const loadProfilePhoto = async () => {
        if (!user || !user.username) return;
        
        try {
            const response = await axios.get(`${API_BASE_URL}/users/${user.username}/profile-photo`);
            if (response.data && response.data.image) {
                setProfilePhoto(`data:image/${response.data.format || 'png'};base64,${response.data.image}`);
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error loading profile photo:', error);
            }
        }
    };

    const fetchActivities = async () => {
        if (user) {
            try {
                const response = await axios.get(`${API_BASE_URL}/activities/user/${user._id}`);
                // Preveri, ali je response.data array
                const activitiesData = Array.isArray(response.data) ? response.data : [];
                setActivities(activitiesData);
                setErrors('');
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    setActivities([]);
                    setErrors('');
                } else {
                    setErrors('Failed to fetch activities');
                    console.error('Error fetching activities:', error);
                    setActivities([]);
                }
            }
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshProfile();
        await fetchActivities();
        await loadProfilePhoto();
        setRefreshing(false);
    };

    const getActivityDataForLastWeek = () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);

        const filteredActivities = activities.filter(activity => {
            const activityDate = new Date(activity.startTime);
            return activityDate >= weekAgo && activityDate <= today;
        });

        const stepsData = [];
        const distanceData = [];
        const altitudeData = [];
        const labels = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekAgo);
            date.setDate(weekAgo.getDate() + i);
            labels.push(date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }));

            const dailyActivities = filteredActivities.filter(activity => {
                const activityDate = new Date(activity.startTime);
                return activityDate.toLocaleDateString() === date.toLocaleDateString();
            });

            const dailySteps = dailyActivities.reduce((total, activity) => total + (activity.stepCount || 0), 0);
            const dailyDistance = dailyActivities.reduce((total, activity) => total + (activity.distance || 0), 0);
            const dailyAltitudeChange = dailyActivities.reduce((total, activity) => {
                let altitudeChange = 0;
                const altitudeChanges = activity.altitudeChanges;
                if (altitudeChanges && altitudeChanges.length > 1) {
                    for (let j = 1; j < altitudeChanges.length; j++) {
                        altitudeChange += Math.abs(altitudeChanges[j].altitude - altitudeChanges[j - 1].altitude);
                    }
                }
                return total + altitudeChange;
            }, 0);

            stepsData.push(isNaN(dailySteps) ? 0 : dailySteps);
            distanceData.push(isNaN(dailyDistance) ? 0 : parseFloat(dailyDistance.toFixed(2)));
            altitudeData.push(isNaN(dailyAltitudeChange) ? 0 : dailyAltitudeChange);
        }

        return {
            steps: {
                labels,
                datasets: [
                    {
                        label: 'Steps',
                        data: stepsData,
                        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                        strokeWidth: 2
                    }
                ]
            },
            distance: {
                labels,
                datasets: [
                    {
                        label: 'Distance',
                        data: distanceData,
                        color: (opacity = 1) => `rgba(118, 75, 162, ${opacity})`,
                        strokeWidth: 2
                    }
                ]
            },
            altitude: {
                labels,
                datasets: [
                    {
                        label: 'Altitude change',
                        data: altitudeData,
                        color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                        strokeWidth: 2
                    }
                ]
            }
        };
    };

    const activityData = getActivityDataForLastWeek();

    if (!user) return <Text style={[styles.loginMessage, { color: theme.error }]}>Please login to view this page.</Text>;

    const chartConfig = {
        backgroundColor: theme.cardBackground,
        backgroundGradientFrom: theme.cardBackground,
        backgroundGradientTo: theme.cardBackground,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(${colorScheme === 'dark' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: theme.gradientStart
        }
    };

    const distanceChartConfig = {
        ...chartConfig,
        color: (opacity = 1) => `rgba(118, 75, 162, ${opacity})`,
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: theme.gradientEnd
        }
    };

    const altitudeChartConfig = {
        ...chartConfig,
        color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#f59e0b'
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView 
                contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('EditProfile', { onGoBack: () => refreshProfile() })} 
                        style={[styles.editButton, { backgroundColor: theme.gradientStart }]}
                        activeOpacity={0.8}
                    >
                        <Icon name="edit" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={logout} 
                        style={styles.logoutButton}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.logoutButtonText, { color: theme.error }]}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.profileCard, { backgroundColor: theme.cardBackground }]}>
                    {/* Profile Photo */}
                    <View style={styles.profilePhotoContainer}>
                        {profilePhoto ? (
                            <Image source={{ uri: profilePhoto }} style={styles.profilePhotoImage} />
                        ) : (
                            <View style={[styles.profilePhotoPlaceholder, { backgroundColor: theme.gradientStart }]}>
                                <Text style={styles.profilePhotoPlaceholderText}>
                                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={[styles.profileName, { borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                        <Text style={[styles.profileNameText, { color: theme.text }]}>
                            {`${profile.name} ${profile.surname}`.trim() || 'No Name'}
                        </Text>
                        <Text style={[styles.profileUsername, { color: theme.secondaryText }]}>
                            {profile.username || 'No Username'}
                        </Text>
                    </View>
                    
                    <View style={styles.profileInfo}>
                        <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
                            <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>Age</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>
                                {profile.age || 'N/A'}
                            </Text>
                        </View>
                        <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
                            <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>Height</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>
                                {profile.height ? `${profile.height} cm` : 'N/A'}
                            </Text>
                        </View>
                        <View style={[styles.infoItem, { backgroundColor: theme.background }]}>
                            <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>Weight</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>
                                {profile.weight ? `${profile.weight} kg` : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.chartsSection}>
                    <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.chartTitle, { color: theme.text }]}>Steps in Last 7 Days</Text>
                        <BarChart
                            data={activityData.steps}
                            width={screenWidth - 80}
                            height={220}
                            chartConfig={chartConfig}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                            yAxisLabel=""
                            yAxisSuffix=""
                            showValuesOnTopOfBars
                        />
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.chartTitle, { color: theme.text }]}>Distance in Last 7 Days</Text>
                        <LineChart
                            data={activityData.distance}
                            width={screenWidth - 80}
                            height={220}
                            chartConfig={distanceChartConfig}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                            yAxisLabel=""
                            yAxisSuffix=" km"
                        />
                    </View>

                    <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.chartTitle, { color: theme.text }]}>Altitude Change in Last 7 Days</Text>
                        <LineChart
                            data={activityData.altitude}
                            width={screenWidth - 80}
                            height={220}
                            chartConfig={altitudeChartConfig}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                            yAxisLabel=""
                            yAxisSuffix=" m"
                        />
                    </View>
                </View>

                {errors && (
                    <View style={[styles.errorContainer, { backgroundColor: theme.errorBackground }]}>
                        <Text style={[styles.errorText, { color: theme.error }]}>{errors}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 8,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    logoutButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    profileCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    profilePhotoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profilePhotoImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 5,
        borderColor: '#667eea',
    },
    profilePhotoPlaceholder: {
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: '#667eea',
    },
    profilePhotoPlaceholderText: {
        fontSize: 64,
        fontWeight: '700',
        color: '#ffffff',
    },
    profileName: {
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    profileNameText: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    profileUsername: {
        fontSize: 18,
        fontWeight: '500',
    },
    profileInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    infoItem: {
        flex: 1,
        minWidth: '30%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    infoValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    chartsSection: {
        gap: 24,
    },
    chartCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    chartTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    errorContainer: {
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        borderWidth: 1,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    loginMessage: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
});

export default ProfileScreen;
