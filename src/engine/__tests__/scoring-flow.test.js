// Ported from the retired web app's test/scoring-flow.test.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');

function newInningsState(overs, wicketsLimit) {
  var s = app.freshMatch();
  s.overs = overs;
  s.wicketsLimit = wicketsLimit;
  s.battingFirst = 'A';
  s.inningsNum = 1;
  s.screen = 'scoring';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  app.setState(s);
  return s;
}

test('addRuns credits the striker and swaps strike on odd runs', () => {
  newInningsState(20, 10);
  app.addRuns(1);
  var inn = app.curInnings();
  assert.equal(inn.runs, 1);
  assert.equal(inn.batsmen[0].runs, 1);
  assert.equal(inn.batsmen[0].balls, 1);
  assert.equal(inn.strikerIdx, 1, 'strike should rotate after an odd run');
});

test('addRuns does not swap strike on even runs', () => {
  newInningsState(20, 10);
  app.addRuns(4);
  var inn = app.curInnings();
  assert.equal(inn.runs, 4);
  assert.equal(inn.batsmen[0].fours, 1);
  assert.equal(inn.strikerIdx, 0);
});

test('a bye is credited to the team and legal ball count, not to the bowler', () => {
  var s = newInningsState(20, 10);
  s.extraPopup = { type: 'b' };
  app.confirmExtra(2);
  var inn = app.curInnings();
  assert.equal(inn.runs, 2);
  assert.equal(inn.extras.b, 2);
  assert.equal(inn.legalBalls, 1);
  assert.equal(app.currentBowler(inn).runs, 0, "byes aren't charged to the bowler's figures");
});

test('a wide adds the automatic run plus any run scored, and counts as an extra ball', () => {
  var s = newInningsState(20, 10);
  s.extraPopup = { type: 'wd' };
  app.confirmExtra(1);
  var inn = app.curInnings();
  assert.equal(inn.runs, 2);
  assert.equal(inn.extras.wd, 2);
  assert.equal(inn.legalBalls, 0, 'a wide is not a legal delivery');
  assert.equal(app.currentBowler(inn).runs, 2);
});

test('finalizeWicket records the dismissal and credits the bowler', () => {
  var s = newInningsState(20, 10);
  s.dismissalPopup = null;
  app.finalizeWicket('bowled', null);
  var inn = app.curInnings();
  assert.equal(inn.wickets, 1);
  assert.equal(inn.batsmen[0].out, true);
  assert.match(inn.batsmen[0].howOut, /^b /);
  assert.equal(app.currentBowler(inn).wickets, 1);
});

test('a run-out does not credit the bowler with a wicket', () => {
  var s = newInningsState(20, 10);
  s.dismissalPopup = { runsCompleted: 1, whoOutIdx: 0, endThrown: 'striker' };
  app.finalizeWicket('runout', 'Root');
  var inn = app.curInnings();
  assert.equal(inn.wickets, 1);
  assert.equal(app.currentBowler(inn).wickets, 0);
});

test('setNextBowler rejects the same bowler for consecutive overs', () => {
  newInningsState(20, 10);
  var inn = app.curInnings();
  var priorName = app.currentBowler(inn).name;
  app.setNextBowler(priorName);
  assert.equal(
    app.getState().playerPopupError,
    "A bowler can't bowl two overs in a row. Pick a different bowler."
  );
});

test('an innings ends once the overs limit is bowled', () => {
  newInningsState(1, 10);
  var inn = app.curInnings();
  for (var i = 0; i < 5; i++) app.addRuns(0);
  assert.equal(app.getState().screen, 'scoring');
  app.addRuns(0);
  assert.equal(inn.ended, true);
  assert.equal(app.getState().screen, 'break');
});

test('the second innings ends the moment the target is chased down', () => {
  var s = newInningsState(20, 10);
  s.inningsNum = 2;
  s.target = 5;
  s.data[2] = app.freshInnings('Team B', 'Team A');
  app.setState(s);
  app.addRuns(4);
  assert.equal(app.getState().screen, 'scoring');
  app.addRuns(1);
  assert.equal(app.getState().screen, 'result', 'reaching the target should end the chase mid-over');
});

test('undo reverts the last scored ball', () => {
  newInningsState(20, 10);
  app.addRuns(4);
  app.addRuns(1);
  assert.equal(app.curInnings().runs, 5);
  app.undo();
  assert.equal(app.curInnings().runs, 4);
});
