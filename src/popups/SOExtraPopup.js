import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Button from '../components/Button';
import ModalShell from '../components/ModalShell';
import NumPad from '../components/NumPad';
import { closeSOExtraPopup, confirmSOExtra } from '../engine/actions/superOver';

const LABELS = { wd: 'Wide', nb: 'No ball', b: 'Bye', lb: 'Leg bye' };
const SUBTITLES = {
  wd: 'Extra runs beyond the automatic 1 (0 = just the wide)',
  nb: 'Extra runs beyond the automatic 1 (0 = just the no ball)',
  b: 'Runs taken as byes',
  lb: 'Runs taken as leg byes',
};

// Mirrors ExtraPopup.js exactly, wired to the Super Over action pair
// instead of the main innings' confirmExtra/closeExtraPopup.
export default function SOExtraPopup() {
  const state = useEngine();
  const { colors } = useTheme();
  const visible = !!state.soExtraPopup;
  const type = state.soExtraPopup ? state.soExtraPopup.type : null;

  return (
    <ModalShell visible={visible} onRequestClose={closeSOExtraPopup} title={type ? LABELS[type] : ''}>
      {type ? (
        <>
          <Text style={[styles.subtitle, { color: colors.chalk }]}>{SUBTITLES[type]}</Text>
          <NumPad onSelect={confirmSOExtra} />
        </>
      ) : null}
      <Button label="Cancel" variant="ghost" style={styles.cancelBtn} onPress={closeSOExtraPopup} />
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
