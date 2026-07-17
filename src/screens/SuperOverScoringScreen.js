import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { newMatch } from '../engine/actions/innings';
import {
  curSOInnings,
  superOverAddRuns,
  superOverWicket,
  superOverUndo,
  openSOExtraPopup,
} from '../engine/actions/superOver';
import Topbar from '../components/Topbar';
import Card from '../components/Card';
import Button from '../components/Button';
import { ballStyle, ballTextColor } from '../components/ballDisplay';
import SONamesPopup from '../popups/SONamesPopup';
import SOExtraPopup from '../popups/SOExtraPopup';
import { signOutUser } from '../auth/firebaseAuth';

const EXTRAS = [
  { type: 'wd', label: 'Wide' },
  { type: 'nb', label: 'No ball' },
  { type: 'b', label: 'Bye' },
  { type: 'lb', label: 'Leg bye' },
];

// Ported from the source's renderSuperOverScoring(). Reuses the main
// scoring screen's run/extras/wicket button layout, but against the Super
// Over's flat runs/wickets/balls/log shape -- no over boundaries, no
// per-player batting/bowling cards (see freshSOInnings in
// engine/actions/superOver.js).
export default function SuperOverScoringScreen() {
  const state = useEngine();
  const { colors } = useTheme();
  const so = state.superOver;
  const inn = curSOInnings();

  const ballsLeft = Math.max(6 - inn.balls, 0);
  const runsNeeded = so.inningsNum === 2 ? Math.max(so.target - inn.runs, 0) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar
        showReset
        onReset={newMatch}
        showSignOut={!!state.user}
        onSignOut={signOutUser}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>
          Super Over{so.round > 1 ? ` (${so.round})` : ''}
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.team, { color: colors.chalk }]}>{inn.battingName} batting</Text>
          <Text style={[styles.score, { color: colors.amber }]}>
            {inn.runs}
            <Text style={styles.wickets}>/{inn.wickets}</Text>
          </Text>
          <Text style={[styles.meta, { color: colors.chalk }]}>Ball {inn.balls} / 6</Text>
          {inn.namesConfirmed ? (
            <Text style={[styles.meta, { color: colors.chalk }]}>
              {inn.strikerName} & {inn.nonStrikerName} · {inn.bowlerName} bowling
            </Text>
          ) : null}
          {so.inningsNum === 2 ? (
            <Text style={[styles.target, { color: colors.floodlight }]}>
              Need <Text style={styles.bold}>{runsNeeded}</Text> off{' '}
              <Text style={styles.bold}>{ballsLeft}</Text> balls
            </Text>
          ) : null}
          <View style={styles.ticker}>
            {inn.log.map((b, i) => (
              <View key={i} style={[styles.ball, ballStyle(b, colors)]}>
                <Text style={[styles.ballText, { color: ballTextColor(b, colors) }]}>{b}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Runs off this ball</Text>
        <View style={styles.row}>
          {[0, 1, 2].map(n => (
            <Button
              key={n}
              label={String(n)}
              variant="panel"
              style={styles.btn}
              onPress={() => superOverAddRuns(n)}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Button label="3" variant="panel" style={styles.btn} onPress={() => superOverAddRuns(3)} />
          <Button label="4" variant="amber" style={styles.btn} onPress={() => superOverAddRuns(4)} />
          <Button label="6" variant="red" style={styles.btn} onPress={() => superOverAddRuns(6)} />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Extras</Text>
        <View style={styles.extrasRow}>
          {EXTRAS.map(e => (
            <Button
              key={e.type}
              label={e.label}
              variant="ghost"
              style={styles.extraBtn}
              onPress={() => openSOExtraPopup(e.type)}
            />
          ))}
        </View>

        <Button label="Wicket" variant="red" onPress={superOverWicket} />
        <Button label="Undo" variant="panel" onPress={superOverUndo} />
      </ScrollView>

      <SONamesPopup />
      <SOExtraPopup />
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
  card: {
    alignItems: 'flex-start',
    gap: 4,
  },
  team: {
    fontFamily,
    fontSize: 13,
  },
  score: {
    fontFamily,
    fontSize: 40,
    fontWeight: '700',
  },
  wickets: {
    fontSize: 22,
  },
  meta: {
    fontFamily,
    fontSize: 13,
  },
  target: {
    fontFamily,
    fontSize: 15,
    marginTop: 6,
  },
  bold: {
    fontWeight: '700',
  },
  ticker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  ball: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballText: {
    fontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionLabel: {
    fontFamily,
    fontSize: 13,
    marginTop: 4,
    marginBottom: -4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  btn: {
    flex: 1,
  },
  extrasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  extraBtn: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
