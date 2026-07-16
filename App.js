/**
 * Third Man — Cricket Scorer
 * React Native app entry point.
 */

import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { EngineProvider } from './src/engine/EngineProvider';
import ScreenSwitch from './src/screens/ScreenSwitch';
import OpenersPopup from './src/popups/OpenersPopup';

function AppContent() {
  const { colors, theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <ScreenSwitch />
      {/* Mounted globally (not inside a specific screen) since it appears
          right after both startMatch() and startSecondInnings(), on
          whatever screen state.screen has just become. */}
      <OpenersPopup />
    </SafeAreaView>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <EngineProvider>
          <AppContent />
        </EngineProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
