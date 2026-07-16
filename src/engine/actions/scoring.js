// Ball-by-ball scoring: runs, extras, over completion, and the central
// afterBall() dispatcher. Ported near-verbatim from js/app.js.
const { getState, curInnings, snapshot } = require('../state');
const { striker, currentBowler, isMaidenOver, computeOverTotal } = require('../helpers');
const { commit } = require('../store');
const { checkInningsEnd } = require('./innings');
const { advancePopupQueue } = require('./popupQueue');

function swapStrike(inn) {
  const t = inn.strikerIdx;
  inn.strikerIdx = inn.nonStrikerIdx;
  inn.nonStrikerIdx = t;
}

// Triggers when a multiple of 6 legal balls have been bowled. Always swaps
// strike at over-end regardless of the last ball's own odd-run swap (net
// effect: standard "batsmen cross between overs" rule).
function checkOverEnd(inn) {
  if (inn.legalBalls > 0 && inn.legalBalls % 6 === 0) {
    if (isMaidenOver(inn.thisOver)) {
      currentBowler(inn).maidens += 1;
    }
    inn.overHistory.push(inn.thisOver);
    inn.overBowlers.push(currentBowler(inn).name);
    inn.thisOver = [];
    swapStrike(inn);
    return true;
  }
  return false;
}

function addRuns(n) {
  snapshot();
  const inn = curInnings();
  const bat = striker(inn);
  inn.runs += n;
  bat.runs += n;
  bat.balls += 1;
  if (n === 4) bat.fours += 1;
  if (n === 6) bat.sixes += 1;
  inn.legalBalls += 1;
  const bwl = currentBowler(inn);
  bwl.balls += 1;
  bwl.runs += n;
  inn.thisOver.push(String(n));
  if (n % 2 === 1) swapStrike(inn);
  const overDone = checkOverEnd(inn);
  afterBall(overDone, false);
}

function openExtraPopup(type) {
  const state = getState();
  state.extraPopup = { type: type };
  commit();
}

function closeExtraPopup() {
  const state = getState();
  state.extraPopup = null;
  commit();
}

// n = runs run/scored beyond the extra itself (e.g. byes taken off a wide).
// Wide/no-ball are illegal deliveries (no legalBalls/bwl.balls increment);
// no-ball uniquely still counts as a ball faced by the striker. Byes/leg-byes
// ARE legal deliveries but credit zero runs to the batsman personally.
function confirmExtra(n) {
  const state = getState();
  const type = state.extraPopup.type;
  snapshot();
  const inn = curInnings();
  const bwl = currentBowler(inn);
  let overDone = false;
  if (type === 'wd') {
    const total = n + 1;
    inn.runs += total;
    bwl.runs += total;
    inn.extras.wd += total;
    inn.thisOver.push(n === 0 ? 'wd' : 'wd' + total);
    if (n % 2 === 1) swapStrike(inn);
  } else if (type === 'nb') {
    const batRuns = n;
    const nbTotal = n + 1;
    inn.runs += nbTotal;
    bwl.runs += nbTotal;
    inn.extras.nb += 1;
    const bat = striker(inn);
    bat.balls += 1;
    if (batRuns > 0) {
      bat.runs += batRuns;
      if (batRuns === 4) bat.fours += 1;
      if (batRuns === 6) bat.sixes += 1;
    }
    inn.thisOver.push(batRuns > 0 ? 'nb' + batRuns : 'nb');
    if (batRuns % 2 === 1) swapStrike(inn);
  } else if (type === 'b') {
    inn.runs += n;
    inn.extras.b += n;
    inn.legalBalls += 1;
    bwl.balls += 1;
    striker(inn).balls += 1;
    inn.thisOver.push('b' + n);
    if (n % 2 === 1) swapStrike(inn);
    overDone = checkOverEnd(inn);
  } else if (type === 'lb') {
    inn.runs += n;
    inn.extras.lb += n;
    inn.legalBalls += 1;
    bwl.balls += 1;
    striker(inn).balls += 1;
    inn.thisOver.push('lb' + n);
    if (n % 2 === 1) swapStrike(inn);
    overDone = checkOverEnd(inn);
  }
  state.extraPopup = null;
  afterBall(overDone, false);
}

// Central post-ball dispatcher. checkInningsEnd() always runs first and
// takes precedence -- if it ends the innings/match, no batsman/over-summary/
// bowler popups are queued at all, even if a wicket or over-end also
// happened on this exact ball.
function afterBall(overJustCompleted, wicketNeedsBatsman) {
  const state = getState();
  checkInningsEnd();
  if (state.screen === 'scoring' && (wicketNeedsBatsman || overJustCompleted)) {
    const inn = curInnings();
    const queue = [];
    if (wicketNeedsBatsman) queue.push({ type: 'batsman' });
    if (overJustCompleted) {
      const lastOver = inn.overHistory[inn.overHistory.length - 1];
      queue.push({
        type: 'overSummary',
        overRuns: computeOverTotal(lastOver),
        totalScore: inn.runs,
        totalWkts: inn.wickets,
      });
      queue.push({ type: 'bowler' });
    }
    state.popupQueue = queue;
    advancePopupQueue();
    return;
  }
  commit();
}

// undo-stack pop-and-restore: preserves the remaining history array (after
// popping) onto the restored innings, since the popped snapshot's own
// history was stripped at snapshot() time.
function undo() {
  const state = getState();
  const inn = curInnings();
  if (inn.history.length === 0) return;
  const prev = inn.history.pop();
  const keepHistory = inn.history;
  state.data[state.inningsNum] = prev;
  state.data[state.inningsNum].history = keepHistory;
  commit();
}

// Same pop mechanics as undo(), but also un-ends an innings that had just
// concluded and jumps back to the scoring screen regardless of current
// screen, clearing the completion side-effects it triggered.
function undoLastBallAndResume() {
  const state = getState();
  const inn = curInnings();
  if (inn.history.length === 0) return;
  const prev = inn.history.pop();
  const keepHistory = inn.history;
  prev.history = keepHistory;
  prev.ended = false;
  prev.endTime = null;
  state.data[state.inningsNum] = prev;
  state.screen = 'scoring';
  if (state.inningsNum === 1) {
    state.target = null;
  } else {
    state.manOfMatch = null;
    state.matchRecorded = false;
  }
  commit();
}

module.exports = {
  swapStrike,
  checkOverEnd,
  addRuns,
  openExtraPopup,
  closeExtraPopup,
  confirmExtra,
  afterBall,
  undo,
  undoLastBallAndResume,
};
