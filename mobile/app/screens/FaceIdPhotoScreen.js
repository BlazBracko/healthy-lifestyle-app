import { CameraView, useCameraPermissions } from 'expo-camera';
import { useContext } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { UserContext } from '../context/userContext';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const FaceIdPhotoScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const { user } = useContext(UserContext);
  const [hasPermission, setHasPermission] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      if (!permission) {
        const { status } = await requestPermission();
        setHasPermission(status === 'granted');
      } else {
        setHasPermission(permission.granted);
      }
    })();
  }, [permission]);

  useEffect(() => {
    if (hasPermission) {
      // Zamika zajema slike za 5 sekund
      const timer = setTimeout(() => {
        takePicture();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [hasPermission]);

  const takePicture = async () => {
    if (cameraRef.current) {
      console.log('Taking picture...');
      let photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      console.log('Picture taken:', photo);

      const data = new FormData();
      data.append('photo', {
        uri: photo.uri,
        name: 'photo.jpg',
        type: 'image/jpg'
      });

      console.log('Sending picture to server...');
      // Pošlji sliko na strežnik
      axios.post(`https://mallard-set-akita.ngrok-free.app/recognize/user/${user.username}`, data)
        .then(response => {
          const matchFound = response.data.is_match;
          setResponse(matchFound ? "Face match found" : "No face match found");
          setError(null);  // Clear any previous errors

          if (response.data.is_match) {
            navigation.navigate('Home');  // Navigacija na Home stran
          } else {
            navigation.navigate('Login'); // Navigacija na Login stran
          }
        })
        .catch(error => {
          console.error('Error sending picture:', error);
          setError(error.message); // Shranjevanje napake v stanje
        });
    }
  };

  if (!permission || !hasPermission) {
    // Camera permissions are still loading or not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        {!hasPermission && <Button onPress={requestPermission} title="grant permission" />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="front">
        <View style={styles.buttonContainer}>
          {/* Prikaz JSON odgovora */}
          {response && (
            <View style={styles.responseContainer}>
              <Text style={styles.text}>Response:</Text>
              <Text style={styles.text}>{JSON.stringify(response, null, 2)}</Text>
            </View>
          )}
          {/* Prikaz napake */}
          {error && (
            <View style={styles.responseContainer}>
              <Text style={styles.text}>Error:</Text>
              <Text style={styles.text}>{error}</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  responseContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
});

export default FaceIdPhotoScreen;