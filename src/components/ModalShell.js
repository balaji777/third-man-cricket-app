import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

// Generic popup overlay used by toss/openers/extra/dismissal/player popups
// and the reset-confirm modal -- mirrors the source's .toss-overlay/.toss-modal.
export default function ModalShell({ visible, onRequestClose, title, children }) {
  const { colors, shadowCard } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.overlay} onPress={onRequestClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.panel, borderColor: colors.lineStrong },
            shadowCard,
          ]}
          onPress={() => {}}
        >
          {title ? (
            <Text style={[styles.title, { color: colors.floodlight }]}>{title}</Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
});
