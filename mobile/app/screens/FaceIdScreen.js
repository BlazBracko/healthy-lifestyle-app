import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import axios from 'axios';

const FaceIdScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);

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
      let photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      const data = new FormData();
      data.append('photo', {
        uri: photo.uri,
        name: 'photo.jpg',
        type: 'image/jpg'
      });

      // Pošlji sliko na strežnik
      axios.post('http://your-server-ip:3000/api/recognize', data)
        .then(response => {
          console.log(response.data);
        })
        .catch(error => {
          console.error(error);
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
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.buttonContainer}>
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
});

export default FaceIdScreen;
