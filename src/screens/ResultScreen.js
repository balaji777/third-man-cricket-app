import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { matchResultText } from '../engine/helpers';
import { newMatch } from '../engine/actions/innings';
import { undoLastBallAndResume } from '../engine/actions/scoring';
import Topbar from '../components/Topbar';
import Card from '../components/Card';
import Button from '../components/Button';
import InningsCompactLine from '../components/InningsCompactLine';

// Ported from the source's renderResult(). Deferred to later phases (not
// rendered here): super-over summary card, Top performers, run-rate worm
// chart, share/PDF export buttons, and the leaderboard link.
export default function ResultScreen() {
  const state = useEngine();
  const { colors } = useTheme();
  const inn1 = state.data[1];
  const inn2 = state.data[2];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar showReset />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>Match result</Text>
        <Text style={[styles.winner, { color: colors.amber }]}>{matchResultText()}</Text>

        <InningsCompactLine inn={inn1} n={1} expanded={state.showInningsCard[1]} />
        <InningsCompactLine inn={inn2} n={2} expanded={state.showInningsCard[2]} />

        {state.manOfMatch ? (
          <Card style={styles.motmCard}>
            <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Player of the Match</Text>
            <Text style={[styles.motmName, { color: colors.amberInk }]}>{state.manOfMatch}</Text>
          </Card>
        ) : null}

        <Button label="New match" onPress={newMatch} />
        {inn2.history.length > 0 ? (
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
    marginBottom: -6,
  },
  winner: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
  },
  motmCard: {
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  motmName: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  undoBtn: {
    marginTop: 4,
  },
});
