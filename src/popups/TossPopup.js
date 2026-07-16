import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Button from '../components/Button';
import ModalShell from '../components/ModalShell';
import {
  closeTossPopup,
  pickTossWinner,
  chooseTossOption,
} from '../engine/actions/toss';

// 3-step machine driven by state.tossStep: ask -> animating -> choose.
export default function TossPopup() {
  const state = useEngine();
  const { colors } = useTheme();

  return (
    <ModalShell visible={state.tossOpen} onRequestClose={closeTossPopup}>
      {state.tossStep === 'ask' ? (
        <>
          <Text style={[styles.heading, { color: colors.floodlight }]}>Who won the toss?</Text>
          <View style={styles.row}>
            <Button
              label={state.teamA}
              variant="panel"
              style={styles.flexBtn}
              onPress={() => pickTossWinner('A')}
            />
            <Button
              label={state.teamB}
              variant="panel"
              style={styles.flexBtn}
              onPress={() => pickTossWinner('B')}
            />
          </View>
        </>
      ) : null}

      {state.tossStep === 'animating' ? (
        <View
          style={[
            styles.reveal,
            { backgroundColor: state.tossWinner === 'A' ? colors.amberDim : colors.teal },
          ]}
        >
          <Text style={styles.revealText}>
            {state.tossWinner === 'A' ? state.teamA : state.teamB}
          </Text>
        </View>
      ) : null}

      {state.tossStep === 'choose' ? (
        <>
          <Text style={[styles.heading, { color: colors.floodlight }]}>
            {(state.tossWinner === 'A' ? state.teamA : state.teamB) + ' won the toss'}
          </Text>
          <Text style={[styles.subheading, { color: colors.chalk }]}>What do they choose?</Text>
          <View style={styles.row}>
            <Button
              label="Bat first"
              variant="panel"
              style={styles.flexBtn}
              onPress={() => chooseTossOption('bat')}
            />
            <Button
              label="Bowl first"
              variant="panel"
              style={styles.flexBtn}
              onPress={() => chooseTossOption('bowl')}
            />
          </View>
        </>
      ) : null}

      <Button label="Cancel" variant="ghost" style={styles.cancelBtn} onPress={closeTossPopup} />
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
  subheading: {
    fontFamily,
    fontSize: 14,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flexBtn: {
    flex: 1,
  },
  cancelBtn: {
    marginTop: 16,
  },
  reveal: {
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealText: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
