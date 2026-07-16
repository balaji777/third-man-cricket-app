// Match setup: overs/toss-adjacent config, starting a match, and the
// openers popup. Ported from js/app.js.
//
// The source's startMatch() also mints a Firestore live-match doc id here
// (state.matchId) -- that's live-sync scaffolding, out of Phase 1 scope, so
// state.matchId is simply left null (its default from freshMatch).
const { getState, curInnings, freshInnings } = require('../state');
const { commit } = require('../store');

function setOvers(o) {
  const state = getState();
  state.overs = o;
  state.powerplayOvers = Math.min(6, o);
  commit();
}

function startMatch() {
  const state = getState();
  const battingName = state.battingFirst === 'A' ? state.teamA : state.teamB;
  const bowlingName = state.battingFirst === 'A' ? state.teamB : state.teamA;
  state.data[1] = freshInnings(battingName, bowlingName);
  state.inningsNum = 1;
  state.screen = 'scoring';
  openOpenersPopup();
}

function openOpenersPopup() {
  const state = getState();
  state.playerPopup = { type: 'openers' };
  commit();
}

// strikerName/nonStrikerName/bowlerName replace the source's
// document.getElementById(...).value reads -- the RN openers popup passes
// controlled TextInput values in directly.
function confirmOpeners(strikerName, nonStrikerName, bowlerName) {
  const state = getState();
  const inn = curInnings();
  const s = (strikerName || '').trim();
  const ns = (nonStrikerName || '').trim();
  const bw = (bowlerName || '').trim();
  if (s === '' || ns === '' || bw === '') {
    state.playerPopupError = 'Please fill in all three names.';
    commit();
    return;
  }
  inn.batsmen[0].name = s;
  inn.batsmen[1].name = ns;
  inn.bowlers[0].name = bw;
  inn.startTime = Date.now();
  state.playerPopup = null;
  state.playerPopupError = null;
  commit();
}

module.exports = { setOvers, startMatch, openOpenersPopup, confirmOpeners };
