// Pure, RN-free match-history entry building and cache-update logic, shared
// by matchHistorySync.js (which needs the actual Firestore SDK and so can't
// run under plain `node --test`). Split the same way M10 split
// liveMatchSync.js from liveMatchLogic.js.
const { oversStr, matchResultText, computeMatchWinner } = require('../engine/helpers');

function packInnings(inn) {
  return {
    team: inn.battingName,
    runs: inn.runs,
    wickets: inn.wickets,
    overs: oversStr(inn.legalBalls),
    batsmen: inn.batsmen.map(b => ({
      name: b.name,
      runs: b.runs,
      balls: b.balls,
      fours: b.fours,
      sixes: b.sixes,
      out: b.out,
    })),
    bowlers: inn.bowlers.map(bw => ({
      name: bw.name,
      balls: bw.balls,
      runs: bw.runs,
      wickets: bw.wickets,
      maidens: bw.maidens || 0,
    })),
  };
}

function buildHistoryEntry(state) {
  const inn1 = state.data[1];
  const inn2 = state.data[2];
  return {
    date: Date.now(),
    teamA: state.teamA,
    teamB: state.teamB,
    resultText: matchResultText(),
    winner: computeMatchWinner(),
    manOfMatch: state.manOfMatch,
    innings: [packInnings(inn1), packInnings(inn2)],
  };
}

// Mutates state in place (same pattern as engine/actions/*): flips
// matchRecorded and updates matchHistoryCache, then returns the entry for
// the caller (matchHistorySync.js) to save. Returns null if the match was
// already recorded -- mirrors the source's own matchRecorded guard, and
// keeps this idempotent across the repeated calls a live app makes on every
// commit while screen === 'result'.
function recordMatchToHistory(state) {
  if (state.matchRecorded) return null;
  state.matchRecorded = true;
  const entry = buildHistoryEntry(state);
  if (state.matchHistoryDocId) {
    // Re-recording a corrected result (e.g. "Undo last ball" was used from
    // the result screen -- see regressions.test.js). The previous Firestore
    // entry for this match is about to be replaced, so invalidate the cache
    // rather than appending -- otherwise both the stale and corrected
    // entries would show up side by side until the leaderboard (M12)
    // refetches.
    state.matchHistoryCache = null;
  } else if (state.matchHistoryCache) {
    state.matchHistoryCache = state.matchHistoryCache.concat([entry]);
  }
  return entry;
}

module.exports = { packInnings, buildHistoryEntry, recordMatchToHistory };
