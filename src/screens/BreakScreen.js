import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { startSecondInnings } from '../engine/actions/innings';
import { undoLastBallAndResume } from '../engine/actions/scoring';
import Topbar from '../components/Topbar';
import Button from '../components/Button';
import ScorecardBlock from '../components/ScorecardBlock';

export default function BreakScreen() {
  const state = useEngine();
  const { colors } = useTheme();
  const inn = state.data[1];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar showReset />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>Innings break</Text>
        <ScorecardBlock inn={inn} />
        <Text style={[styles.target, { color: colors.chalk }]}>
          {inn.bowlingName} need{' '}
          <Text style={[styles.targetValue, { color: colors.floodlight }]}>{state.target}</Text> runs
          to win from {state.overs} overs.
        </Text>
        <Button label="Start 2nd innings" onPress={startSecondInnings} />
        {inn.history.length > 0 ? (
          <Button
            label="Undo last ball (fix a mistake)"
            variant="panel"
            style={styles.undoBtn}
            onPress={undoLastBallAndResume}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
  },
  target: {
    fontFamily,
    fontSize: 14,
  },
  targetValue: {
    fontWeight: '700',
  },
  undoBtn: {
    marginTop: 4,
  },
});
