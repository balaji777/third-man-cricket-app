import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

// A simplified version of the source's branded splash (the CSS "ball hits
// bat" animation is a visual flourish, not ported here) -- shown while
// Firebase resolves the auth session, held for a minimum SPLASH_MIN_MS by
// auth/firebaseAuth.js regardless of how fast auth actually resolves.
export default function AuthLoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.pitch }]}>
      <Text style={[styles.brand, { color: colors.floodlight }]}>Third Man</Text>
      <Text style={[styles.tagline, { color: colors.chalk }]}>Cricket Scorer</Text>
      <ActivityIndicator color={colors.amber} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
  },
  tagline: {
    fontFamily,
    fontSize: 16,
    marginTop: 4,
  },
  spinner: {
    marginTop: 32,
  },
});
