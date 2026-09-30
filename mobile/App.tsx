import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { HealthScreen } from './src/features/health/HealthScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <HealthScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
