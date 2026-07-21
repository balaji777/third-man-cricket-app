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
import SuperOverIntroScreen from './SuperOverIntroScreen';
import SuperOverScoringScreen from './SuperOverScoringScreen';
import SuperOverTiedAgainScreen from './SuperOverTiedAgainScreen';
import ResumePromptScreen from './ResumePromptScreen';
import LeaderboardScreen from './LeaderboardScreen';
import Toast from '../components/Toast';

// Mirrors the source render()'s if/else-if dispatch on state.screen.
// 'resumePrompt' has no source equivalent -- new in M10, see
// src/sync/resumeLiveMatch.js.
export default function ScreenSwitch() {
  const state = useEngine();
  return (
    <>
      {currentScreen(state)}
      <Toast message={state.toastMessage} />
    </>
  );
}

function currentScreen(state) {
  if (state.screen === 'authLoading') return <AuthLoadingScreen />;
  if (state.screen === 'login') return <LoginScreen />;
  if (state.screen === 'resumePrompt') return <ResumePromptScreen />;
  if (state.screen === 'setup') return <SetupScreen />;
  if (state.screen === 'scoring') return <ScoringScreen />;
  if (state.screen === 'break') return <BreakScreen />;
  if (state.screen === 'leaderboard') return <LeaderboardScreen />;
  if (state.screen === 'result') return <ResultScreen />;
  if (state.screen === 'superOverIntro') return <SuperOverIntroScreen />;
  if (state.screen === 'superOverScoring') return <SuperOverScoringScreen />;
  if (state.screen === 'superOverTiedAgain') return <SuperOverTiedAgainScreen />;

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
