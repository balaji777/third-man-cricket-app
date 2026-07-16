import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import SetupScreen from './SetupScreen';
import ScoringScreen from './ScoringScreen';
import BreakScreen from './BreakScreen';
import ResultScreen from './ResultScreen';
import AuthLoadingScreen from './AuthLoadingScreen';
import LoginScreen from './LoginScreen';

// Mirrors the source render()'s if/else-if dispatch on state.screen. Screens
// out of Phase 1 scope (super overs, leaderboard) fall back to a
// placeholder so navigating past them is verifiable before they exist.
export default function ScreenSwitch() {
  const state = useEngine();

  if (state.screen === 'authLoading') return <AuthLoadingScreen />;
  if (state.screen === 'login') return <LoginScreen />;
  if (state.screen === 'setup') return <SetupScreen />;
  if (state.screen === 'scoring') return <ScoringScreen />;
  if (state.screen === 'break') return <BreakScreen />;
  if (state.screen === 'result') return <ResultScreen />;

  return <UnbuiltScreenPlaceholder screen={state.screen} />;
}

function UnbuiltScreenPlaceholder({ screen }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.chalk }]}>Screen not yet built: {screen}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily,
    fontSize: 16,
  },
});
