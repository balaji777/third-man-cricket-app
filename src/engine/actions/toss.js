// Toss popup step machine (state.tossOpen/tossStep), ported from js/app.js.
//
// pickTossWinner's 900ms reveal delay is UI timing, not scoring logic, but
// is kept exactly as the source had it (screens will drive the same
// ask -> animating -> choose sequence).
const { getState } = require('../state');
const { commit } = require('../store');

function openTossPopup() {
  const state = getState();
  state.tossOpen = true;
  state.tossStep = 'ask';
  state.tossWinner = null;
  state.tossChoice = null;
  commit();
}

function closeTossPopup() {
  const state = getState();
  state.tossOpen = false;
  commit();
}

function pickTossWinner(team) {
  const state = getState();
  state.tossWinner = team;
  state.tossStep = 'animating';
  commit();
  setTimeout(function () {
    getState().tossStep = 'choose';
    commit();
  }, 900);
}

function chooseTossOption(opt) {
  const state = getState();
  state.tossChoice = opt;
  if (opt === 'bat') {
    state.battingFirst = state.tossWinner;
  } else {
    state.battingFirst = state.tossWinner === 'A' ? 'B' : 'A';
  }
  state.tossOpen = false;
  commit();
}

module.exports = { openTossPopup, closeTossPopup, pickTossWinner, chooseTossOption };
