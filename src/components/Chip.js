import React from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import usePressScale from './usePressScale';

export default function Chip({ label, onPress, active = false, style }) {
  const { colors } = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: active ? colors.amberDim : colors.panel2,
            borderColor: active ? colors.amber : colors.line,
          },
          style,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.label, { color: active ? colors.amber : colors.floodlight }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  label: {
    fontFamily,
    fontSize: 14,
  },
});
