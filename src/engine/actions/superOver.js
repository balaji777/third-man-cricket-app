// Super Over: engine actions for a tied match's decider, ported from
// js/app.js. A super over innings uses a simpler shape than the main
// innings model (single striker/non-striker/bowler name, no separate
// batting/bowling card, no over boundaries) since it's always exactly one
// over per side.
const { getState } = require('../state');
const { computeAutoMOTM } = require('../helpers');
const { commit } = require('../store');

function freshSOInnings(battingName, bowlingName) {
  return {
    battingName: battingName,
    bowlingName: bowlingName,
    runs: 0,
    wickets: 0,
    balls: 0,
    log: [],
    extras: { wd: 0, nb: 0, b: 0, lb: 0 },
    strikerName: '',
    nonStrikerName: '',
    bowlerName: '',
    namesConfirmed: false,
    history: [],
  };
}

function curSOInnings() {
  const state = getState();
  return state.superOver.data[state.superOver.inningsNum];
}

function soExtrasTotal(inn) {
  return inn.extras.wd + inn.extras.nb + inn.extras.b + inn.extras.lb;
}

function startSuperOver() {
  const state = getState();
  const inn1 = state.data[1];
  const inn2 = state.data[2];
  const round = state.superOver && state.superOver.round ? state.superOver.round + 1 : 1;
  const battingFirstTeam = inn2.battingName;
  const bowlingFirstTeam = inn1.battingName;
  state.superOver = {
    active: true,
    round: round,
    battingFirstTeam: battingFirstTeam,
    bowlingFirstTeam: bowlingFirstTeam,
    inningsNum: 1,
    target: null,
    winner: null,
    data: {
      1: freshSOInnings(battingFirstTeam, bowlingFirstTeam),
      2: null,
    },
  };
  state.screen = 'superOverScoring';
  state.soNamesPopup = true;
  commit();
}

function acceptTieAsResult() {
  const state = getState();
  if (state.superOver && !state.superOver.winner) {
    state.superOverTiedFinal = true;
  }
  state.screen = 'result';
  state.manOfMatch = computeAutoMOTM();
  commit();
}

// strikerName/nonStrikerName/bowlerName replace the source's
// document.getElementById(...).value reads, same as confirmOpeners.
// A blank field falls back to the placeholder shown in that field
// ('Striker name'/'Non-striker name'/'Bowler name') rather than blocking
// with a required-field error, matching confirmOpeners' behavior.
function confirmSONames(strikerName, nonStrikerName, bowlerName) {
  const state = getState();
  const inn = curSOInnings();
  const s = (strikerName || '').trim() || 'Striker name';
  const ns = (nonStrikerName || '').trim() || 'Non-striker name';
  const bw = (bowlerName || '').trim() || 'Bowler name';
  inn.strikerName = s;
  inn.nonStrikerName = ns;
  inn.bowlerName = bw;
  inn.namesConfirmed = true;
  state.soNamesPopup = false;
  state.playerPopupError = null;
  commit();
}

function soSnapshot() {
  const inn = curSOInnings();
  const copy = JSON.parse(JSON.stringify(inn));
  copy.history = [];
  inn.history.push(copy);
}

function superOverUndo() {
  const state = getState();
  const inn = curSOInnings();
  if (inn.history.length === 0) return;
  const prev = inn.history.pop();
  const keep = inn.history;
  prev.history = keep;
  state.superOver.data[state.superOver.inningsNum] = prev;
  commit();
}

function soCheckEnd() {
  const state = getState();
  const inn = curSOInnings();
  const so = state.superOver;
  const done =
    inn.balls >= 6 ||
    inn.wickets >= 2 ||
    (so.inningsNum === 2 && so.target !== null && inn.runs >= so.target);
  if (!done) return;
  if (so.inningsNum === 1) {
    so.target = inn.runs + 1;
    so.inningsNum = 2;
    so.data[2] = freshSOInnings(so.bowlingFirstTeam, so.battingFirstTeam);
    state.soNamesPopup = true;
  } else {
    const s1 = so.data[1].runs;
    const s2 = so.data[2].runs;
    if (s2 > s1) {
      so.winner = so.data[2].battingName;
    } else if (s1 > s2) {
      so.winner = so.data[1].battingName;
    } else {
      state.screen = 'superOverTiedAgain';
      return;
    }
    state.screen = 'result';
    state.manOfMatch = computeAutoMOTM();
  }
}

function superOverAddRuns(n) {
  soSnapshot();
  const inn = curSOInnings();
  inn.runs += n;
  inn.balls += 1;
  inn.log.push(String(n));
  soCheckEnd();
  commit();
}

function superOverWicket() {
  soSnapshot();
  const inn = curSOInnings();
  inn.wickets += 1;
  inn.balls += 1;
  inn.log.push('W');
  soCheckEnd();
  commit();
}

function openSOExtraPopup(type) {
  const state = getState();
  state.soExtraPopup = { type: type };
  commit();
}

function closeSOExtraPopup() {
  const state = getState();
  state.soExtraPopup = null;
  commit();
}

// n = runs run beyond the extra itself, same convention as the main
// engine's confirmExtra. wd/nb don't advance inn.balls (illegal deliveries);
// b/lb do.
function confirmSOExtra(n) {
  const state = getState();
  const type = state.soExtraPopup.type;
  soSnapshot();
  const inn = curSOInnings();
  if (type === 'wd') {
    const total = n + 1;
    inn.runs += total;
    inn.extras.wd += total;
    inn.log.push(n === 0 ? 'wd' : 'wd' + total);
  } else if (type === 'nb') {
    const nbTotal = n + 1;
    inn.runs += nbTotal;
    inn.extras.nb += 1;
    inn.log.push(n > 0 ? 'nb' + n : 'nb');
  } else if (type === 'b') {
    inn.runs += n;
    inn.extras.b += n;
    inn.balls += 1;
    inn.log.push('b' + n);
  } else if (type === 'lb') {
    inn.runs += n;
    inn.extras.lb += n;
    inn.balls += 1;
    inn.log.push('lb' + n);
  }
  state.soExtraPopup = null;
  soCheckEnd();
  commit();
}

module.exports = {
  freshSOInnings,
  curSOInnings,
  soExtrasTotal,
  startSuperOver,
  acceptTieAsResult,
  confirmSONames,
  superOverUndo,
  soCheckEnd,
  superOverAddRuns,
  superOverWicket,
  openSOExtraPopup,
  closeSOExtraPopup,
  confirmSOExtra,
};
