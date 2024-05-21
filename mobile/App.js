import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BiometricsCapture from './src/screens/BiometricsCapture'; // Adjust the path as necessary
import HomeScreen from './src/screens/HomeScreen'; // Adjust the path as necessary
import FaceIDScreen from './src/screens/FaceIdScreen'; // Import your FaceID screen
import * as Permissions from 'expo-permissions';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['exp://', 'yourapp://'],
  config: {
    screens: {
      Home: 'home',
      FaceID: 'faceid',
      BiometricsCapture: 'biometricscapture'
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
    // Ask for notification permissions on iOS
    Permissions.getAsync(Permissions.NOTIFICATIONS).then(({ status }) => {
      if (status !== 'granted') {
        return Permissions.askAsync(Permissions.NOTIFICATIONS);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Handle notification received while the app is foregrounded
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
    <NavigationContainer linking={linking} ref={navigationRef}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="FaceID" component={FaceIDScreen} />
        <Stack.Screen name="BiometricsCapture" component={BiometricsCapture} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
