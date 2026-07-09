const test = require('node:test');
const assert = require('node:assert/strict');
const { installDomStub } = require('./helpers/domStub');

installDomStub();
const app = require('../js/app.js');

test('parseBallRuns reads plain runs, wides, no-balls, byes and leg-byes', () => {
  assert.equal(app.parseBallRuns('0'), 0);
  assert.equal(app.parseBallRuns('4'), 4);
  assert.equal(app.parseBallRuns('W'), 0);
  assert.equal(app.parseBallRuns('wd'), 1);
  assert.equal(app.parseBallRuns('wd2'), 2);
  assert.equal(app.parseBallRuns('nb'), 1);
  assert.equal(app.parseBallRuns('nb4'), 5);
  assert.equal(app.parseBallRuns('b2'), 2);
  assert.equal(app.parseBallRuns('lb1'), 1);
});

test('computeOverTotal sums every ball in an over', () => {
  assert.equal(app.computeOverTotal(['1', '4', 'W', '0', 'wd', '6']), 12);
});

test('isMaidenOver is true for an over with only dot balls and wickets', () => {
  assert.equal(app.isMaidenOver(['0', '0', 'W', '0', '0', '0']), true);
});

test('isMaidenOver stays true when byes/leg-byes are scored off no-shot balls', () => {
  // Runs conceded via byes/leg-byes are never charged to the bowler, so per
  // the Laws of Cricket they don't break a maiden.
  assert.equal(app.isMaidenOver(['0', 'b1', '0', 'lb2', '0', '0']), true);
});

test('isMaidenOver is false when the batter scores off the bat', () => {
  assert.equal(app.isMaidenOver(['0', '0', '1', '0', '0', '0']), false);
});

test('isMaidenOver is false when the over contains a wide or no-ball', () => {
  assert.equal(app.isMaidenOver(['0', '0', '0', '0', '0', 'wd']), false);
  assert.equal(app.isMaidenOver(['0', '0', '0', '0', '0', 'nb']), false);
});

test('oversStr formats legal balls as overs.balls', () => {
  assert.equal(app.oversStr(0), '0.0');
  assert.equal(app.oversStr(5), '0.5');
  assert.equal(app.oversStr(6), '1.0');
  assert.equal(app.oversStr(19), '3.1');
});

test('rate and strikeRate handle zero balls without dividing by zero', () => {
  assert.equal(app.rate(0, 0), '0.00');
  assert.equal(app.strikeRate(0, 0), '0.0');
  assert.equal(app.rate(30, 30), '6.00');
  assert.equal(app.strikeRate(50, 40), '125.0');
});

test('economyRate is runs per over', () => {
  assert.equal(app.economyRate({ runs: 24, balls: 24 }), 6);
  assert.equal(app.economyRate({ runs: 0, balls: 0 }), 0);
});

test('howOutText formats each dismissal type', () => {
  assert.equal(app.howOutText('bowled', 'Kane'), 'b Kane');
  assert.equal(app.howOutText('lbw', 'Kane'), 'lbw b Kane');
  assert.equal(app.howOutText('caught', 'Kane', 'Root', {}), 'c Root b Kane');
  assert.equal(app.howOutText('stumped', 'Kane'), 'st wk b Kane');
  assert.equal(
    app.howOutText('runout', null, 'Root', { runsCompleted: 1, endThrown: 'striker' }),
    "run out (1 run, striker's end/Root)"
  );
});
