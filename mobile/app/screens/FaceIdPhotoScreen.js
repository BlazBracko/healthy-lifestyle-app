import { CameraView, useCameraPermissions } from 'expo-camera';
import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Button, StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { UserContext } from '../context/userContext';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';

const FaceIdPhotoScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const { user } = useContext(UserContext);
  const [hasPermission, setHasPermission] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraReadyAt, setCameraReadyAt] = useState(0);
  const [hasAutoCaptured, setHasAutoCaptured] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (permission) {
      setHasPermission(permission.granted);
    } else {
      requestPermission();
    }
  }, [permission]);

  const takePicture = useCallback(async () => {
    if (!isCameraReady) return;

    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      console.log("Captured:", photo.uri);

      const formData = new FormData();
      formData.append("photo", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      });

      const response = await fetch(`${API_BASE_URL}/recognize/user/${user.username}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const json = await response.json();
        setResponse(json.is_match ? "Face match found" : "No face match found");

        setTimeout(() => {
          if (json.is_match) {
            // Navigate to Home tab
            navigation.navigate('Home');
          } else {
            navigation.navigate('Login');
          }
        }, 500);
      } else {
        Alert.alert("Recognition Error", "Server error during recognition.");
      }

    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isCameraReady, isProcessing]);

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing="front"
        onCameraReady={() => {
          console.log("CAMERA READY");
          setIsCameraReady(true);
          setCameraReadyAt(Date.now());
        }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={[styles.button, (!isCameraReady || isProcessing) && styles.buttonDisabled]}
            onPress={takePicture}
          >
            <Text style={styles.buttonText}>
              {!isCameraReady ? "Loading Camera..." : "Take Photo"}
            </Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  button: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  buttonDisabled: { opacity: 0.4 },
});

export default FaceIdPhotoScreen;
