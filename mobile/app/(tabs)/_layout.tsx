import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserContext } from '../context/userContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen'; 
import EditProfileScreen from '../screens/EditProfileScreen'; 
import FaceIdScreen from '../screens/FaceIdScreen';
import FaceIdPhotoScreen from '../screens/FaceIdPhotoScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ActivityTrackingScreen from '../screens/ActivityTrackingScreen';
import ShowActivity from '../screens/ShowActivityScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';

const Tab = createBottomTabNavigator();

export default function Tabs() {
  const { user } = useContext(UserContext);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'help-circle-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'New Activity') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Login') {
            iconName = 'log-in-outline';
          }

          return <Icon name={iconName} size={focused ? 26 : 24} color={color} />;
        },
        tabBarActiveTintColor: theme.gradientStart,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarStyle: user ? {
          backgroundColor: theme.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          paddingHorizontal: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        } : { display: 'none' },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        headerShown: false,
      })}
    >
      {user ? (
        <>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Login" component={LoginScreen} options={{ tabBarButton: () => null }}/>
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ }}/>
          <Tab.Screen name="EditProfile" component={EditProfileScreen} options={{ tabBarButton: () => null }} /> 
          <Tab.Screen name="New Activity" component={ActivityScreen} />
          <Tab.Screen name="ActivityTracking" component={ActivityTrackingScreen} options={{ tabBarButton: () => null }} /> 
          <Tab.Screen name="FaceIdVideo" component={FaceIdScreen} options={{ tabBarButton: () => null }} />
          <Tab.Screen name="FaceIdPhoto" component={FaceIdPhotoScreen} options={{ tabBarButton: () => null }} />
          <Tab.Screen name="ShowActivity" component={ShowActivity} options={{ tabBarButton: () => null }} /> 
        </>
      ) : (
        // Tabs visible only when user is not logged in
        <>
          <Tab.Screen name="Login" component={LoginScreen} options={{ tabBarButton: () => null }}/>
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarButton: () => null }}/>
          <Tab.Screen name="Register" component={RegisterScreen} options={{ tabBarButton: () => null }} />
          <Tab.Screen name="FaceIdVideo" component={FaceIdScreen} options={{ tabBarButton: () => null }} /> 
        </>
      )}
    </Tab.Navigator>
  );
}
