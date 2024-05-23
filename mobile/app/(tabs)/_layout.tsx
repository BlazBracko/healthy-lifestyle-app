import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserContext } from '../context/userContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen'; 
import FaceIdScreen from '../screens/FaceIdScreen';

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const { user } = useContext(UserContext);

  return (
    <Tab.Navigator>
      {user ? (
        <>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="FaceId" component={FaceIdScreen} options={{ tabBarButton: () => null }} /> 
        </>

      ) : (
        // Tabs visible only when user is not logged in
        <>
          <Tab.Screen name="Login" component={LoginScreen} />
          <Tab.Screen name="Register" component={RegisterScreen} options={{ tabBarButton: () => null }} />
        </>
      )}
    </Tab.Navigator>
  );
}