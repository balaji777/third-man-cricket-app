import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { matchResultText, bestBatting, bestBowling, strikeRate, oversStr } from '../engine/helpers';
import { newMatch } from '../engine/actions/innings';
import { undoLastBallAndResume } from '../engine/actions/scoring';
import { soExtrasTotal } from '../engine/actions/superOver';
import Topbar from '../components/Topbar';
import Card from '../components/Card';
import Button from '../components/Button';
import InningsCompactLine from '../components/InningsCompactLine';
import WormChart from '../components/WormChart';
import ShareCard from '../components/ShareCard';
import { signOutUser } from '../auth/firebaseAuth';
import { openLeaderboard } from '../leaderboard/leaderboardSync';
import { shareScorecard } from '../export/share';
import { exportScorecardPDF } from '../export/pdfExport';
import { shareScorecardImage } from '../export/shareImage';

// Ported from the source's renderResult().
export default function ResultScreen() {
  const state = useEngine();
  const { colors } = useTheme();
  const inn1 = state.data[1];
  const inn2 = state.data[2];
  const so = state.superOver;
  const isGuest = !!(state.user && state.user.isAnonymous);
  const bb = bestBatting();
  const bwl = bestBowling();
  const shareCardRef = useRef(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar
        showReset
        onReset={newMatch}
        showSignOut={!!state.user}
        onSignOut={signOutUser}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>Match result</Text>
        <Text style={[styles.winner, { color: colors.amber }]}>{matchResultText()}</Text>

        {so && so.data[2] ? (
          <Card style={styles.soCard}>
            <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Super Over</Text>
            <SOResultLine inn={so.data[1]} />
            <SOResultLine inn={so.data[2]} last />
          </Card>
        ) : null}

        {!isGuest && (bb || bwl) ? (
          <Card style={styles.performersCard}>
            <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Top performers</Text>
            {bb ? (
              <ResultLine
                label="Best batting"
                value={`${bb.name} — ${bb.runs} (${bb.balls}) SR ${strikeRate(bb.runs, bb.balls)}`}
              />
            ) : null}
            {bwl ? (
              <ResultLine
                label="Best bowling"
                value={`${bwl.name} — ${bwl.wickets}/${bwl.runs} (${oversStr(bwl.balls)} ov)`}
              />
            ) : null}
          </Card>
        ) : null}

        {!isGuest && (inn1.overHistory.length > 0 || inn2.overHistory.length > 0) ? (
          <Card style={styles.wormCard}>
            <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Run rate comparison</Text>
            <WormChart />
          </Card>
        ) : null}

        <InningsCompactLine inn={inn1} n={1} expanded={state.showInningsCard[1]} />
        <InningsCompactLine inn={inn2} n={2} expanded={state.showInningsCard[2]} />

        {state.manOfMatch ? (
          <Card style={styles.motmCard}>
            <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Player of the Match</Text>
            <Text style={[styles.motmName, { color: colors.amberInk }]}>{state.manOfMatch}</Text>
          </Card>
        ) : null}

        <View style={styles.utilRow}>
          {!isGuest ? (
            <Button label="Share scorecard" variant="panel" style={styles.utilBtn} onPress={shareScorecard} />
          ) : null}
          <Button label="Export PDF" variant="panel" style={styles.utilBtn} onPress={exportScorecardPDF} />
          {!isGuest ? (
            <Button
              label="Share image"
              variant="panel"
              style={styles.utilBtn}
              onPress={() => shareScorecardImage(shareCardRef)}
            />
          ) : null}
        </View>

        <Button label="New match" onPress={newMatch} />
        {!isGuest ? (
          <Button
            label="View Leaderboard"
            variant="panel"
            style={styles.leaderboardBtn}
            onPress={openLeaderboard}
          />
        ) : null}
        {inn2.history.length > 0 && !so ? (
          <Button
            label="Undo last ball (fix a mistake)"
            variant="panel"
            style={styles.undoBtn}
            onPress={undoLastBallAndResume}
          />
        ) : null}
      </ScrollView>

      {/* Off-screen but laid out (not opacity:0 -- some Android view-shot
          builds skip invisible views), captured on demand by "Share image". */}
      <View style={styles.shareCardHost} pointerEvents="none">
        <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 0.9 }}>
          <ShareCard state={state} />
        </ViewShot>
      </View>
    </View>
  );
}

function ResultLine({ label, value }) {
  const { colors } = useTheme();
  return (
    <View style={styles.resultLine}>
      <Text style={[styles.resultLineLabel, { color: colors.chalk }]}>{label}</Text>
      <Text style={[styles.resultLineValue, { color: colors.floodlight }]}>{value}</Text>
    </View>
  );
}

function SOResultLine({ inn, last }) {
  const { colors } = useTheme();
  return (
    <View style={last ? styles.soLineLast : styles.soLine}>
      <View style={styles.soLineRow}>
        <Text style={[styles.soTeam, { color: colors.floodlight }]}>{inn.battingName}</Text>
        <Text style={[styles.soScore, { color: colors.floodlight }]}>
          {inn.runs}/{inn.wickets}
        </Text>
      </View>
      {inn.strikerName ? (
        <Text style={[styles.soMeta, { color: colors.chalk }]}>
          {inn.strikerName} & {inn.nonStrikerName} · {inn.bowlerName} bowling · extras{' '}
          {soExtrasTotal(inn)}
        </Text>
      ) : null}
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
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: -6,
  },
  winner: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
  },
  motmCard: {
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  soCard: {
    gap: 0,
  },
  performersCard: {
    gap: 0,
  },
  resultLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  resultLineLabel: {
    fontFamily,
    fontSize: 13,
  },
  resultLineValue: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  wormCard: {
    gap: 8,
  },
  soLine: {
    marginBottom: 8,
  },
  soLineLast: {
    marginBottom: 0,
  },
  soLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  soTeam: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  soScore: {
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  soMeta: {
    fontFamily,
    fontSize: 11,
    marginTop: -2,
  },
  motmName: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  leaderboardBtn: {
    marginTop: 4,
  },
  undoBtn: {
    marginTop: 4,
  },
  utilRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  utilBtn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 10,
  },
  shareCardHost: {
    position: 'absolute',
    top: 0,
    left: -9999,
  },
});
