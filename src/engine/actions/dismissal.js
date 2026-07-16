// Dismissal step machine (state.dismissalPopup) and finalizeWicket, the
// actual wicket-scoring mutation. Ported from js/app.js.
//
// Only 5 dismissal types are wired (bowled, lbw, stumped, caught, runout) --
// the source never implemented hit-wicket/retired/obstructing/timed-out, so
// this is not a reduced port, it's the full original set.
const { getState, curInnings, snapshot } = require('../state');
const { striker, currentBowler, howOutText, oversStr } = require('../helpers');
const { commit } = require('../store');
const { checkOverEnd, afterBall } = require('./scoring');

function openDismissalPopup() {
  const state = getState();
  state.dismissalPopup = {
    step: 'type',
    type: null,
    catchType: null,
    runsCompleted: null,
    endThrown: null,
    whoOutIdx: null,
  };
  state.playerPopupError = null;
  commit();
}

function closeDismissalPopup() {
  const state = getState();
  state.dismissalPopup = null;
  commit();
}

function pickDismissalType(type) {
  const state = getState();
  const d = state.dismissalPopup;
  d.type = type;
  state.playerPopupError = null;
  if (type === 'bowled' || type === 'lbw') {
    finalizeWicket(type, null);
  } else if (type === 'stumped') {
    finalizeWicket('stumped', null);
  } else if (type === 'caught') {
    d.step = 'catchType';
    commit();
  } else if (type === 'runout') {
    d.step = 'runoutRuns';
    commit();
  }
}

function pickCatchType(kind) {
  const state = getState();
  state.dismissalPopup.catchType = kind;
  state.dismissalPopup.step = 'fielder';
  commit();
}

function pickRunoutRuns(n) {
  const state = getState();
  state.dismissalPopup.runsCompleted = n;
  state.dismissalPopup.step = 'runoutEnd';
  commit();
}

function pickRunoutEnd(end) {
  const state = getState();
  state.dismissalPopup.endThrown = end;
  state.dismissalPopup.step = 'runoutWho';
  commit();
}

function pickRunoutWho(idx) {
  const state = getState();
  state.dismissalPopup.whoOutIdx = idx;
  state.dismissalPopup.step = 'fielder';
  commit();
}

// fielderName replaces the source's document.getElementById('popFielder')
// read. Mandatory only for catches; optional for run-outs.
function confirmDismissalFielder(fielderName) {
  const state = getState();
  const type = state.dismissalPopup.type;
  const val = (fielderName || '').trim();
  if (type === 'caught' && val === '') {
    state.playerPopupError = "Please enter the fielder's name.";
    commit();
    return;
  }
  finalizeWicket(type, val || null);
}

function finalizeWicket(type, fielderName) {
  const state = getState();
  snapshot();
  const inn = curInnings();
  const d = state.dismissalPopup;
  const bwl = currentBowler(inn);

  const strikerBat = striker(inn);
  strikerBat.balls += 1;
  // Run-out runs completed are always credited to the striker's personal
  // tally, even if the non-striker is the one actually given out.
  if (type === 'runout' && d && d.runsCompleted) {
    inn.runs += d.runsCompleted;
    strikerBat.runs += d.runsCompleted;
  }

  let outIdx = inn.strikerIdx;
  if (type === 'runout' && d && d.whoOutIdx != null) {
    outIdx = d.whoOutIdx;
  }
  const bat = inn.batsmen[outIdx];
  const partnerIdx = outIdx === inn.strikerIdx ? inn.nonStrikerIdx : inn.strikerIdx;
  const partner = inn.batsmen[partnerIdx];

  bat.out = true;
  bat.howOut = howOutText(type, bwl.name, fielderName, d);
  inn.wickets += 1;
  inn.legalBalls += 1;
  bwl.balls += 1;
  // Run-outs are not credited to the bowler's wicket tally.
  if (type !== 'runout') {
    bwl.wickets += 1;
  }
  inn.thisOver.push('W');
  inn.wicketLog.push({
    num: inn.wickets,
    batsman: bat.name,
    partner: partner.name,
    score: inn.runs,
    overs: oversStr(inn.legalBalls),
    legalBallsAtFall: inn.legalBalls,
    partnershipRuns: inn.runs - inn.partnershipStartRuns,
    partnershipBalls: inn.legalBalls - inn.partnershipStartBalls,
  });
  inn.partnershipStartRuns = inn.runs;
  inn.partnershipStartBalls = inn.legalBalls;
  const stillBatting = inn.wickets < state.wicketsLimit;
  const oversLeft = inn.legalBalls < state.overs * 6;
  const needsBatsman = stillBatting && oversLeft;
  const overDone = checkOverEnd(inn);
  state.dismissalPopup = null;
  afterBall(overDone, needsBatsman);
}

module.exports = {
  openDismissalPopup,
  closeDismissalPopup,
  pickDismissalType,
  pickCatchType,
  pickRunoutRuns,
  pickRunoutEnd,
  pickRunoutWho,
  confirmDismissalFielder,
  finalizeWicket,
};
