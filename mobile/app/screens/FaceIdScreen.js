import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Button, StyleSheet, Text, View, Pressable } from 'react-native';
import axios from 'axios';

const FaceIdScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null); // Novo stanje za napake

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
      axios.post('http://164.8.207.119:3001/recognize', data)
        .then(response => {
          console.log('Server response:', response.data);
          setResponse(response.data);  // Shranjevanje odgovora v stanje
          setError(null); // Počistite napako, če je klic uspešen
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

export default FaceIdScreen;
