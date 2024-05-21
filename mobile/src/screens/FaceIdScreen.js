import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

const FaceIDScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Welcome to the Face ID Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FaceIDScreen;
