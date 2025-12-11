import React, { useRef, useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { UserContext } from '../context/userContext';
import { API_BASE_URL } from '../config/api';
import { useNavigation } from '@react-navigation/native';

const FaceIdScreen = () => {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraReadyAt, setCameraReadyAt] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    if (!cameraPermission) {
      requestCameraPermission();
    }
    if (!microphonePermission) {
      requestMicrophonePermission();
    }
  }, [cameraPermission, microphonePermission]);

  const handleVideoRecording = async () => {
    // Prevent starting twice or before ready
    if (!cameraRef.current) {
      console.log('Camera ref missing');
      return;
    }

    // Require camera ready for at least 1500ms to avoid Expo race
    const now = Date.now();
    if (!isCameraReady || now - cameraReadyAt < 1500) {
      console.log('Camera is not ready yet, waiting...');
      return;
    }

    // Toggle stop
    if (isRecording) {
      stopRecording();
      return;
    }

    setIsRecording(true);
    try {
      // Extra settling time right before record
      await new Promise(resolve => setTimeout(resolve, 500));

      const video = await cameraRef.current.recordAsync({
        mute: true,
        maxDuration: 2
      });
      console.log('Video recorded:', video.uri);
      uploadVideo(video.uri);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Recording Error', 'Failed to record video. Please wait a moment and try again.');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const uploadVideo = async (uri) => {
    if (!user || !user.username) {
      Alert.alert('Error', 'User information not available. Please try again.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading video...');
    
    const formData = new FormData();
    formData.append('video', {
      uri,
      name: 'video.mp4',
      type: 'video/mp4',
    });

    try {
      console.log('Uploading video for user:', user.username);
      const response = await fetch(`${API_BASE_URL}/recognize/${user.username}`, {
        method: 'POST',
        body: formData,
        credentials: "include",
        headers: {
          // Don't set Content-Type for FormData - let the browser set it with boundary
        },
      });
  
      if (response.ok) {
        const responseData = await response.json();
        console.log('Upload successful', responseData);
        setUploadStatus('Video processed successfully!');
        
        // Navigate to Home after successful FaceID setup
        setTimeout(() => {
          navigation.navigate('Home');
        }, 1500);
      } else {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        setUploadStatus('Upload failed. Please try again.');
        Alert.alert('Upload Failed', 'Failed to process video. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Network error. Please check your connection.');
      Alert.alert('Error', 'Failed to upload video. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!cameraPermission || !microphonePermission) {
    return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera or microphone.</Text>
        {!cameraPermission.granted && (
          <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
            <Text style={styles.text}>Grant Camera Permission</Text>
          </TouchableOpacity>
        )}
        {!microphonePermission.granted && (
          <TouchableOpacity style={styles.button} onPress={requestMicrophonePermission}>
            <Text style={styles.text}>Grant Microphone Permission</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing="front"
        mode="video"
        onCameraReady={() => {
          console.log('Camera is ready');
          // Add a longer delay to ensure camera is fully initialized
          setTimeout(() => {
            setCameraReadyAt(Date.now());
            setIsCameraReady(true);
            console.log('Camera fully initialized');
          }, 800);
        }}
      />
      <View style={styles.buttonContainer}>
        {isUploading ? (
          <View style={styles.uploadContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.statusText}>{uploadStatus}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, (!isCameraReady || isUploading) && styles.buttonDisabled]}
            onPress={handleVideoRecording}
            disabled={!isCameraReady || isUploading}
          >
            <Text style={styles.text}>
              {isRecording ? 'Recording...' : isCameraReady ? 'Record Video' : 'Loading Camera...'}
            </Text>
          </TouchableOpacity>
        )}
        {uploadStatus && !isUploading && (
          <Text style={styles.statusText}>{uploadStatus}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 30,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  uploadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  }
});

export default FaceIdScreen;