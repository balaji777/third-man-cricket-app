// Core match/innings state shape, ported from the retired web app's
// js/app.js. Kept as CommonJS so src/engine/* has zero RN/Babel/Metro
// dependency and can be tested with plain `node --test`.
//
// Fields present in the source but out of Phase 2 scope so far (live cloud
// sync, match history, leaderboard) are kept in the shape as always-null/
// false stubs so later milestones can slot them in without a state-shape
// migration. `over_wkts_seen` (source freshInnings) was dead in the
// original -- set once, never read -- and is dropped here.

function freshMatch() {
  return {
    screen: 'setup',
    teamA: 'Team A',
    teamB: 'Team B',
    overs: 20,
    wicketsLimit: 10,
    battingFirst: null,
    tossWinner: null,
    tossChoice: null,
    tossOpen: false,
    tossStep: null,
    inningsNum: 1,
    target: null,
    data: { 1: null, 2: null },
    playerPopup: null,
    playerPopupError: null,
    popupQueue: [],
    extraPopup: null,
    showOverHistory: false,
    theme: 'dark',
    manOfMatch: null,
    toastMessage: null,
    dismissalPopup: null,
    powerplayOvers: 6,
    resetConfirmOpen: false,
    superOver: null,
    soNamesPopup: false,
    soExtraPopup: null,
    superOverTiedFinal: false,
    // Out of Phase 2 scope so far (match history / live sync / leaderboard).
    matchRecorded: false,
    matchHistoryDocId: null,
    matchId: null,
    previousScreen: null,
    leaderboardTab: 'batting',
    user: null,
    authReady: false,
    authError: null,
    matchHistoryCache: null,
    showInningsCard: { 1: false, 2: false },
    guestUpsellOpen: false,
    guestUpsellSeen: false,
  };
}

function freshInnings(battingName, bowlingName) {
  return {
    battingName: battingName,
    bowlingName: bowlingName,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    batsmen: [
      { name: 'Batsman 1', runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' },
      { name: 'Batsman 2', runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' },
    ],
    strikerIdx: 0,
    nonStrikerIdx: 1,
    nextBatNum: 3,
    bowlers: [{ name: 'Bowler 1', balls: 0, runs: 0, wickets: 0, maidens: 0 }],
    bowlerIdx: 0,
    thisOver: [],
    overHistory: [],
    overBowlers: [],
    history: [],
    ended: false,
    wicketLog: [],
    partnershipStartRuns: 0,
    partnershipStartBalls: 0,
    extras: { wd: 0, nb: 0, b: 0, lb: 0 },
    startTime: null,
    endTime: null,
  };
}

let state = freshMatch();

function getState() {
  return state;
}

function setState(s) {
  state = s;
}

function curInnings() {
  return state.data[state.inningsNum];
}

function isGuest() {
  return !!(state.user && state.user.isAnonymous);
}

// snapshot-before-mutate: deep-clones the current innings onto its own
// history stack (capped at 40, FIFO), stripping the clone's own nested
// history to avoid unbounded growth. Called at the start of every
// ball-scoring mutation (addRuns, confirmExtra, finalizeWicket,
// endInningsEarly).
function snapshot() {
  const inn = curInnings();
  const copy = JSON.parse(JSON.stringify(inn));
  copy.history = [];
  inn.history.push(copy);
  if (inn.history.length > 40) inn.history.shift();
}

module.exports = {
  freshMatch,
  freshInnings,
  getState,
  setState,
  curInnings,
  isGuest,
  snapshot,
};
