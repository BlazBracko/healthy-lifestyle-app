import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Camera } from 'expo-camera/legacy';
import axios from 'axios';

const FaceIdScreen = () => {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    console.log(Camera);
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(cameraStatus.status === 'granted' && audioStatus.status === 'granted');
    })();
  }, []);

  const handleVideoRecording = async () => {
    if (cameraRef.current && !isRecording) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          mute: true,
          maxDuration: 10
        });
        console.log('Video recorded:', video.uri);
        uploadVideo(video.uri);
      } catch (error) {
        console.error('Recording error:', error);
        setIsRecording(false);
      }
    } else {
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const uploadVideo = async (uri) => {
    const formData = new FormData();
    formData.append('video', {
      uri,
      name: 'video.mp4',
      type: 'video/mp4',
    });

    try {

     
      const response = await fetch("http://192.168.1.85:3001/recognize", {
        method: 'POST',
        body: formData,
        credentials: "include",
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      if (response.ok) {
        const responseData = await response.json();
        console.log('Upload successful', responseData);
      } else {
        console.error(response);
        console.error('Upload failed:', await response.text());
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera or microphone.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        ref={cameraRef}
        type={Camera.Constants.Type.front}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleVideoRecording}
            onLongPress={handleVideoRecording}
            onPressOut={stopRecording}
          >
            <Text style={styles.text}>{isRecording ? 'Stop' : 'Record'}</Text>
          </TouchableOpacity>
        </View>
      </Camera>
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
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  button: {
    flex: 0.1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  }
});

export default FaceIdScreen;
