import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

export default function Chip({ label, onPress, active = false, style }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: active ? colors.amberDim : colors.panel2,
          borderColor: active ? colors.amber : colors.line,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.amber : colors.floodlight }]}>
        {label}
      </Text>
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
  pressed: {
    opacity: 0.7,
  },
});
