import React, { useContext, useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { UserContext } from '../context/userContext';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState('');
    const { user } = useContext(UserContext);
    const navigation = useNavigation();

    useEffect(() => {
        if (user) {
            axios.get(`http://192.168.1.85:3001/activities/user/${user.id}`)
                .then(response => {
                    setActivities(response.data);
                })
                .catch(error => {
                    setError('Failed to fetch activities');
                    console.error('Error fetching activities:', error);
                });
        }
    }, [user]);

    if (!user) return <Text>Please login to view your activities.</Text>;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Your Activities</Text>
            {activities.length > 0 ? (
                activities.map(activity => (
                  <TouchableOpacity
                  key={activity._id}
                  style={styles.activityContainer}
                  onPress={() => navigation.navigate('ShowActivity', { activityId: activity._id })}
              >
                  <Text style={styles.activityText}>
                      {activity.type} on {new Date(activity.startTime).toLocaleDateString()}
                  </Text>
              </TouchableOpacity>
                ))
            ) : (
                <Text>{error || 'No activities found.'}</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
    },
    title: {
        color: 'black',
        fontSize: 20,
        marginBottom: 20,
    },
    activityContainer: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        width: '100%',
    },
    activityText: {
        color: 'black',
    },
});

export default HomeScreen;
