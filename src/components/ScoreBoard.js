import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { oversStr, rate, currentBowler, inPowerplay } from '../engine/helpers';
import { updateWicketsLimit } from '../engine/actions/innings';
import Card from './Card';
import { ballStyle, ballTextColor } from './ballDisplay';

// Mirrors the source's scoreboard block: team/score, overs/CRR, wickets-limit
// inline editor, target/RRR (innings 2 only), powerplay banner, and the
// current-over ball ticker.
export default function ScoreBoard({ state, inn }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;
  const lastScoreKey = useRef(inn.runs + '/' + inn.wickets);

  // Pulses the score whenever runs or wickets change (a run, a wicket, or an
  // undo) -- skipped on the innings' first render so switching to a fresh
  // innings doesn't pulse from 0/0.
  useEffect(() => {
    const key = inn.runs + '/' + inn.wickets;
    if (lastScoreKey.current === key) return;
    lastScoreKey.current = key;
    pulse.setValue(1.16);
    Animated.spring(pulse, {
      toValue: 1,
      speed: 14,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }, [inn.runs, inn.wickets, pulse]);

  let target = null;
  if (state.inningsNum === 2 && state.target !== null) {
    const ballsLeft = state.overs * 6 - inn.legalBalls;
    const runsNeeded = state.target - inn.runs;
    const rrr = ballsLeft > 0 ? (runsNeeded / (ballsLeft / 6)).toFixed(2) : '0.00';
    target = {
      runsNeeded: Math.max(runsNeeded, 0),
      ballsLeft: Math.max(ballsLeft, 0),
      rrr,
    };
  }

  const pp = inPowerplay(inn);
  const ppBallsLeft = pp ? state.powerplayOvers * 6 - inn.legalBalls : 0;

  return (
    <Card style={styles.card}>
      <Text style={[styles.team, { color: colors.chalk }]}>{inn.battingName} batting</Text>
      <Animated.Text
        style={[styles.score, { color: colors.amber, transform: [{ scale: pulse }] }]}
      >
        {inn.runs}
        <Text style={styles.wickets}>/{inn.wickets}</Text>
      </Animated.Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.chalk }]}>
          OV {oversStr(inn.legalBalls)} / {state.overs}
        </Text>
        <Text style={[styles.meta, { color: colors.chalk }]}>CRR {rate(inn.runs, inn.legalBalls)}</Text>
      </View>
      <View style={styles.wicketsLimitRow}>
        <Text style={[styles.meta, { color: colors.chalk }]}>Wickets limit </Text>
        <TextInput
          defaultValue={String(state.wicketsLimit)}
          style={[
            styles.wicketsInput,
            { color: colors.floodlight, borderColor: colors.line, backgroundColor: colors.panel2 },
          ]}
          keyboardType="number-pad"
          onEndEditing={e => updateWicketsLimit(e.nativeEvent.text)}
        />
      </View>

      {target ? (
        <>
          <Text style={[styles.target, { color: colors.floodlight }]}>
            Need <Text style={styles.bold}>{target.runsNeeded}</Text> off{' '}
            <Text style={styles.bold}>{target.ballsLeft}</Text> balls · target{' '}
            <Text style={styles.bold}>{state.target}</Text>
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: colors.chalk }]}>Required RR {target.rrr}</Text>
            <Text style={[styles.meta, { color: colors.chalk }]}>
              Current RR {rate(inn.runs, inn.legalBalls)}
            </Text>
          </View>
        </>
      ) : null}

      {pp ? (
        <View style={[styles.ppBanner, { backgroundColor: colors.teal }]}>
          <Text style={styles.ppText}>POWERPLAY · {oversStr(ppBallsLeft)} overs left</Text>
        </View>
      ) : null}

      <View style={styles.ticker}>
        {inn.thisOver.length === 0 ? (
          <Text style={[styles.tickerHint, { color: colors.chalkDim }]}>
            New over — {currentBowler(inn).name} to bowl
          </Text>
        ) : (
          inn.thisOver.map((b, i) => <BallChip key={i} b={b} colors={colors} />)
        )}
      </View>
    </Card>
  );
}

// Pops in once when it first mounts. Keyed by index in the parent, so only
// the newly-appended ball at the end of the over ever mounts fresh -- prior
// balls keep their identity and don't replay the animation on every commit.
function BallChip({ b, colors }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      speed: 18,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  return (
    <Animated.View
      style={[styles.ball, ballStyle(b, colors), { opacity: pop, transform: [{ scale: pop }] }]}
    >
      <Text style={[styles.ballText, { color: ballTextColor(b, colors) }]}>{b}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
  },
  team: {
    fontFamily,
    fontSize: 13,
    marginBottom: 2,
  },
  score: {
    fontFamily,
    fontSize: 40,
    fontWeight: '700',
  },
  wickets: {
    fontSize: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  meta: {
    fontFamily,
    fontSize: 13,
  },
  wicketsLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  wicketsInput: {
    fontFamily,
    fontSize: 12,
    width: 44,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  target: {
    fontFamily,
    fontSize: 15,
    marginTop: 10,
  },
  bold: {
    fontWeight: '700',
  },
  ppBanner: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  ppText: {
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tickerHint: {
    fontFamily,
    fontSize: 11,
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
});
