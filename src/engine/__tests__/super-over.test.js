// Tests for the Super Over engine actions (engine/actions/superOver.js),
// ported from js/app.js's startSuperOver/superOverAddRuns/superOverWicket/
// soCheckEnd/etc. No equivalent test file exists in the retired web app's
// test suite -- written fresh.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');

function tiedMatchState(target) {
  var s = app.freshMatch();
  s.overs = 1;
  s.wicketsLimit = 10;
  s.inningsNum = 2;
  s.target = target;
  s.screen = 'scoring';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].runs = target - 1;
  s.data[2] = app.freshInnings('Team B', 'Team A');
  app.setState(s);
  return s;
}

function startAndNameSuperOver(target) {
  var s = tiedMatchState(target);
  s.screen = 'superOverIntro';
  app.setState(s);
  app.startSuperOver();
  app.confirmSONames('S', 'NS', 'B');
}

test('a tie in the second innings routes to the super over intro, not straight to result', () => {
  tiedMatchState(5);
  app.addRuns(4);
  assert.equal(app.getState().screen, 'scoring');
  for (var i = 0; i < 5; i++) app.addRuns(0);
  assert.equal(app.getState().screen, 'superOverIntro');
});

test('ending the second innings early on a tied score also routes to the super over intro', () => {
  tiedMatchState(5);
  app.addRuns(4);
  app.endInningsEarly();
  assert.equal(app.getState().screen, 'superOverIntro');
});

test('startSuperOver puts the chasing team in to bat first, in a fresh single innings', () => {
  var s = tiedMatchState(20);
  s.screen = 'superOverIntro';
  app.setState(s);
  app.startSuperOver();
  var state = app.getState();
  assert.equal(state.screen, 'superOverScoring');
  assert.equal(state.soNamesPopup, true);
  assert.equal(state.superOver.round, 1);
  assert.equal(state.superOver.inningsNum, 1);
  assert.equal(state.superOver.battingFirstTeam, 'Team B');
  assert.equal(state.superOver.bowlingFirstTeam, 'Team A');
  assert.equal(state.superOver.data[1].battingName, 'Team B');
  assert.equal(state.superOver.data[2], null);
});

test('confirmSONames falls back to placeholder names when blank and accepts trimmed ones', () => {
  var s = tiedMatchState(20);
  s.screen = 'superOverIntro';
  app.setState(s);
  app.startSuperOver();

  app.confirmSONames('', 'Non', 'Bowl');
  var blankInn = app.curSOInnings();
  assert.equal(blankInn.strikerName, 'Striker name', 'blank striker falls back to its placeholder');
  assert.equal(blankInn.namesConfirmed, true);
  assert.equal(app.getState().soNamesPopup, false);

  app.startSuperOver();
  app.confirmSONames(' Striker ', ' Non ', ' Bowl ');
  var inn = app.curSOInnings();
  assert.equal(inn.strikerName, 'Striker');
  assert.equal(inn.nonStrikerName, 'Non');
  assert.equal(inn.bowlerName, 'Bowl');
  assert.equal(inn.namesConfirmed, true);
  assert.equal(app.getState().soNamesPopup, false);
});

test('superOverAddRuns tallies runs and logs the ball', () => {
  startAndNameSuperOver(20);
  app.superOverAddRuns(4);
  app.superOverAddRuns(1);
  var inn = app.curSOInnings();
  assert.equal(inn.runs, 5);
  assert.equal(inn.balls, 2);
  assert.deepEqual(inn.log, ['4', '1']);
});

test('superOverWicket increments wickets and balls, and a second wicket ends the innings', () => {
  startAndNameSuperOver(20);
  app.superOverWicket();
  assert.equal(app.curSOInnings().wickets, 1);
  assert.equal(app.getState().superOver.inningsNum, 1);
  app.superOverWicket();
  var state = app.getState();
  assert.equal(state.superOver.data[1].wickets, 2);
  assert.equal(state.superOver.inningsNum, 2, 'a second wicket ends the over -- innings 2 begins');
  assert.equal(state.soNamesPopup, true);
});

test('the sixth ball ends the innings and sets the chase target', () => {
  startAndNameSuperOver(20);
  for (var i = 0; i < 6; i++) app.superOverAddRuns(1);
  var state = app.getState();
  assert.equal(state.superOver.data[1].runs, 6);
  assert.equal(state.superOver.inningsNum, 2);
  assert.equal(state.superOver.target, 7);
  assert.equal(state.soNamesPopup, true);
});

test('wide and no-ball extras do not advance the ball count; bye and leg-bye do', () => {
  startAndNameSuperOver(20);
  app.openSOExtraPopup('wd');
  app.confirmSOExtra(1);
  var inn = app.curSOInnings();
  assert.equal(inn.runs, 2);
  assert.equal(inn.extras.wd, 2);
  assert.equal(inn.balls, 0);

  app.openSOExtraPopup('nb');
  app.confirmSOExtra(2);
  inn = app.curSOInnings();
  assert.equal(inn.runs, 5);
  assert.equal(inn.extras.nb, 1);
  assert.equal(inn.balls, 0);

  app.openSOExtraPopup('b');
  app.confirmSOExtra(2);
  inn = app.curSOInnings();
  assert.equal(inn.runs, 7);
  assert.equal(inn.extras.b, 2);
  assert.equal(inn.balls, 1);

  app.openSOExtraPopup('lb');
  app.confirmSOExtra(1);
  inn = app.curSOInnings();
  assert.equal(inn.runs, 8);
  assert.equal(inn.extras.lb, 1);
  assert.equal(inn.balls, 2);
});

test('reaching the target in the second super over innings ends it immediately with a winner', () => {
  startAndNameSuperOver(20);
  for (var i = 0; i < 6; i++) app.superOverAddRuns(1); // innings 1: 6 runs off 6 balls, target 7
  app.confirmSONames('S2', 'NS2', 'B2');
  app.superOverAddRuns(6);
  app.superOverAddRuns(1); // 7 runs off just 2 balls -- target reached early
  var state = app.getState();
  assert.equal(state.superOver.winner, state.superOver.data[2].battingName);
  assert.equal(state.screen, 'result');
});

test('a level Super Over routes to the tied-again screen instead of picking a winner', () => {
  startAndNameSuperOver(20);
  for (var i = 0; i < 6; i++) app.superOverAddRuns(1); // innings 1: 6 runs
  app.confirmSONames('S2', 'NS2', 'B2');
  for (var j = 0; j < 6; j++) app.superOverAddRuns(1); // innings 2: also 6 runs
  var state = app.getState();
  assert.equal(state.screen, 'superOverTiedAgain');
  assert.equal(state.superOver.winner, null);
});

test('acceptTieAsResult from a level Super Over marks the match as finally tied', () => {
  startAndNameSuperOver(20);
  for (var i = 0; i < 6; i++) app.superOverAddRuns(1);
  app.confirmSONames('S2', 'NS2', 'B2');
  for (var j = 0; j < 6; j++) app.superOverAddRuns(1);
  assert.equal(app.getState().screen, 'superOverTiedAgain');
  app.acceptTieAsResult();
  var state = app.getState();
  assert.equal(state.screen, 'result');
  assert.equal(state.superOverTiedFinal, true);
  assert.equal(app.matchResultText(), 'Match tied — Super Over also finished level');
});

test('a winning Super Over is reflected in matchResultText and computeMatchWinner', () => {
  startAndNameSuperOver(20);
  for (var i = 0; i < 6; i++) app.superOverAddRuns(1);
  app.confirmSONames('S2', 'NS2', 'B2');
  app.superOverAddRuns(6);
  app.superOverAddRuns(1);
  var state = app.getState();
  assert.equal(app.computeMatchWinner(), state.superOver.winner);
  assert.match(app.matchResultText(), /won the Super Over/);
});

test('superOverUndo pops the last ball and restores the prior tally', () => {
  startAndNameSuperOver(20);
  app.superOverAddRuns(4);
  app.superOverAddRuns(2);
  app.superOverUndo();
  var inn = app.curSOInnings();
  assert.equal(inn.runs, 4);
  assert.equal(inn.balls, 1);
  assert.deepEqual(inn.log, ['4']);
});
