import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import usePressScale from './usePressScale';

// 0-10 grid, used by the extras popup (runs run on a wide/no-ball/bye/leg-bye)
// and the run-out popup (runs completed before the throw).
export default function NumPad({ onSelect, max = 10 }) {
  const numbers = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <View style={styles.grid}>
      {numbers.map(n => (
        <NumPadCell key={n} n={n} onPress={() => onSelect(n)} />
      ))}
    </View>
  );
}

function NumPadCell({ n, onPress }) {
  const { colors } = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.cell,
          { backgroundColor: colors.panel2, borderColor: colors.line },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.label, { color: colors.floodlight }]}>{n}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
});
