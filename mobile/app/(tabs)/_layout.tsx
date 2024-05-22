import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserContext } from '../context/userContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen'; 

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const { user } = useContext(UserContext);

  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      {user ? (
        <Tab.Screen name="Profile" component={ProfileScreen} />
      ) : (
        <Tab.Screen name="Login" component={LoginScreen} />
      )}
    </Tab.Navigator>
  );
}
