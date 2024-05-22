import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BiometricsCapture from './app/screens/BiometricsCapture';
import HomeScreen from './app/screens/HomeScreen'; 
import FaceIDScreen from './app/screens/FaceIdScreen'; 
import RegisterScreen from './app/screens/RegisterScreen';
import { UserProvider } from './src/context/UserContext'; 
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['exp://', 'yourapp://'],
  config: {
    screens: {
      Home: 'home',
      FaceID: 'faceid',
      BiometricsCapture: 'biometricscapture',
      Login: 'login',
      Register: 'register'
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
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      // Navigate to the screen specified in the notification data
      if (data && data.url) {
        Linking.openURL(data.url);
      } else if (data && data.withSome === 'data') {
        navigationRef.current?.navigate('BiometricsCapture');
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
          <Stack.Screen name="FaceID" component={FaceIDScreen}  options={{ title: 'FaceID' }}/>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
