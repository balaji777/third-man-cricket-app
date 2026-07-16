import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Button from './Button';
import ModalShell from './ModalShell';

// Persistent chrome shown on every screen except setup (per the source's
// topbar()): brand wordmark, reset icon (+ confirm modal), theme toggle,
// and a sign-out icon shown only when a user is signed in.
export default function Topbar({ showReset = true, showSignOut = false, onReset, onSignOut }) {
  const { colors, theme, toggleTheme } = useTheme();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  return (
    <View style={styles.bar}>
      <Text style={[styles.brand, { color: colors.floodlight }]}>THIRD MAN · CRICKET SCORER</Text>
      <View style={styles.icons}>
        {showReset ? (
          <IconButton label="⟳" onPress={() => setResetConfirmOpen(true)} />
        ) : null}
        <IconButton label={theme === 'light' ? '☀' : '☾'} onPress={toggleTheme} />
        {showSignOut ? <IconButton label="🚪" onPress={onSignOut} /> : null}
      </View>

      <ModalShell
        visible={resetConfirmOpen}
        onRequestClose={() => setResetConfirmOpen(false)}
        title="Start a new match?"
      >
        <View style={styles.confirmRow}>
          <Button
            label="Cancel"
            variant="panel"
            style={styles.confirmBtn}
            onPress={() => setResetConfirmOpen(false)}
          />
          <Button
            label="Yes"
            variant="red"
            style={styles.confirmBtn}
            onPress={() => {
              setResetConfirmOpen(false);
              if (onReset) onReset();
            }}
          />
        </View>
      </ModalShell>
    </View>
  );
}

function IconButton({ label, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
    >
      <Text style={[styles.iconLabel, { color: colors.chalk }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  brand: {
    fontFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  icons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 18,
  },
  pressed: {
    opacity: 0.6,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
  },
});
