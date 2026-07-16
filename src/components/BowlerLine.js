import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { currentBowler, oversStr } from '../engine/helpers';
import { renameBowler } from '../engine/actions/scoring';

export default function BowlerLine({ inn }) {
  const { colors } = useTheme();
  const bwl = currentBowler(inn);

  return (
    <View style={[styles.row, { borderTopColor: colors.line }]}>
      <View style={styles.left}>
        <Text style={[styles.label, { color: colors.chalk }]}>Bowling: </Text>
        <TextInput
          defaultValue={bwl.name}
          onEndEditing={e => renameBowler(e.nativeEvent.text)}
          style={[styles.nameInput, { color: colors.floodlight, borderColor: colors.line }]}
        />
      </View>
      <Text style={[styles.figs, { color: colors.chalk }]}>
        {oversStr(bwl.balls)} - {bwl.runs} - {bwl.wickets}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontFamily,
    fontSize: 13,
  },
  nameInput: {
    fontFamily,
    fontSize: 14,
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  figs: {
    fontFamily,
    fontSize: 13,
  },
});
