import React from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import usePressScale from './usePressScale';

// variant: 'amber' (primary/CTA, also used for run buttons) | 'red' (danger/wicket/six)
//        | 'ghost' (dashed outline, used for extras) | 'panel' (neutral secondary)
export default function Button({ label, onPress, variant = 'amber', disabled = false, style }) {
  const { colors } = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();

  const variantStyle = {
    amber: { backgroundColor: colors.amber, borderColor: colors.amber },
    red: { backgroundColor: colors.red, borderColor: colors.red },
    ghost: { backgroundColor: 'transparent', borderColor: colors.chalk, borderStyle: 'dashed' },
    panel: { backgroundColor: colors.panel2, borderColor: colors.line },
  }[variant];

  const textColor = {
    amber: colors.runBtnInk,
    red: '#FFFFFF',
    ghost: colors.chalk,
    panel: colors.floodlight,
  }[variant];

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View
        style={[
          styles.base,
          variantStyle,
          disabled && styles.disabled,
          style,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily,
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
});
