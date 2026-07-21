import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEngine } from '../engine/EngineProvider';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { formatDateShort, formatTime12hr } from '../engine/helpers';
import { newMatch } from '../engine/actions/innings';
import { computeLeaderboardStats } from '../leaderboard/leaderboardLogic';
import { closeLeaderboard, setLeaderboardTab, clearMatchHistory } from '../leaderboard/leaderboardSync';
import { signOutUser } from '../auth/firebaseAuth';
import { exportLeaderboardPDF } from '../export/pdfExport';
import Topbar from '../components/Topbar';
import Card from '../components/Card';
import Button from '../components/Button';
import Chip from '../components/Chip';

const TABS = [
  ['batting', 'Batting'],
  ['bowling', 'Bowling'],
  ['points', 'Points'],
  ['history', 'History'],
];

// Ported from the source's renderLeaderboard(). computeLeaderboardStats
// itself lives in leaderboard/leaderboardLogic.js (RN-free, unit tested);
// this screen just picks a tab's slice of it and lays out rows.
export default function LeaderboardScreen() {
  const state = useEngine();
  const { colors } = useTheme();
  const history = state.matchHistoryCache;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Topbar showReset onReset={newMatch} showSignOut={!!state.user} onSignOut={signOutUser} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.h2, { color: colors.floodlight }]}>Leaderboard</Text>

        {history === null ? (
          <Text style={[styles.muted, { color: colors.chalk }]}>Loading your match history…</Text>
        ) : history.length === 0 ? (
          <Text style={[styles.muted, { color: colors.chalk }]}>
            No completed matches yet — play one to see stats here.
          </Text>
        ) : (
          <LeaderboardBody history={history} tab={state.leaderboardTab} colors={colors} />
        )}

        <Button label="Back" variant="panel" style={styles.backBtn} onPress={closeLeaderboard} />
      </ScrollView>
    </View>
  );
}

function LeaderboardBody({ history, tab, colors }) {
  const stats = computeLeaderboardStats(history);

  return (
    <>
      <View style={styles.tabRow}>
        {TABS.map(([key, label]) => (
          <Chip key={key} label={label} active={tab === key} onPress={() => setLeaderboardTab(key)} />
        ))}
      </View>

      {tab === 'batting' ? <BattingTab batters={stats.batters} /> : null}
      {tab === 'bowling' ? <BowlingTab bowlers={stats.bowlers} /> : null}
      {tab === 'points' ? <PointsTab teams={stats.teams} /> : null}
      {tab === 'history' ? <HistoryTab matches={history} /> : null}

      <View style={styles.utilRow}>
        <Button
          label="Export PDF"
          variant="panel"
          style={styles.utilBtn}
          onPress={() => exportLeaderboardPDF(history)}
        />
        <Button
          label="Clear history"
          variant="panel"
          style={styles.utilBtn}
          onPress={clearMatchHistory}
        />
      </View>
    </>
  );
}

function BattingTab({ batters }) {
  const list = Object.values(batters)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 15);
  return (
    <Card>
      {list.map((b, i) => {
        const avg = b.outs > 0 ? (b.runs / b.outs).toFixed(1) : b.runs + '*';
        const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
        return (
          <LBRow
            key={b.name}
            name={b.name}
            statsLine={`Runs ${b.runs} · HS ${b.highScore} · Avg ${avg} · SR ${sr}`}
            rankLabel={String(i + 1).padStart(2, '0')}
          />
        );
      })}
    </Card>
  );
}

function BowlingTab({ bowlers }) {
  const list = Object.values(bowlers)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 15);
  return (
    <Card>
      {list.map((bw, i) => {
        const econ = bw.balls > 0 ? (bw.runs / (bw.balls / 6)).toFixed(2) : '0.00';
        return (
          <LBRow
            key={bw.name}
            name={bw.name}
            statsLine={`Wkts ${bw.wickets} · Best ${bw.bestWkts}/${bw.bestRuns} · Econ ${econ} · ${bw.maidens} mdns`}
            rankLabel={String(i + 1).padStart(2, '0')}
          />
        );
      })}
    </Card>
  );
}

function PointsTab({ teams }) {
  const list = Object.values(teams).sort((a, b) => b.points - a.points);
  return (
    <Card>
      {list.map(t => (
        <LBRow
          key={t.name}
          name={t.name}
          statsLine={`P${t.played} · W${t.won} · L${t.lost} · T${t.tied}`}
          rankLabel={String(t.points)}
          rankSub="pts"
        />
      ))}
    </Card>
  );
}

function HistoryTab({ matches }) {
  return (
    <Card>
      {matches.map((m, i) => (
        <LBRow
          key={i}
          name={`${m.teamA} vs ${m.teamB}`}
          statsLine={`${m.resultText} · ${m.innings[0].runs}/${m.innings[0].wickets} - ${m.innings[1].runs}/${m.innings[1].wickets}`}
          rankLabel={formatDateShort(m.date)}
          rankSub={formatTime12hr(m.date)}
          noAvatar
        />
      ))}
    </Card>
  );
}

function LBRow({ name, statsLine, rankLabel, rankSub, noAvatar }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderColor: colors.line }]}>
      {noAvatar ? null : (
        <View style={[styles.avatar, { backgroundColor: colors.panel2, borderColor: colors.line }]}>
          <Text style={[styles.avatarLetter, { color: colors.amber }]}>
            {name.trim().charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.floodlight }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.stats, { color: colors.chalk }]}>{statsLine}</Text>
      </View>
      <View style={styles.rank}>
        <Text style={[styles.rankLabel, { color: colors.floodlight }]}>{rankLabel}</Text>
        {rankSub ? <Text style={[styles.rankSub, { color: colors.chalk }]}>{rankSub}</Text> : null}
      </View>
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
  },
  muted: {
    fontFamily,
    fontSize: 14,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    fontFamily,
    fontSize: 11,
    marginTop: 2,
  },
  rank: {
    alignItems: 'flex-end',
  },
  rankLabel: {
    fontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  rankSub: {
    fontFamily,
    fontSize: 10,
    marginTop: 1,
  },
  backBtn: {
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
  },
});
