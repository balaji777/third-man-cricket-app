import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { newMatch } from '../engine/actions/innings';
import { startSuperOver, acceptTieAsResult } from '../engine/actions/superOver';
import Topbar from '../components/Topbar';
import Card from '../components/Card';
import Button from '../components/Button';
import { signOutUser } from '../auth/firebaseAuth';

// Ported from the source's renderSuperOverIntro(). Reached when the second
// innings finishes level -- checkInningsEnd/endInningsEarly route here
// instead of straight to 'result'.
export default function SuperOverIntroScreen() {
  const state = useEngine();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar
        showReset
        onReset={newMatch}
        showSignOut={!!state.user}
        onSignOut={signOutUser}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>Scores level!</Text>
        <Card style={styles.card}>
          <Text style={[styles.muted, { color: colors.chalk }]}>
            Both teams finished on{' '}
            <Text style={[styles.bold, { color: colors.floodlight }]}>{state.target - 1}</Text> runs.
          </Text>
          <Text style={[styles.winner, { color: colors.amber }]}>Match Tied</Text>
          <Text style={[styles.muted, { color: colors.chalk }]}>
            Play a Super Over to decide a winner, or leave it as a tie.
          </Text>
        </Card>
        <Button label="Start Super Over" onPress={startSuperOver} />
        <Button
          label="Accept the tie"
          variant="panel"
          style={styles.tieBtn}
          onPress={acceptTieAsResult}
        />
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
  card: {
    alignItems: 'center',
    gap: 8,
  },
  muted: {
    fontFamily,
    fontSize: 14,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
  },
  winner: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
  },
  tieBtn: {
    marginTop: -4,
  },
});
