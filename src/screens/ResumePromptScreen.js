import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { confirmResumeLiveMatch, declineResumeLiveMatch } from '../sync/resumeLiveMatch';
import Card from '../components/Card';
import Button from '../components/Button';

// New surface, not in the source -- js/app.js scaffolded live match sync
// but never built the cross-device resume prompt itself (per its own
// commit message: "the actual cross-device resume prompt ... is a
// follow-up"). Shown when sign-in finds an in-progress match synced from
// another device and this device has no local match of its own to resume
// instead (see firebaseAuth.js's initAuthListener).
export default function ResumePromptScreen() {
  const state = useEngine();
  const { colors } = useTheme();
  const doc = state.pendingLiveMatch;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>Resume in-progress match?</Text>
        <Card style={styles.card}>
          <Text style={[styles.muted, { color: colors.chalk }]}>
            {doc.teamA} vs {doc.teamB} looks like it's still in progress on another device.
          </Text>
        </Card>
        <Button label="Resume match" onPress={confirmResumeLiveMatch} />
        <Button
          label="Start fresh instead"
          variant="panel"
          style={styles.declineBtn}
          onPress={declineResumeLiveMatch}
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
  },
  muted: {
    fontFamily,
    fontSize: 14,
    textAlign: 'center',
  },
  declineBtn: {
    marginTop: -4,
  },
});
