// Tests for Phase 1's deliberate deviations from the source js/app.js, not
// covered by the ported test suite (which predates these changes).
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');

function newSecondInningsState(target) {
  var s = app.freshMatch();
  s.overs = 1;
  s.wicketsLimit = 10;
  s.inningsNum = 2;
  s.target = target;
  s.screen = 'scoring';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[2] = app.freshInnings('Team B', 'Team A');
  app.setState(s);
  return s;
}

test('a tie in the second innings routes straight to result, not a super over (deferred to a later phase)', () => {
  newSecondInningsState(5);
  app.addRuns(4);
  assert.equal(app.getState().screen, 'scoring');
  // One more run ties the scores at target-1 (4) -- the source would route
  // this to 'superOverIntro'; Phase 1 goes straight to 'result'.
  for (var i = 0; i < 5; i++) app.addRuns(0);
  assert.equal(app.getState().screen, 'result');
  assert.equal(app.matchResultText(), 'Match tied');
});

test('ending the second innings early on a tied score also routes to result', () => {
  newSecondInningsState(5);
  app.addRuns(4);
  app.endInningsEarly();
  assert.equal(app.getState().screen, 'result');
  assert.equal(app.matchResultText(), 'Match tied');
});
