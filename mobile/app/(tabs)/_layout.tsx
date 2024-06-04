import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserContext } from '../context/userContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen'; 
import EditProfileScreen from '../screens/EditProfileScreen'; 
import FaceIdScreen from '../screens/FaceIdScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ActivityTrackingScreen from '../screens/ActivityTrackingScreen';
import ShowActivity from '../screens/ShowActivityScreen';
import Icon from 'react-native-vector-icons/Ionicons'; // Importing Ionicons

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const { user } = useContext(UserContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = 'person-outline';
          } else if (route.name === 'New Activity') {
            iconName = 'add-circle-outline';
          } else if (route.name === 'Login') {
            iconName = 'log-in-outline';
          }

          // You can return any component that you like here!
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      {user ? (
        <>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ }}/>
          <Tab.Screen name="EditProfile" component={EditProfileScreen} options={{ tabBarButton: () => null }} /> 
          <Tab.Screen name="New Activity" component={ActivityScreen} />
          <Tab.Screen name="ActivityTracking" component={ActivityTrackingScreen} options={{ tabBarButton: () => null }} /> 
          <Tab.Screen name="FaceId" component={FaceIdScreen} options={{ tabBarButton: () => null }} /> 
          <Tab.Screen name="ShowActivity" component={ShowActivity} options={{ tabBarButton: () => null }} /> 
        </>
      ) : (
        // Tabs visible only when user is not logged in
        <>
          <Tab.Screen name="Login" component={LoginScreen}/>
          <Tab.Screen name="Register" component={RegisterScreen} options={{ tabBarButton: () => null }} />
        </>
      )}
    </Tab.Navigator>
  );
}
