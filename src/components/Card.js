import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function Card({ children, style }) {
  const { colors, shadowCard } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.panel, borderColor: colors.line },
        shadowCard,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
});
