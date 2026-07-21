// Ported from the retired web app's test/regressions.test.js. The
// worm-chart regression test now lives in pure-helpers.test.js, next to
// M13's other buildWormChartPoints tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');

test('undoing the last ball from the result screen re-arms match recording', () => {
  // Reproduces: fixing a mistake via "Undo last ball" after the match had
  // already reached the result screen used to leave matchRecorded stuck at
  // true, so the corrected result was silently never saved to history.
  var s = app.freshMatch();
  s.inningsNum = 2;
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.data[2].history.push(app.freshInnings('Team B', 'Team A'));
  s.screen = 'result';
  s.matchRecorded = true;
  app.setState(s);

  app.undoLastBallAndResume();

  var after = app.getState();
  assert.equal(after.screen, 'scoring');
  assert.equal(after.matchRecorded, false, 'the corrected result must be eligible to record again');
});

test('a maiden over still counts when byes are scored off no-shot balls', () => {
  var s = app.freshMatch();
  s.data[1] = app.freshInnings('Team A', 'Team B');
  app.setState(s);
  var inn = app.curInnings();
  inn.thisOver = ['0', 'b1', '0', '0', 'lb1', '0'];
  inn.legalBalls = 6;
  app.checkOverEnd(inn);
  assert.equal(app.currentBowler(inn).maidens, 1);
});
