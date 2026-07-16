import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Button from '../components/Button';
import { signInWithGoogle } from '../auth/googleSignIn';
import { continueAsGuest } from '../auth/firebaseAuth';

// Ported from the source's renderLogin(). The privacy-policy link is
// deferred -- privacy.html isn't bundled/hosted from this RN app.
export default function LoginScreen() {
  const state = useEngine();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.pitch }]}>
      <Text style={[styles.brand, { color: colors.floodlight }]}>Third Man</Text>
      <Text style={[styles.tagline, { color: colors.chalk }]}>Cricket Scorer</Text>

      <Button label="Sign in with Google" style={styles.button} onPress={signInWithGoogle} />
      <Button
        label="Continue as Guest"
        variant="panel"
        style={styles.button}
        onPress={continueAsGuest}
      />

      {state.authError ? (
        <Text style={[styles.error, { color: colors.red }]}>{state.authError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brand: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
  },
  tagline: {
    fontFamily,
    fontSize: 16,
    marginBottom: 40,
  },
  button: {
    width: '100%',
    marginTop: 12,
  },
  error: {
    fontFamily,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
});
