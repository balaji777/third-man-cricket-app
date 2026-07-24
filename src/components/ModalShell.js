import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

// Generic popup overlay used by toss/openers/extra/dismissal/player popups
// and the reset-confirm modal -- mirrors the source's .toss-overlay/.toss-modal.
//
// The card pops in with a scale+fade spring on every visible=false->true
// transition (some popups mount ModalShell fresh each time they're shown,
// others keep it mounted and just flip `visible` -- watching the prop
// covers both). The inner Pressable's onPress={() => {}} still swallows
// taps so they don't bubble to the overlay's onRequestClose; the animation
// lives on the Animated.View wrapping it, not on the card itself, so that
// swallow behavior is unaffected.
export default function ModalShell({ visible, onRequestClose, title, children }) {
  const { colors, shadowCard } = useTheme();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 16,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.overlay} onPress={onRequestClose}>
        <Animated.View style={[styles.wrapper, { opacity, transform: [{ scale }] }]}>
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
        </Animated.View>
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
  wrapper: {
    width: '100%',
    maxWidth: 420,
  },
  card: {
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
