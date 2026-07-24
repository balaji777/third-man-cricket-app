import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Button from '../components/Button';
import ModalShell from '../components/ModalShell';
import { confirmOpeners } from '../engine/actions/setup';

// Shown at the start of every innings (state.playerPopup.type === 'openers').
// The source reads three document.getElementById(...) values on confirm;
// here they're controlled TextInputs passed directly into confirmOpeners.
export default function OpenersPopup() {
  const state = useEngine();
  const { colors } = useTheme();
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  const visible = !!(state.playerPopup && state.playerPopup.type === 'openers');

  // Reset on each fresh open (not just on mount) -- this component stays
  // mounted across both innings, and each innings needs blank inputs, not
  // whatever names were typed last time.
  useEffect(() => {
    if (visible) {
      setStriker('');
      setNonStriker('');
      setBowler('');
    }
  }, [visible]);

  return (
    <ModalShell visible={visible} title="Openers">
      <Text style={[styles.label, { color: colors.chalk }]}>Striker</Text>
      <TextInput
        value={striker}
        onChangeText={setStriker}
        placeholder="Batsman 1"
        placeholderTextColor={colors.chalkDim}
        style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
      />
      <Text style={[styles.label, { color: colors.chalk }]}>Non-striker</Text>
      <TextInput
        value={nonStriker}
        onChangeText={setNonStriker}
        placeholder="Batsman 2"
        placeholderTextColor={colors.chalkDim}
        style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
      />
      <Text style={[styles.label, { color: colors.chalk }]}>Opening bowler</Text>
      <TextInput
        value={bowler}
        onChangeText={setBowler}
        placeholder="Bowler 1"
        placeholderTextColor={colors.chalkDim}
        style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
      />
      {state.playerPopupError ? (
        <Text style={[styles.error, { color: colors.red }]}>{state.playerPopupError}</Text>
      ) : null}
      <Button
        label="Start innings"
        style={styles.confirmBtn}
        onPress={() => confirmOpeners(striker, nonStriker, bowler)}
      />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily,
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
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
});
