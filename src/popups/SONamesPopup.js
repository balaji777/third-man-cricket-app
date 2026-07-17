import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Button from '../components/Button';
import ModalShell from '../components/ModalShell';
import { confirmSONames } from '../engine/actions/superOver';

// Shown at the start of each Super Over innings (state.soNamesPopup).
// Mirrors OpenersPopup's controlled-TextInput pattern.
export default function SONamesPopup() {
  const state = useEngine();
  const { colors } = useTheme();
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  const visible = !!state.soNamesPopup;

  useEffect(() => {
    if (visible) {
      setStriker('');
      setNonStriker('');
      setBowler('');
    }
  }, [visible]);

  return (
    <ModalShell visible={visible} title="Super Over line-up">
      <Text style={[styles.label, { color: colors.chalk }]}>Striker</Text>
      <TextInput
        value={striker}
        onChangeText={setStriker}
        placeholder="Striker name"
        placeholderTextColor={colors.chalkDim}
        style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
      />
      <Text style={[styles.label, { color: colors.chalk }]}>Non-striker</Text>
      <TextInput
        value={nonStriker}
        onChangeText={setNonStriker}
        placeholder="Non-striker name"
        placeholderTextColor={colors.chalkDim}
        style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
      />
      <Text style={[styles.label, { color: colors.chalk }]}>Bowler</Text>
      <TextInput
        value={bowler}
        onChangeText={setBowler}
        placeholder="Bowler name"
        placeholderTextColor={colors.chalkDim}
        style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
      />
      {state.playerPopupError ? (
        <Text style={[styles.error, { color: colors.red }]}>{state.playerPopupError}</Text>
      ) : null}
      <Button
        label="Start"
        style={styles.confirmBtn}
        onPress={() => confirmSONames(striker, nonStriker, bowler)}
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
