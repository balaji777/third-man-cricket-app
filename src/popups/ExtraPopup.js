import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Button from '../components/Button';
import ModalShell from '../components/ModalShell';
import NumPad from '../components/NumPad';
import { closeExtraPopup, confirmExtra } from '../engine/actions/scoring';

const LABELS = { wd: 'Wide', nb: 'No ball', b: 'Bye', lb: 'Leg bye' };
const SUBTITLES = {
  wd: 'Extra runs beyond the automatic 1 (0 = just the wide)',
  nb: 'Extra runs beyond the automatic 1 (0 = just the no ball)',
  b: 'Runs taken as byes',
  lb: 'Runs taken as leg byes',
};

export default function ExtraPopup() {
  const state = useEngine();
  const { colors } = useTheme();
  const visible = !!state.extraPopup;
  const type = state.extraPopup ? state.extraPopup.type : null;

  return (
    <ModalShell visible={visible} onRequestClose={closeExtraPopup} title={type ? LABELS[type] : ''}>
      {type ? (
        <>
          <Text style={[styles.subtitle, { color: colors.chalk }]}>{SUBTITLES[type]}</Text>
          <NumPad onSelect={confirmExtra} />
        </>
      ) : null}
      <Button label="Cancel" variant="ghost" style={styles.cancelBtn} onPress={closeExtraPopup} />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily,
    fontSize: 13,
    marginTop: -8,
    marginBottom: 14,
  },
  cancelBtn: {
    marginTop: 14,
  },
});
