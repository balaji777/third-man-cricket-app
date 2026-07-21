// Pure, RN-free leaderboard aggregation, ported near-verbatim from js/app.js's
// computeLeaderboardStats(). Takes the flat list of match-history entries
// M11 writes (src/history/matchHistoryLogic.js's buildHistoryEntry() shape)
// and folds them into per-team/batter/bowler career totals. RN-free so it's
// testable under plain `node --test`; the screen (LeaderboardScreen.js) and
// the Firestore fetch that supplies `history` (leaderboardSync.js) are kept
// separate, mirroring M10/M11's logic/shell split.
function computeLeaderboardStats(history) {
  const teams = {};
  const batters = {};
  const bowlers = {};

  history.forEach(m => {
    const teamNames = [m.innings[0].team, m.innings[1].team];
    teamNames.forEach(t => {
      if (!teams[t]) teams[t] = { name: t, played: 0, won: 0, lost: 0, tied: 0, points: 0 };
      teams[t].played += 1;
    });
    if (m.winner) {
      teams[m.winner].won += 1;
      teams[m.winner].points += 2;
      const loser = m.winner === teamNames[0] ? teamNames[1] : teamNames[0];
      teams[loser].lost += 1;
    } else {
      teams[teamNames[0]].tied += 1;
      teams[teamNames[0]].points += 1;
      teams[teamNames[1]].tied += 1;
      teams[teamNames[1]].points += 1;
    }

    m.innings.forEach(inn => {
      inn.batsmen.forEach(b => {
        const key = b.name.trim().toLowerCase();
        if (!batters[key]) {
          batters[key] = { name: b.name, runs: 0, innings: 0, highScore: 0, fours: 0, sixes: 0, balls: 0, outs: 0 };
        }
        batters[key].runs += b.runs;
        batters[key].fours += b.fours;
        batters[key].sixes += b.sixes;
        batters[key].innings += 1;
        batters[key].balls += b.balls;
        if (b.out) batters[key].outs += 1;
        if (b.runs > batters[key].highScore) batters[key].highScore = b.runs;
      });
      inn.bowlers.forEach(bw => {
        if (bw.balls === 0) return;
        const key = bw.name.trim().toLowerCase();
        if (!bowlers[key]) {
          bowlers[key] = { name: bw.name, wickets: 0, runs: 0, balls: 0, maidens: 0, bestWkts: 0, bestRuns: 0 };
        }
        bowlers[key].wickets += bw.wickets;
        bowlers[key].runs += bw.runs;
        bowlers[key].balls += bw.balls;
        bowlers[key].maidens += bw.maidens;
        if (bw.wickets > bowlers[key].bestWkts || (bw.wickets === bowlers[key].bestWkts && bw.runs < bowlers[key].bestRuns)) {
          bowlers[key].bestWkts = bw.wickets;
          bowlers[key].bestRuns = bw.runs;
        }
      });
    });
  });

  return { teams, batters, bowlers };
}

module.exports = { computeLeaderboardStats };
