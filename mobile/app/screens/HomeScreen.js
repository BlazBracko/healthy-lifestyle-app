import React, { useContext, useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import axios from 'axios';
import { UserContext } from '../context/userContext';  // Make sure this path correctly points to your context file

const HomeScreen = () => {
  const [message, setMessage] = useState('');
  const { user } = useContext(UserContext);  // Correctly use useContext here

  useEffect(() => {
    axios.get('http://192.168.1.220:3001/')
      .then(response => {
        setMessage(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);
 // dopolnimo za user sessione
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white'  // Changed 'color' to 'backgroundColor' because 'color' is not a valid style property for View
  },
  title:{
    color: 'white'
  }
});

export default HomeScreen;
