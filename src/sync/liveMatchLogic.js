// Pure, RN-free sync-decision and data-shaping logic shared by
// liveMatchSync.js and resumeLiveMatch.js -- both of those need the actual
// Firestore SDK and so can't run under plain `node --test`. Split out so
// this half is directly testable the same way src/engine/* is.
const { isGuest } = require('../engine/state');

// Screens a live match can be resumed from on another device. Anything
// outside this set (setup, result, leaderboard, auth, ...) has nothing
// worth syncing -- either there's no match yet, or it's already finalized.
const LIVE_SYNC_SCREENS = {
  scoring: true,
  break: true,
  superOverIntro: true,
  superOverScoring: true,
  superOverTiedAgain: true,
};

function canSyncLiveMatch(state) {
  return !!(state.user && !isGuest() && state.matchId && LIVE_SYNC_SCREENS[state.screen]);
}

// Only the fields needed to resume scoring elsewhere -- excludes popups,
// toasts, and other per-device UI state (mirrors what matchStorage's
// loadMatchState already strips out when restoring locally). data/superOver
// are serialized to JSON strings rather than written as-is: overHistory is
// an array of per-over arrays, and Firestore rejects any array nested
// directly inside another array. We never query into these fields -- always
// read/write the whole match -- so a JSON blob is simpler and safer than
// reshaping the live scoring model to satisfy Firestore's array rules.
//
// serverTimestampValue is passed in rather than computed here so this stays
// Firestore-SDK-free -- the caller supplies
// firestore.FieldValue.serverTimestamp().
function liveMatchSnapshot(state, serverTimestampValue) {
  return {
    matchId: state.matchId,
    screen: state.screen,
    teamA: state.teamA,
    teamB: state.teamB,
    overs: state.overs,
    wicketsLimit: state.wicketsLimit,
    battingFirst: state.battingFirst,
    tossWinner: state.tossWinner,
    tossChoice: state.tossChoice,
    inningsNum: state.inningsNum,
    target: state.target,
    dataJson: JSON.stringify(state.data),
    powerplayOvers: state.powerplayOvers,
    manOfMatch: state.manOfMatch,
    superOverJson: state.superOver ? JSON.stringify(state.superOver) : null,
    superOverTiedFinal: state.superOverTiedFinal,
    updatedAt: serverTimestampValue,
  };
}

// Inverse of liveMatchSnapshot(). Mutates state in place (same pattern as
// engine/actions/*); the caller (resumeLiveMatch.js) commits.
function hydrateFromLiveMatch(state, doc) {
  state.matchId = doc.matchId;
  state.screen = doc.screen;
  state.teamA = doc.teamA;
  state.teamB = doc.teamB;
  state.overs = doc.overs;
  state.wicketsLimit = doc.wicketsLimit;
  state.battingFirst = doc.battingFirst;
  state.tossWinner = doc.tossWinner;
  state.tossChoice = doc.tossChoice;
  state.inningsNum = doc.inningsNum;
  state.target = doc.target;
  state.data = JSON.parse(doc.dataJson);
  state.powerplayOvers = doc.powerplayOvers;
  state.manOfMatch = doc.manOfMatch;
  state.superOver = doc.superOverJson ? JSON.parse(doc.superOverJson) : null;
  state.superOverTiedFinal = doc.superOverTiedFinal;
  state.pendingLiveMatch = null;
}

module.exports = { LIVE_SYNC_SCREENS, canSyncLiveMatch, liveMatchSnapshot, hydrateFromLiveMatch };
