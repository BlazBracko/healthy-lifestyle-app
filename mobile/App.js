import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './app/screens/HomeScreen'; 
import FaceIdScreen from './app/screens/FaceIdScreen'; 
import FaceIdPhotoScreen from './app/screens/FaceIdPhotoScreen'; 
import ActivityScreen from './app/screens/ActivityScreen'; 
import ActivityTrackingScreen from './app/screens/ActivityTrackingScreen'; 
import RegisterScreen from './app/screens/RegisterScreen';
import ShowActivity from './app/screens/ShowActivityScreen';
import { UserProvider } from './src/context/UserContext'; 
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['exp://', 'myapp://'],
  config: {
    screens: {
      Home: 'home',
      FaceIdVideo: 'faceidvideo',
      FaceIdPhoto: 'faceidphoto',
      Login: 'login',
      Register: 'register',
      Activity: 'activity'
    },
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigationRef = useRef();

  useEffect(() => {
    // Ask for notification permissions on iOS and Android
    Notifications.requestPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Handle notification received while the app is foregrounded
      console.log('Notification received:', notification);
      console.log('Notification data:', notification.request.content.data);

    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.warn("delojepacdelo");
      const { data } = response.notification.request.content;
      console.log(data.url)
      if (data.url) {
          Linking.openURL(data.url); // This will trigger the navigation based on your linking config
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <UserProvider>
      <NavigationContainer linking={linking} ref={navigationRef}>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen}  options={{ title: 'Home' }}/>
          <Stack.Screen name="FaceIdVideo" component={FaceIdScreen}  options={{ title: 'FaceIdVideo' }}/>
          <Stack.Screen name="FaceIdPhoto" component={FaceIdPhotoScreen}  options={{ title: 'FaceIdPhoto' }}/>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
          <Stack.Screen name="Activity" component={ActivityScreen} options={{ title: 'Activity' }} />
          <Stack.Screen name="ActivityTracking" component={ActivityTrackingScreen} options={{ title: 'ActivityTracking' }} />
          <Stack.Screen name="ShowActivity" component={ShowActivity} options={{ title: 'ShowActivity' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
