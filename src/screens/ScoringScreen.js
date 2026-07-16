import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { curInnings } from '../engine/state';
import { undo } from '../engine/actions/scoring';
import { endInningsEarly, newMatch } from '../engine/actions/innings';
import { openDismissalPopup } from '../engine/actions/dismissal';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import Topbar from '../components/Topbar';
import Card from '../components/Card';
import Button from '../components/Button';
import ScoreBoard from '../components/ScoreBoard';
import PartnershipLine from '../components/PartnershipLine';
import OverHistory from '../components/OverHistory';
import BattingCard from '../components/BattingCard';
import BowlerLine from '../components/BowlerLine';
import RunButtons from '../components/RunButtons';
import ExtrasRow from '../components/ExtrasRow';
import ExtraPopup from '../popups/ExtraPopup';
import PlayerPopup from '../popups/PlayerPopup';
import OpenersPopup from '../popups/OpenersPopup';
import DismissalPopup from '../popups/DismissalPopup';
import { signOutUser } from '../auth/firebaseAuth';

export default function ScoringScreen() {
  const state = useEngine();
  const { colors } = useTheme();
  const inn = curInnings();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar
        showReset
        onReset={newMatch}
        showSignOut={!!state.user}
        onSignOut={signOutUser}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScoreBoard state={state} inn={inn} />
        <PartnershipLine inn={inn} />
        <OverHistory state={state} inn={inn} />

        <Card style={styles.battingCard}>
          <BattingCard inn={inn} />
          <BowlerLine inn={inn} />
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Runs off this ball</Text>
        <RunButtons />

        <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Extras</Text>
        <ExtrasRow />

        <Button label="Wicket" variant="red" onPress={openDismissalPopup} />

        <View style={styles.utilRow}>
          <Button label="Undo" variant="panel" style={styles.utilBtn} onPress={undo} />
          <Button
            label="End innings"
            variant="ghost"
            style={styles.utilBtn}
            onPress={endInningsEarly}
          />
        </View>
      </ScrollView>

      <ExtraPopup />
      <PlayerPopup />
      <OpenersPopup />
      <DismissalPopup />
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
    gap: 14,
  },
  battingCard: {
    gap: 0,
  },
  sectionLabel: {
    fontFamily,
    fontSize: 13,
    marginTop: 4,
    marginBottom: -4,
  },
  utilRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  utilBtn: {
    flex: 1,
  },
});
