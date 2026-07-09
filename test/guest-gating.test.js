// Guests get the core scoring experience plus PDF export, but the
// leaderboard and sharing are reserved for signed-in users, and a guest
// gets a one-time-per-match nudge to sign in once they reach the result
// screen. See the "reflective-wiggling-kazoo" plan for the full rationale.
const test = require('node:test');
const assert = require('node:assert/strict');
const { installDomStub } = require('./helpers/domStub');

installDomStub();
const app = require('../js/app.js');

function baseMatchState(userOverrides) {
  var s = app.freshMatch();
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.user = Object.assign({ uid: 'u1', isAnonymous: false }, userOverrides || {});
  return s;
}

test('isGuest is true only for anonymous Firebase users', () => {
  var s = baseMatchState({ isAnonymous: true });
  app.setState(s);
  assert.equal(app.isGuest(), true);

  s = baseMatchState({ isAnonymous: false });
  app.setState(s);
  assert.equal(app.isGuest(), false);

  s = baseMatchState();
  s.user = null;
  app.setState(s);
  assert.equal(app.isGuest(), false, 'no user at all is not a guest (still resolving auth)');
});

test('openLeaderboard refuses to navigate for a guest', () => {
  var s = baseMatchState({ isAnonymous: true });
  s.screen = 'setup';
  app.setState(s);

  app.openLeaderboard();

  assert.equal(app.getState().screen, 'setup', 'guests cannot reach the leaderboard screen');
});

test('openLeaderboard navigates normally for a signed-in user', () => {
  var s = baseMatchState({ isAnonymous: false });
  s.screen = 'setup';
  app.setState(s);

  app.openLeaderboard();

  assert.equal(app.getState().screen, 'leaderboard');
});

test('reaching the result screen as a guest opens the sign-in nudge once', () => {
  var s = baseMatchState({ isAnonymous: true });
  s.screen = 'result';
  app.setState(s);

  app.render();
  assert.equal(app.getState().guestUpsellOpen, true);
  assert.equal(app.getState().guestUpsellSeen, true);

  app.closeGuestUpsell();
  assert.equal(app.getState().guestUpsellOpen, false);

  // Re-rendering the same result screen (e.g. a theme toggle) must not
  // resurrect a popup the guest already dismissed for this match.
  app.render();
  assert.equal(app.getState().guestUpsellOpen, false);
});

test('the sign-in nudge never opens for a signed-in user', () => {
  var s = baseMatchState({ isAnonymous: false });
  s.screen = 'result';
  app.setState(s);

  app.render();

  assert.equal(app.getState().guestUpsellOpen, false);
});

function stateWithPlayedInnings(userOverrides) {
  var s = baseMatchState(userOverrides);
  var matchStart = new Date(2026, 0, 1, 16, 0, 0).getTime(); // 4:00 PM
  var matchEnd = new Date(2026, 0, 1, 18, 0, 0).getTime(); // 6:00 PM
  s.data[1].batsmen[0].runs = 50;
  s.data[1].batsmen[0].balls = 30;
  s.data[1].startTime = matchStart;
  s.data[1].endTime = matchStart + 60000;
  s.data[2].bowlers[0].balls = 24;
  s.data[2].bowlers[0].wickets = 3;
  s.data[2].endTime = matchEnd;
  s.manOfMatch = 'Alice';
  return s;
}

test('the exported PDF drops the innings time line, Top performers, and match duration for a guest', () => {
  var s = stateWithPlayedInnings({ isAnonymous: true });
  app.setState(s);

  var html = app.buildMatchPrintHTML();

  assert.doesNotMatch(html, /Started/, 'guest PDF should not show start/finish times');
  assert.doesNotMatch(html, /Top performers/, 'guest PDF should not show the Top performers section');
  assert.doesNotMatch(html, /Best batting/);
  assert.match(html, /Player of the Match/, 'Player of the Match should still be shown to guests');
});

test('the exported PDF keeps the time line and Top performers for a signed-in user', () => {
  var s = stateWithPlayedInnings({ isAnonymous: false });
  app.setState(s);

  var html = app.buildMatchPrintHTML();

  assert.match(html, /Started/);
  assert.match(html, /Top performers/);
  assert.match(html, /Best batting/);
  assert.match(html, /Player of the Match/);
});

test('the exported PDF shows overall match start/finish/duration for a signed-in user', () => {
  var s = stateWithPlayedInnings({ isAnonymous: false });
  app.setState(s);

  var html = app.buildMatchPrintHTML();

  assert.match(html, /Started 4:00 PM/);
  assert.match(html, /finished 6:00 PM/);
  assert.match(html, /took 2h 0m/);
});

test('the exported PDF omits the overall match duration line for a guest', () => {
  var s = stateWithPlayedInnings({ isAnonymous: true });
  app.setState(s);

  var html = app.buildMatchPrintHTML();

  assert.doesNotMatch(html, /took 2h 0m/);
});
