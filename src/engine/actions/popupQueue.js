// Popup queue (new-batsman / over-summary / next-bowler) and bowler
// rotation. Ported from js/app.js.
const { getState, curInnings } = require('../state');
const { currentBowler } = require('../helpers');
const { commit } = require('../store');

function advancePopupQueue() {
  const state = getState();
  if (state.popupQueue && state.popupQueue.length) {
    state.playerPopup = state.popupQueue.shift();
    state.playerPopupError = null;
  } else {
    state.playerPopup = null;
  }
  commit();
}

function confirmOverSummary() {
  advancePopupQueue();
}

// name replaces the source's document.getElementById('popBatsman').value
// read. A blank field falls back to the same 'Batsman N' placeholder shown
// in the input, rather than blocking with a required-field error.
function confirmBatsmanPopup(name) {
  const inn = curInnings();
  const val = (name || '').trim() || 'Batsman ' + inn.nextBatNum;
  const newBat = { name: val, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, howOut: '' };
  inn.nextBatNum += 1;
  inn.batsmen.push(newBat);
  const newIdx = inn.batsmen.length - 1;
  if (inn.batsmen[inn.strikerIdx].out) {
    inn.strikerIdx = newIdx;
  } else if (inn.batsmen[inn.nonStrikerIdx].out) {
    inn.nonStrikerIdx = newIdx;
  } else {
    inn.strikerIdx = newIdx;
  }
  advancePopupQueue();
}

// Case-insensitive, trimmed identity -- matches same-named bowlers into a
// single stats entry.
function findOrCreateBowler(inn, name) {
  const lower = name.trim().toLowerCase();
  for (let i = 0; i < inn.bowlers.length; i++) {
    if (inn.bowlers[i].name.trim().toLowerCase() === lower) return i;
  }
  inn.bowlers.push({ name: name.trim(), balls: 0, runs: 0, wickets: 0, maidens: 0 });
  return inn.bowlers.length - 1;
}

// Only rule enforced: can't bowl the over immediately after your own,
// case-insensitive/trimmed. A blank field falls back to a numbered
// 'Bowler N' placeholder (matching the input's placeholder text) rather
// than blocking with a required-field error -- numbered so consecutive
// blank submissions don't all collapse into one findOrCreateBowler() entry
// and corrupt separate bowlers' figures.
function setNextBowler(rawName) {
  const state = getState();
  const inn = curInnings();
  const name = (rawName || '').trim() || 'Bowler ' + (inn.bowlers.length + 1);
  const prevName = currentBowler(inn).name.trim().toLowerCase();
  if (name.toLowerCase() === prevName) {
    state.playerPopupError = "A bowler can't bowl two overs in a row. Pick a different bowler.";
    commit();
    return;
  }
  inn.bowlerIdx = findOrCreateBowler(inn, name);
  advancePopupQueue();
}

function selectBowlerChip(name) {
  setNextBowler(name);
}

// Bowlers eligible for the next-over chip list: excludes the bowler who
// just bowled and de-duplicates case-insensitively, preserving first-seen casing.
function priorBowlerNames(inn) {
  const prevLower = currentBowler(inn).name.trim().toLowerCase();
  const seen = {};
  const out = [];
  inn.bowlers.forEach(function (b) {
    const lower = b.name.trim().toLowerCase();
    if (lower === prevLower || seen[lower]) return;
    seen[lower] = true;
    out.push(b.name);
  });
  return out;
}

module.exports = {
  advancePopupQueue,
  confirmOverSummary,
  confirmBatsmanPopup,
  findOrCreateBowler,
  setNextBowler,
  selectBowlerChip,
  priorBowlerNames,
};
