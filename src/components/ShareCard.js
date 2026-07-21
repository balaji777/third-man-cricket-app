import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily } from '../theme/typography';
import { oversStr, matchResultText, bestBatting, bestBowling } from '../engine/helpers';

// Ported from the source's buildShareCanvas(), which hand-drew this same
// layout onto a <canvas> with ctx.fillText -- M14 captures this real RN view
// with react-native-view-shot instead (see export/shareImage.js), so it's a
// plain component rather than pixel-by-pixel canvas drawing.
//
// Colors are fixed (not theme-reactive): a shareable result image should
// look the same regardless of the viewer's own light/dark app preference,
// matching the source's canvas, which never varied by state.theme either.
// The source's linear gradient background is simplified to a solid color --
// a gradient would need another native dependency (react-native-linear-
// gradient) for a subtle effect not worth the extra native module.
const CARD = {
  bg: '#0E1A15',
  floodlight: '#F3F5EF',
  amber: '#F5B24A',
  teal: '#3FB2A3',
  chalk: '#9FB0A8',
  chalkDim: '#5C6B62',
  resultBg: 'rgba(245,178,74,0.15)',
};

export default function ShareCard({ state }) {
  const inn1 = state.data[1];
  const inn2 = state.data[2];
  const bb = bestBatting();
  const bwl = bestBowling();

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>MATCH RESULT</Text>

      <Text style={styles.team}>{inn1.battingName}</Text>
      <Text style={[styles.score, { color: CARD.amber }]}>
        {inn1.runs}/{inn1.wickets}
      </Text>
      <Text style={styles.overs}>({oversStr(inn1.legalBalls)} overs)</Text>

      <Text style={styles.vs}>vs</Text>

      <Text style={styles.team}>{inn2.battingName}</Text>
      <Text style={[styles.score, { color: CARD.teal }]}>
        {inn2.runs}/{inn2.wickets}
      </Text>
      <Text style={styles.overs}>({oversStr(inn2.legalBalls)} overs)</Text>

      <View style={styles.resultBanner}>
        <Text style={styles.resultText}>{matchResultText()}</Text>
      </View>

      {state.manOfMatch ? (
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>PLAYER OF THE MATCH</Text>
          <Text style={styles.statValue}>{state.manOfMatch}</Text>
        </View>
      ) : null}

      {bb ? (
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>BEST BATTING</Text>
          <Text style={styles.statValue}>
            {bb.name} — {bb.runs} ({bb.balls})
          </Text>
        </View>
      ) : null}

      {bwl ? (
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>BEST BOWLING</Text>
          <Text style={styles.statValue}>
            {bwl.name} — {bwl.wickets}/{bwl.runs}
          </Text>
        </View>
      ) : null}

      <Text style={styles.footer}>Scored with Third Man</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: CARD.bg,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  eyebrow: {
    fontFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: CARD.amber,
    marginBottom: 18,
  },
  team: {
    fontFamily,
    fontSize: 17,
    fontWeight: '700',
    color: CARD.floodlight,
  },
  score: {
    fontFamily: 'monospace',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 4,
  },
  overs: {
    fontFamily,
    fontSize: 11,
    color: CARD.chalk,
    marginBottom: 8,
  },
  vs: {
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: CARD.floodlight,
    marginVertical: 6,
  },
  resultBanner: {
    width: '100%',
    backgroundColor: CARD.resultBg,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  resultText: {
    fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: CARD.amber,
    textAlign: 'center',
  },
  statBlock: {
    alignItems: 'center',
    marginTop: 20,
  },
  statLabel: {
    fontFamily,
    fontSize: 10,
    color: CARD.chalk,
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: CARD.floodlight,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    fontFamily,
    fontSize: 10,
    color: CARD.chalkDim,
    marginTop: 24,
  },
});
