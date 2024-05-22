import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { UserContext } from '../context/userContext';

const ProfileScreen = () => {
  const { user, logout } = useContext(UserContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <View>
          <Text style={styles.userInfo}>Welcome, {user.username}!</Text>
          <Button title="Logout" onPress={logout} />
        </View>
      ) : (
        <Text style={styles.userInfo}>No user data available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    fontSize: 18,
    marginVertical: 10,
  },
});

export default ProfileScreen;
