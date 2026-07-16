import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { getState } from '../engine/state';
import { setOvers, startMatch } from '../engine/actions/setup';
import { openTossPopup } from '../engine/actions/toss';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Topbar from '../components/Topbar';
import Card from '../components/Card';
import Button from '../components/Button';
import Chip from '../components/Chip';
import TossPopup from '../popups/TossPopup';
import { signOutUser } from '../auth/firebaseAuth';
import { upgradeToGoogle } from '../auth/googleSignIn';

const OVERS_PRESETS = [5, 10, 20, 50];

// Mirrors the source's renderSetup(): these fields mutate engine state
// directly without commit() on every keystroke (matching the source's
// `oninput="state.teamA=this.value"` pattern, which never called render()
// either) -- other parts of the UI read the field lazily, not reactively.
function setFieldNoCommit(field, value) {
  getState()[field] = value;
}

export default function SetupScreen() {
  const state = useEngine();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar showReset={false} showSignOut={!!state.user} onSignOut={signOutUser} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>New match setup</Text>

        {state.user && state.user.isAnonymous ? (
          <Card style={styles.guestCard}>
            <Text style={[styles.muted, { color: colors.chalk }]}>
              Playing as guest — sign in to save your stats across devices.
            </Text>
            <Button label="Sign in with Google" variant="panel" onPress={upgradeToGoogle} />
            {state.authError ? (
              <Text style={[styles.guestError, { color: colors.red }]}>{state.authError}</Text>
            ) : null}
          </Card>
        ) : null}

        <Field label="Team A name" colors={colors}>
          <TextInput
            defaultValue={state.teamA}
            onChangeText={t => setFieldNoCommit('teamA', t)}
            placeholder="Team A name"
            placeholderTextColor={colors.chalkDim}
            style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
          />
        </Field>
        <Field label="Team B name" colors={colors}>
          <TextInput
            defaultValue={state.teamB}
            onChangeText={t => setFieldNoCommit('teamB', t)}
            placeholder="Team B name"
            placeholderTextColor={colors.chalkDim}
            style={[styles.input, { color: colors.floodlight, borderColor: colors.line }]}
          />
        </Field>

        <Field label="Overs per innings" colors={colors}>
          <View style={styles.presetRow}>
            {OVERS_PRESETS.map(o => (
              <Chip key={o} label={String(o)} active={state.overs === o} onPress={() => setOvers(o)} />
            ))}
          </View>
          <TextInput
            // key forces a remount (fresh defaultValue) whenever a preset
            // chip changes state.overs externally -- typing itself never
            // commits, so this doesn't disrupt the user mid-type.
            key={state.overs}
            defaultValue={String(state.overs)}
            onChangeText={t => setFieldNoCommit('overs', parseInt(t, 10) || 1)}
            keyboardType="number-pad"
            style={[styles.input, styles.numberInput, { color: colors.floodlight, borderColor: colors.line }]}
          />
        </Field>

        <Field label="Wickets per innings" colors={colors}>
          <TextInput
            defaultValue={String(state.wicketsLimit)}
            onChangeText={t => setFieldNoCommit('wicketsLimit', parseInt(t, 10) || 10)}
            keyboardType="number-pad"
            style={[styles.input, styles.numberInput, { color: colors.floodlight, borderColor: colors.line }]}
          />
        </Field>

        <Field label="Powerplay overs" colors={colors}>
          <TextInput
            defaultValue={String(state.powerplayOvers)}
            onChangeText={t => setFieldNoCommit('powerplayOvers', parseInt(t, 10) || 0)}
            keyboardType="number-pad"
            style={[styles.input, styles.numberInput, { color: colors.floodlight, borderColor: colors.line }]}
          />
          <Text style={[styles.hint, { color: colors.chalk }]}>
            Fielding-restriction overs at the start of each innings. Set to 0 to skip.
          </Text>
        </Field>

        <Field label="Toss" colors={colors}>
          <Card style={styles.tossCard}>
            {state.battingFirst === null ? (
              <>
                <Text style={[styles.muted, { color: colors.chalk }]}>Decide who won the toss.</Text>
                <Button label="Enter toss result" variant="panel" onPress={openTossPopup} />
              </>
            ) : (
              <>
                <Text style={[styles.muted, { color: colors.chalk }]}>
                  {(state.tossWinner === 'A' ? state.teamA : state.teamB) +
                    ' won the toss and chose to ' +
                    state.tossChoice +
                    '.'}
                </Text>
                <Text style={[styles.tossResult, { color: colors.floodlight }]}>
                  {(state.battingFirst === 'A' ? state.teamA : state.teamB) + ' will bat first'}
                </Text>
              </>
            )}
          </Card>
        </Field>

        {state.battingFirst !== null ? (
          <Button label="Start match" style={styles.startBtn} onPress={startMatch} />
        ) : null}
      </ScrollView>

      <TossPopup />
    </View>
  );
}

function Field({ label, colors, children }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.chalk }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    fontFamily,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  numberInput: {
    marginTop: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  hint: {
    fontFamily,
    fontSize: 12,
    marginTop: 6,
  },
  tossCard: {
    alignItems: 'center',
    gap: 10,
  },
  guestCard: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  guestError: {
    fontFamily,
    fontSize: 12,
  },
  muted: {
    fontFamily,
    fontSize: 14,
    textAlign: 'center',
  },
  tossResult: {
    fontFamily,
    fontSize: 16,
    fontWeight: '700',
  },
  startBtn: {
    marginTop: 8,
  },
});
