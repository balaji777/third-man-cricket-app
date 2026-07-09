// Regression tests for bugs found in a scoring-logic audit. Each test fails
// against the pre-fix code and passes against the fixed js/app.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const { installDomStub } = require('./helpers/domStub');

installDomStub();
const app = require('../js/app.js');

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

test('the run-rate chart includes the partial over left in progress when an innings ends', () => {
  // Reproduces: buildWormChartSVG only summed inn.overHistory, so whatever
  // partial over was in flight when an innings ended (all out or target
  // chased mid-over) was dropped from the graph entirely.
  var s = app.freshMatch();
  var inn1 = app.freshInnings('Team A', 'Team B');
  inn1.overHistory = [['4', '4']]; // 8 runs across one completed over
  inn1.thisOver = ['4', '6']; // 10 more runs, over still in progress
  var inn2 = app.freshInnings('Team B', 'Team A');
  inn2.overHistory = [['4'], ['4']]; // 8 runs, innings ended on the over boundary
  inn2.thisOver = [];
  s.data[1] = inn1;
  s.data[2] = inn2;
  app.setState(s);

  var svg = app.buildWormChartSVG();
  var points = [...svg.matchAll(/points="([^"]*)"/g)].map((m) => m[1]);
  assert.equal(points.length, 2, 'expected one polyline per innings');

  var team1Points = points[0].trim().split(' ');
  var lastPoint = team1Points[team1Points.length - 1].split(',').map(Number);
  var lastY = lastPoint[1];

  // Chart y-axis: padT=12 is the top (max value). If the partial over's 10
  // runs were dropped, team1's true total (18) would never be plotted and
  // the last point would sit well below the top of the chart.
  assert.ok(lastY < 13, `expected the final point near the top of the chart, got y=${lastY}`);
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
