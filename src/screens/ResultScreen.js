import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { matchResultText } from '../engine/helpers';
import { newMatch } from '../engine/actions/innings';
import { undoLastBallAndResume } from '../engine/actions/scoring';
import { soExtrasTotal } from '../engine/actions/superOver';
import Topbar from '../components/Topbar';
import Card from '../components/Card';
import Button from '../components/Button';
import InningsCompactLine from '../components/InningsCompactLine';
import { signOutUser } from '../auth/firebaseAuth';
import { openLeaderboard } from '../leaderboard/leaderboardSync';

// Ported from the source's renderResult(). Still deferred to later Phase 2
// milestones (not rendered here): Top performers, run-rate worm chart, and
// share/PDF export buttons.
export default function ResultScreen() {
  const state = useEngine();
  const { colors } = useTheme();
  const inn1 = state.data[1];
  const inn2 = state.data[2];
  const so = state.superOver;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar
        showReset
        onReset={newMatch}
        showSignOut={!!state.user}
        onSignOut={signOutUser}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>Match result</Text>
        <Text style={[styles.winner, { color: colors.amber }]}>{matchResultText()}</Text>

        {so && so.data[2] ? (
          <Card style={styles.soCard}>
            <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Super Over</Text>
            <SOResultLine inn={so.data[1]} />
            <SOResultLine inn={so.data[2]} last />
          </Card>
        ) : null}

        <InningsCompactLine inn={inn1} n={1} expanded={state.showInningsCard[1]} />
        <InningsCompactLine inn={inn2} n={2} expanded={state.showInningsCard[2]} />

        {state.manOfMatch ? (
          <Card style={styles.motmCard}>
            <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Player of the Match</Text>
            <Text style={[styles.motmName, { color: colors.amberInk }]}>{state.manOfMatch}</Text>
          </Card>
        ) : null}

        <Button label="New match" onPress={newMatch} />
        {!(state.user && state.user.isAnonymous) ? (
          <Button
            label="View Leaderboard"
            variant="panel"
            style={styles.leaderboardBtn}
            onPress={openLeaderboard}
          />
        ) : null}
        {inn2.history.length > 0 && !so ? (
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

function SOResultLine({ inn, last }) {
  const { colors } = useTheme();
  return (
    <View style={last ? styles.soLineLast : styles.soLine}>
      <View style={styles.soLineRow}>
        <Text style={[styles.soTeam, { color: colors.floodlight }]}>{inn.battingName}</Text>
        <Text style={[styles.soScore, { color: colors.floodlight }]}>
          {inn.runs}/{inn.wickets}
        </Text>
      </View>
      {inn.strikerName ? (
        <Text style={[styles.soMeta, { color: colors.chalk }]}>
          {inn.strikerName} & {inn.nonStrikerName} · {inn.bowlerName} bowling · extras{' '}
          {soExtrasTotal(inn)}
        </Text>
      ) : null}
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
  soCard: {
    gap: 0,
  },
  soLine: {
    marginBottom: 8,
  },
  soLineLast: {
    marginBottom: 0,
  },
  soLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  soTeam: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  soScore: {
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  soMeta: {
    fontFamily,
    fontSize: 11,
    marginTop: -2,
  },
  motmName: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  leaderboardBtn: {
    marginTop: 4,
  },
  undoBtn: {
    marginTop: 4,
  },
});
