import { getState } from '../engine/state';
import { commit } from '../engine/store';
import { matchesCollection } from '../history/matchHistorySync';

// Mirrors js/app.js's fetchMatchHistory/clearMatchHistory/openLeaderboard/
// closeLeaderboard/setLeaderboardTab. Kept together (not split into a
// logic/shell pair like M10/M11) because none of it is pure enough to be
// worth testing under node --test on its own -- every path here either
// touches Firestore or is a one-line state mutation. computeLeaderboardStats,
// the part that actually is worth unit testing, lives in leaderboardLogic.js.

// Called from openLeaderboard() below when there's no cached history yet,
// and from LeaderboardScreen's pull-to-refresh / retry path. Ordered
// newest-first, capped at 500 -- matches the source, which never needed
// pagination in practice.
async function fetchMatchHistory() {
  const state = getState();
  if (!state.user) {
    state.matchHistoryCache = [];
    commit();
    return;
  }
  try {
    const snap = await matchesCollection(state.user.uid).orderBy('date', 'desc').limit(500).get();
    state.matchHistoryCache = snap.docs.map(doc => doc.data());
  } catch (e) {
    console.error('Failed to load match history:', e);
    state.matchHistoryCache = [];
  }
  commit();
}

async function clearMatchHistory() {
  const state = getState();
  if (!state.user) return;
  try {
    const snap = await matchesCollection(state.user.uid).get();
    await Promise.all(snap.docs.map(doc => doc.ref.delete()));
    state.matchHistoryCache = [];
    commit();
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
}

// Guests have nothing synced to Firestore to show (see M10/M11's isGuest()
// guards), so there's no leaderboard for them to open.
function openLeaderboard() {
  const state = getState();
  if (state.user && state.user.isAnonymous) return;
  state.previousScreen = state.screen;
  state.screen = 'leaderboard';
  commit();
  if (state.matchHistoryCache === null) fetchMatchHistory();
}

function closeLeaderboard() {
  const state = getState();
  state.screen = state.previousScreen || 'setup';
  commit();
}

function setLeaderboardTab(tab) {
  const state = getState();
  state.leaderboardTab = tab;
  commit();
}

export { fetchMatchHistory, clearMatchHistory, openLeaderboard, closeLeaderboard, setLeaderboardTab };
