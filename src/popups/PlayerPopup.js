import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { curInnings } from '../engine/state';
import Button from '../components/Button';
import Chip from '../components/Chip';
import ModalShell from '../components/ModalShell';
import { confirmOverSummary, confirmBatsmanPopup, setNextBowler, priorBowlerNames } from '../engine/actions/popupQueue';

// Handles the 3 queued popup types built by afterBall() -- 'openers' is a
// separate always-mounted component (OpenersPopup) since it isn't part of
// the queue.
export default function PlayerPopup() {
  const state = useEngine();
  const type = state.playerPopup ? state.playerPopup.type : null;
  const visible = type === 'batsman' || type === 'overSummary' || type === 'bowler';

  if (!visible) return null;
  if (type === 'batsman') return <BatsmanPopup />;
  if (type === 'overSummary') return <OverSummaryPopup popup={state.playerPopup} />;
  return <BowlerPopup />;
}

function BatsmanPopup() {
  const state = useEngine();
  const { colors } = useTheme();
  const inn = curInnings();
  const [name, setName] = useState('');

  useEffect(() => {
    setName('Batsman ' + inn.nextBatNum);
  }, [inn.nextBatNum]);

  return (
    <ModalShell visible title="Wicket!">
      <Text style={[styles.subtitle, { color: colors.chalk }]}>Who is coming in to bat?</Text>
      <Text style={[styles.label, { color: colors.chalk }]}>New batsman</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Batsman name"
        placeholderTextColor={colors.chalkDim}
        style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
      />
      {state.playerPopupError ? (
        <Text style={[styles.error, { color: colors.red }]}>{state.playerPopupError}</Text>
      ) : null}
      <Button label="Confirm" style={styles.confirmBtn} onPress={() => confirmBatsmanPopup(name)} />
    </ModalShell>
  );
}

function OverSummaryPopup({ popup }) {
  const { colors } = useTheme();
  return (
    <ModalShell visible title="Over complete">
      <Text style={[styles.overRuns, { color: colors.floodlight }]}>
        {popup.overRuns}
        <Text style={[styles.overRunsLabel, { color: colors.chalk }]}>
          {'\n'}run{popup.overRuns === 1 ? '' : 's'} this over
        </Text>
      </Text>
      <Text style={[styles.subtitle, { color: colors.chalk }]}>
        Total score:{' '}
        <Text style={[styles.bold, { color: colors.floodlight }]}>
          {popup.totalScore}/{popup.totalWkts}
        </Text>
      </Text>
      <Button label="Continue" style={styles.confirmBtn} onPress={confirmOverSummary} />
    </ModalShell>
  );
}

function BowlerPopup() {
  const state = useEngine();
  const { colors } = useTheme();
  const inn = curInnings();
  const [name, setName] = useState('');
  const priors = priorBowlerNames(inn);

  useEffect(() => {
    setName('');
  }, [inn.overHistory.length]);

  return (
    <ModalShell visible title="Next over">
      <Text style={[styles.subtitle, { color: colors.chalk }]}>Who is bowling the next over?</Text>
      {priors.length ? (
        <>
          <Text style={[styles.label, { color: colors.chalk }]}>Previous bowlers</Text>
          <View style={styles.chipRow}>
            {priors.map(p => (
              <Chip key={p} label={p} onPress={() => setNextBowler(p)} />
            ))}
          </View>
          <Text style={[styles.label, styles.orNewBowlerLabel, { color: colors.chalk }]}>
            Or a new bowler
          </Text>
        </>
      ) : (
        <Text style={[styles.label, { color: colors.chalk }]}>Next bowler</Text>
      )}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Bowler name"
        placeholderTextColor={colors.chalkDim}
        style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
      />
      {state.playerPopupError ? (
        <Text style={[styles.error, { color: colors.red }]}>{state.playerPopupError}</Text>
      ) : null}
      <Button label="Confirm" style={styles.confirmBtn} onPress={() => setNextBowler(name)} />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily,
    fontSize: 14,
    marginBottom: 14,
  },
  label: {
    fontFamily,
    fontSize: 13,
    marginBottom: 6,
  },
  orNewBowlerLabel: {
    marginTop: 10,
  },
  input: {
    fontFamily,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  error: {
    fontFamily,
    fontSize: 12,
    marginTop: 10,
  },
  confirmBtn: {
    marginTop: 16,
  },
  overRuns: {
    fontFamily,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 10,
  },
  overRunsLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  bold: {
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
