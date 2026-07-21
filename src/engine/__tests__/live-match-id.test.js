// Tests for startMatch()'s Firestore live-match id minting -- the RN-free
// half of live match sync. The actual Firestore write/read/delete happens
// in src/sync/liveMatchSync.js, which needs the SDK and so is tested
// separately (it can't run under node --test).
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');

function signedInState(userOverrides) {
  const s = app.freshMatch();
  s.teamA = 'Team A';
  s.teamB = 'Team B';
  s.battingFirst = 'A';
  s.user = Object.assign({ uid: 'u1', isAnonymous: false }, userOverrides || {});
  return s;
}

test('startMatch assigns a live-match id for a signed-in user', () => {
  app.setState(signedInState());
  app.startMatch();
  const matchId = app.getState().matchId;
  assert.equal(typeof matchId, 'string');
  assert.equal(matchId.length, 20);
});

test('startMatch does not assign a live-match id for a guest', () => {
  app.setState(signedInState({ isAnonymous: true }));
  app.startMatch();
  assert.equal(app.getState().matchId, null);
});

test('startMatch does not assign a live-match id for a signed-out user', () => {
  const s = app.freshMatch();
  s.teamA = 'Team A';
  s.teamB = 'Team B';
  s.battingFirst = 'A';
  s.user = null;
  app.setState(s);
  app.startMatch();
  assert.equal(app.getState().matchId, null);
});

test('startMatch does not mint a new id if one is already assigned', () => {
  const s = signedInState();
  s.matchId = 'existing-id';
  app.setState(s);
  app.startMatch();
  assert.equal(app.getState().matchId, 'existing-id');
});
