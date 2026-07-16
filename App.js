/**
 * Third Man — Cricket Scorer
 * React Native app entry point.
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0E1A15" />
      <View style={styles.container}>
        <Text style={styles.title}>Third Man</Text>
        <Text style={styles.subtitle}>Cricket Scorer</Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1A15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F3F5EF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#93A69C',
    fontSize: 16,
    marginTop: 4,
  },
});

export default App;
