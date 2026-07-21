// Tests for the RN-free half of live match sync (src/sync/liveMatchLogic.js).
// The Firestore-touching shell (liveMatchSync.js/resumeLiveMatch.js) needs
// the actual SDK and can't run under node --test, so isn't covered here.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../engine/index');
const {
  LIVE_SYNC_SCREENS,
  canSyncLiveMatch,
  liveMatchSnapshot,
  hydrateFromLiveMatch,
} = require('../liveMatchLogic');

function baseState(userOverrides) {
  const s = app.freshMatch();
  s.teamA = 'Team A';
  s.teamB = 'Team B';
  s.battingFirst = 'A';
  s.user = Object.assign({ uid: 'u1', isAnonymous: false }, userOverrides || {});
  return s;
}

test('LIVE_SYNC_SCREENS covers every screen with an active match, and no others', () => {
  ['scoring', 'break', 'superOverIntro', 'superOverScoring', 'superOverTiedAgain'].forEach(screen => {
    assert.equal(LIVE_SYNC_SCREENS[screen], true, screen);
  });
  ['setup', 'result', 'leaderboard', 'login', 'authLoading'].forEach(screen => {
    assert.equal(!!LIVE_SYNC_SCREENS[screen], false, screen);
  });
});

test('canSyncLiveMatch requires a signed-in non-guest user, a matchId, and a live screen', () => {
  const s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  app.setState(s);
  assert.equal(canSyncLiveMatch(s), true);

  s.screen = 'setup';
  assert.equal(canSyncLiveMatch(s), false, 'not live once back on setup');
  s.screen = 'scoring';

  s.matchId = null;
  assert.equal(canSyncLiveMatch(s), false, 'no match started yet');
  s.matchId = 'm1';

  s.user.isAnonymous = true;
  assert.equal(canSyncLiveMatch(s), false, 'guests are not synced to the cloud');
});

test('liveMatchSnapshot writes the resumable fields, not per-device UI state', () => {
  const s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.toastMessage = 'should not be synced';
  s.playerPopup = { type: 'openers' };

  const snapshot = liveMatchSnapshot(s, '__serverTimestamp__');

  assert.equal(snapshot.teamA, 'Team A');
  assert.equal(snapshot.screen, 'scoring');
  assert.equal(snapshot.updatedAt, '__serverTimestamp__');
  assert.equal(snapshot.toastMessage, undefined, 'per-device UI state must not be synced');
  assert.equal(snapshot.playerPopup, undefined, 'per-device UI state must not be synced');
});

// Regression: overHistory is an array of per-over arrays (inn.overHistory.
// push(inn.thisOver)), and Firestore rejects any array nested directly
// inside another array with "Nested arrays are not supported".
// liveMatchSnapshot() must serialize data/superOver to JSON strings rather
// than handing Firestore the raw nested-array shape.
test('liveMatchSnapshot serializes innings data (with its nested overHistory arrays) as JSON', () => {
  const s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].overHistory = [
    ['1', '4', 'W', '0', '0', '2'],
    ['wd1', '6', '0', '0', '0', '0'],
  ];

  const snapshot = liveMatchSnapshot(s, '__serverTimestamp__');

  assert.equal(typeof snapshot.dataJson, 'string');
  const roundTripped = JSON.parse(snapshot.dataJson);
  assert.deepEqual(roundTripped[1].overHistory, s.data[1].overHistory);
});

test('liveMatchSnapshot serializes the super over state as JSON, or null when there is none', () => {
  const s = baseState();
  s.matchId = 'm1';
  s.screen = 'superOverScoring';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.superOver = { active: true, round: 1, data: { 1: { runs: 6 }, 2: null } };

  const withSuperOver = liveMatchSnapshot(s, '__serverTimestamp__');
  assert.equal(typeof withSuperOver.superOverJson, 'string');
  assert.deepEqual(JSON.parse(withSuperOver.superOverJson), s.superOver);

  s.superOver = null;
  const withoutSuperOver = liveMatchSnapshot(s, '__serverTimestamp__');
  assert.equal(withoutSuperOver.superOverJson, null);
});

test('hydrateFromLiveMatch restores the resumable fields and clears pendingLiveMatch', () => {
  const original = baseState();
  original.matchId = 'm1';
  original.screen = 'superOverScoring';
  original.data[1] = app.freshInnings('Team A', 'Team B');
  original.data[1].runs = 42;
  original.superOver = { active: true, round: 1 };

  const doc = liveMatchSnapshot(original, '__serverTimestamp__');

  const target = app.freshMatch();
  target.pendingLiveMatch = doc;
  hydrateFromLiveMatch(target, doc);

  assert.equal(target.matchId, 'm1');
  assert.equal(target.screen, 'superOverScoring');
  assert.equal(target.data[1].runs, 42);
  assert.deepEqual(target.superOver, { active: true, round: 1 });
  assert.equal(target.pendingLiveMatch, null);
});
