import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { getState } from '../engine/state';
import { commit } from '../engine/store';

const AUTO_DISMISS_MS = 3500;

// Mirrors the source's '.toast' element (state.toastMessage + clearToastAfter()).
// Rendered once at the root (ScreenSwitch.js) rather than per-screen, since
// M14 is the first feature that actually populates toastMessage -- earlier
// milestones left it as an inert stub field with nothing to show it.
export default function Toast({ message }) {
  const { colors } = useTheme();

  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => {
      const state = getState();
      if (state.toastMessage === message) {
        state.toastMessage = null;
        commit();
      }
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <Text style={[styles.toast, { backgroundColor: colors.panel2, color: colors.floodlight, borderColor: colors.line }]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    fontFamily,
    fontSize: 13,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
