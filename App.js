/**
 * Third Man — Cricket Scorer
 * React Native app entry point.
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, StyleSheet, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { EngineProvider } from './src/engine/EngineProvider';
import { setState } from './src/engine/state';
import { setPersistHook, setClearHook } from './src/engine/store';
import { loadMatchState, saveMatchState, clearSavedMatch } from './src/persistence/matchStorage';
import ScreenSwitch from './src/screens/ScreenSwitch';

function AppContent() {
  const { colors, theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      <ScreenSwitch />
    </SafeAreaView>
  );
}

function App() {
  // AsyncStorage is inherently async (unlike the source's localStorage), so
  // the resume check has to be awaited once before the first real render --
  // otherwise the app would flash 'setup' before jumping to the resumed
  // screen. setPersistHook wires store.commit() to save after every action
  // from here on, matching the source's save-on-every-render.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPersistHook(saveMatchState);
    setClearHook(clearSavedMatch);
    loadMatchState().then(loaded => {
      if (loaded) setState(loaded);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <View style={styles.loading} />;
  }

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
  loading: {
    flex: 1,
    backgroundColor: '#0E1A15',
  },
});

export default App;
