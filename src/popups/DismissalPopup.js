import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { curInnings } from '../engine/state';
import { striker, nonStriker } from '../engine/helpers';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Button from '../components/Button';
import Chip from '../components/Chip';
import ModalShell from '../components/ModalShell';
import {
  closeDismissalPopup,
  pickDismissalType,
  pickCatchType,
  pickRunoutRuns,
  pickRunoutEnd,
  pickRunoutWho,
  confirmDismissalFielder,
} from '../engine/actions/dismissal';
import NumPad from '../components/NumPad';

const DISMISSAL_TYPES = [
  ['bowled', 'Bowled'],
  ['caught', 'Caught'],
  ['lbw', 'LBW'],
  ['stumped', 'Stumped'],
  ['runout', 'Run Out'],
];

const FIELDER_LABEL = {
  caught: 'Who caught it?',
  runout: 'Who fielded/threw it? (optional)',
};

// Step machine driven by state.dismissalPopup.step, ported from the source's
// renderDismissalPopup(): type -> (catchType | runoutRuns -> runoutEnd ->
// runoutWho) -> fielder -> finalizeWicket. Only 5 dismissal types are wired
// (matching the source -- no hit-wicket/retired/etc.).
export default function DismissalPopup() {
  const state = useEngine();
  const { colors } = useTheme();
  const visible = !!state.dismissalPopup;
  const d = state.dismissalPopup;
  const step = d ? d.step : null;
  const inn = curInnings();
  const [fielder, setFielder] = useState('');

  useEffect(() => {
    if (step === 'fielder') setFielder('');
  }, [step]);

  if (!visible) return null;

  return (
    <ModalShell visible onRequestClose={closeDismissalPopup}>
      {d.step === 'type' ? (
        <>
          <Text style={[styles.heading, { color: colors.floodlight }]}>Wicket!</Text>
          <Text style={[styles.subtitle, { color: colors.chalk }]}>
            How was {striker(inn).name} out?
          </Text>
          <View style={styles.chipRow}>
            {DISMISSAL_TYPES.map(([type, label]) => (
              <Chip key={type} label={label} onPress={() => pickDismissalType(type)} />
            ))}
          </View>
        </>
      ) : null}

      {d.step === 'catchType' ? (
        <>
          <Text style={[styles.heading, { color: colors.floodlight }]}>What kind of catch?</Text>
          <View style={styles.row}>
            <Button
              label="Normal catch"
              variant="panel"
              style={styles.flexBtn}
              onPress={() => pickCatchType('normal')}
            />
            <Button
              label="Extraordinary catch"
              variant="panel"
              style={styles.flexBtn}
              onPress={() => pickCatchType('extraordinary')}
            />
          </View>
        </>
      ) : null}

      {d.step === 'runoutRuns' ? (
        <>
          <Text style={[styles.heading, { color: colors.floodlight }]}>Run Out</Text>
          <Text style={[styles.subtitle, { color: colors.chalk }]}>
            How many runs were completed?
          </Text>
          <NumPad onSelect={pickRunoutRuns} />
        </>
      ) : null}

      {d.step === 'runoutEnd' ? (
        <>
          <Text style={[styles.heading, { color: colors.floodlight }]}>
            Which end was the throw?
          </Text>
          <View style={styles.row}>
            <Button
              label="Striker's end"
              variant="panel"
              style={styles.flexBtn}
              onPress={() => pickRunoutEnd('striker')}
            />
            <Button
              label="Non-striker's end"
              variant="panel"
              style={styles.flexBtn}
              onPress={() => pickRunoutEnd('nonstriker')}
            />
          </View>
        </>
      ) : null}

      {d.step === 'runoutWho' ? (
        <>
          <Text style={[styles.heading, { color: colors.floodlight }]}>Who was run out?</Text>
          <View style={styles.row}>
            <Button
              label={striker(inn).name}
              variant="panel"
              style={styles.flexBtn}
              onPress={() => pickRunoutWho(inn.strikerIdx)}
            />
            <Button
              label={nonStriker(inn).name}
              variant="panel"
              style={styles.flexBtn}
              onPress={() => pickRunoutWho(inn.nonStrikerIdx)}
            />
          </View>
        </>
      ) : null}

      {d.step === 'fielder' ? (
        <>
          <Text style={[styles.heading, { color: colors.floodlight }]}>
            {FIELDER_LABEL[d.type]}
          </Text>
          <TextInput
            value={fielder}
            onChangeText={setFielder}
            placeholder="Fielder name"
            placeholderTextColor={colors.chalkDim}
            style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
          />
          {state.playerPopupError ? (
            <Text style={[styles.error, { color: colors.red }]}>{state.playerPopupError}</Text>
          ) : null}
          <Button
            label="Confirm"
            style={styles.confirmBtn}
            onPress={() => confirmDismissalFielder(fielder)}
          />
        </>
      ) : null}

      <Button
        label="Cancel"
        variant="ghost"
        style={styles.cancelBtn}
        onPress={closeDismissalPopup}
      />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily,
    fontSize: 14,
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flexBtn: {
    flex: 1,
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
  cancelBtn: {
    marginTop: 12,
  },
});
