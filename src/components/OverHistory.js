import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { computeOverTotal } from '../engine/helpers';
import { toggleOverHistory } from '../engine/actions/scoring';
import Card from './Card';

export default function OverHistory({ state, inn }) {
  const { colors } = useTheme();
  if (inn.overHistory.length === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleOverHistory}>
        <Text style={[styles.toggle, { color: colors.chalk }]}>
          {state.showOverHistory ? '▾' : '▸'} Full over history
        </Text>
      </Pressable>
      {state.showOverHistory ? (
        <Card style={styles.card}>
          {inn.overHistory.map((ov, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.rowText, { color: colors.chalk }]}>
                Ov {i + 1} · {inn.overBowlers[i]}
              </Text>
              <Text style={[styles.rowText, { color: colors.floodlight }]}>
                {ov.join(' ')} = {computeOverTotal(ov)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  toggle: {
    fontFamily,
    fontSize: 13,
  },
  card: {
    marginTop: 8,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowText: {
    fontFamily,
    fontSize: 13,
  },
});
