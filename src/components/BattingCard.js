import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { strikeRate } from '../engine/helpers';
import { renameBatsman } from '../engine/actions/scoring';

export default function BattingCard({ inn }) {
  const { colors } = useTheme();

  return (
    <View>
      {inn.batsmen.map((b, i) => {
        if (b.out) return null;
        const isStriker = i === inn.strikerIdx;
        return (
          <View key={i} style={styles.row}>
            <TextInput
              defaultValue={b.name}
              onEndEditing={e => renameBatsman(i, e.nativeEvent.text)}
              style={[styles.nameInput, { color: colors.floodlight, borderColor: colors.line }]}
            />
            {isStriker ? <Text style={[styles.strikeMark, { color: colors.amber }]}>*</Text> : null}
            <Text style={[styles.figs, { color: colors.chalk }]}>
              {b.runs} ({b.balls}) · SR {strikeRate(b.runs, b.balls)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
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
  strikeMark: {
    fontSize: 16,
    fontWeight: '700',
  },
  figs: {
    fontFamily,
    fontSize: 12,
  },
});
