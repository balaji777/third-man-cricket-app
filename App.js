/**
 * Third Man — Cricket Scorer
 * React Native app entry point.
 */

import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { fontFamily } from './src/theme/typography';
import Button from './src/components/Button';
import Card from './src/components/Card';
import Chip from './src/components/Chip';
import NumPad from './src/components/NumPad';
import Topbar from './src/components/Topbar';

function AppContent() {
  const { colors, theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <Topbar showReset showSignOut onSignOut={() => {}} onReset={() => {}} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.section}>
          <Text style={[styles.heading, { color: colors.floodlight }]}>M1 primitives preview</Text>
          <View style={styles.row}>
            <Button label="4" variant="amber" style={styles.flexBtn} />
            <Button label="6" variant="red" style={styles.flexBtn} />
            <Button label="Wide" variant="ghost" style={styles.flexBtn} />
          </View>
          <View style={styles.row}>
            <Chip label="Ravi" />
            <Chip label="Suresh" active />
            <Chip label="Arjun" />
          </View>
          <NumPad onSelect={() => {}} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  heading: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  flexBtn: {
    flex: 1,
  },
});

export default App;
