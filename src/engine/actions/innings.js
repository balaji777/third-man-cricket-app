// Innings/match completion, ported from js/app.js.
//
// Phase 1 simplification: the source routes a tie in innings 2 to
// screen='superOverIntro' (both here and in endInningsEarly). Super overs
// are deferred, so a tie routes straight to 'result' instead -- matchResultText's
// existing "Match tied" branch needs no changes, only this routing does.
const { getState, setState, curInnings, snapshot, freshInnings, freshMatch } = require('../state');
const { computeAutoMOTM } = require('../helpers');
const { commit, triggerClear } = require('../store');
const { openOpenersPopup } = require('./setup');

function checkInningsEnd() {
  const state = getState();
  const inn = curInnings();
  const oversDone = inn.legalBalls >= state.overs * 6;
  const allOut = inn.wickets >= state.wicketsLimit;
  const targetChased = state.inningsNum === 2 && state.target !== null && inn.runs >= state.target;
  if (oversDone || allOut || targetChased) {
    inn.ended = true;
    inn.endTime = Date.now();
    if (state.inningsNum === 1) {
      state.target = inn.runs + 1;
      state.screen = 'break';
    } else {
      // Source: else-if(inn.runs === state.target-1) -> 'superOverIntro'.
      // Phase 1: both a win and a tie go straight to 'result'.
      state.screen = 'result';
      state.manOfMatch = computeAutoMOTM();
    }
  }
}

// Lives here (not setup.js) because it calls checkInningsEnd -- co-locating
// avoids a circular import (setup.js's openOpenersPopup is needed by
// startSecondInnings below, so this file already depends on setup.js).
function updateWicketsLimit(val) {
  const state = getState();
  const inn = curInnings();
  let n = parseInt(val, 10) || state.wicketsLimit;
  if (n < inn.wickets) n = inn.wickets;
  if (n > 10) n = 10;
  state.wicketsLimit = n;
  checkInningsEnd();
  commit();
}

function endInningsEarly() {
  const state = getState();
  snapshot();
  const inn = curInnings();
  inn.ended = true;
  inn.endTime = Date.now();
  if (state.inningsNum === 1) {
    state.target = inn.runs + 1;
    state.screen = 'break';
  } else {
    state.screen = 'result';
    state.manOfMatch = computeAutoMOTM();
  }
  commit();
}

function startSecondInnings() {
  const state = getState();
  const prevInn = state.data[1];
  const battingName = prevInn.bowlingName;
  const bowlingName = prevInn.battingName;
  state.data[2] = freshInnings(battingName, bowlingName);
  state.inningsNum = 2;
  state.screen = 'scoring';
  openOpenersPopup();
}

function toggleInningsCard(n) {
  const state = getState();
  state.showInningsCard[n] = !state.showInningsCard[n];
  commit();
}

function newMatch() {
  const state = getState();
  const keepTheme = state.theme;
  const keepUser = state.user;
  const keepAuthReady = state.authReady;
  const keepHistoryCache = state.matchHistoryCache;
  triggerClear();
  const fresh = freshMatch();
  fresh.theme = keepTheme;
  fresh.user = keepUser;
  fresh.authReady = keepAuthReady;
  fresh.matchHistoryCache = keepHistoryCache;
  setState(fresh);
  commit();
}

module.exports = {
  checkInningsEnd,
  updateWicketsLimit,
  endInningsEarly,
  startSecondInnings,
  toggleInningsCard,
  newMatch,
};
