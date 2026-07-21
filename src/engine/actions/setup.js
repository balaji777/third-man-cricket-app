// Match setup: overs/toss-adjacent config, starting a match, and the
// openers popup. Ported from js/app.js.
const { getState, curInnings, freshInnings, isGuest } = require('../state');
const { commit } = require('../store');

const AUTO_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// The source mints this via Firestore's doc().id (a random ID generated
// client-side, no network round trip) -- generated here in plain JS instead
// so engine/* doesn't need the Firestore SDK to stay RN-free for
// `node --test`. Any sufficiently-random unique string works equally well
// as a Firestore document id; the SDK's own algorithm isn't required.
function generateMatchId() {
  let id = '';
  for (let i = 0; i < 20; i++) {
    id += AUTO_ID_CHARS.charAt(Math.floor(Math.random() * AUTO_ID_CHARS.length));
  }
  return id;
}

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
  if (state.user && !isGuest() && !state.matchId) {
    state.matchId = generateMatchId();
  }
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
