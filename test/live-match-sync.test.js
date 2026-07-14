// Phase 2 of the offline-first plan: while scoring, the match is mirrored to
// users/{uid}/liveMatches/{matchId} so it can be resumed from a different
// device, and cleaned up once it's finalized to history or abandoned.
const test = require('node:test');
const assert = require('node:assert/strict');
const { installDomStub } = require('./helpers/domStub');

installDomStub();
const app = require('../js/app.js');

function makeFakeFirestore() {
  var docs = {};
  var nextId = 1;
  return {
    docs: docs,
    db: {},
    collection: function () {
      return {};
    },
    // Mirrors the real SDK: doc(collectionRef) generates a fresh id,
    // doc(db, 'users', uid, 'liveMatches', id) looks up an existing one.
    doc: function (colOrDb, _users, _uid, _sub, id) {
      if (arguments.length === 1) {
        id = 'gen' + nextId++;
      }
      return { id: id };
    },
    setDoc: function (ref, data) {
      docs[ref.id] = data;
      return Promise.resolve();
    },
    deleteDoc: function (ref) {
      delete docs[ref.id];
      return Promise.resolve();
    },
    serverTimestamp: function () {
      return '__serverTimestamp__';
    }
  };
}

function baseState(userOverrides) {
  var s = app.freshMatch();
  s.teamA = 'Team A';
  s.teamB = 'Team B';
  s.battingFirst = 'A';
  s.user = Object.assign({ uid: 'u1', isAnonymous: false }, userOverrides || {});
  return s;
}

test('startMatch assigns a live-match id for a signed-in user', () => {
  global.window.__fb = makeFakeFirestore();
  app.setState(baseState());

  app.startMatch();

  assert.equal(app.getState().matchId, 'gen1');
});

test('startMatch does not assign a live-match id for a guest', () => {
  global.window.__fb = makeFakeFirestore();
  app.setState(baseState({ isAnonymous: true }));

  app.startMatch();

  assert.equal(app.getState().matchId, null);
});

test('canSyncLiveMatch requires a signed-in non-guest user, a matchId, and a live screen', () => {
  global.window.__fb = makeFakeFirestore();
  var s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  app.setState(s);
  assert.equal(app.canSyncLiveMatch(), true);

  s.screen = 'setup';
  assert.equal(app.canSyncLiveMatch(), false, 'not live once back on setup');
  s.screen = 'scoring';

  s.matchId = null;
  assert.equal(app.canSyncLiveMatch(), false, 'no match started yet');
  s.matchId = 'm1';

  s.user = Object.assign({}, s.user, { isAnonymous: true });
  assert.equal(app.canSyncLiveMatch(), false, 'guests are not synced to the cloud');
});

test('pushLiveMatchToCloud writes the resumable fields, not per-device UI state', () => {
  var fakeFb = makeFakeFirestore();
  global.window.__fb = fakeFb;
  var s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.toastMessage = 'should not be synced';
  s.playerPopup = { type: 'openers' };
  app.setState(s);

  app.pushLiveMatchToCloud();

  var saved = fakeFb.docs.m1;
  assert.ok(saved, 'doc should be written under the matchId');
  assert.equal(saved.teamA, 'Team A');
  assert.equal(saved.screen, 'scoring');
  assert.equal(saved.updatedAt, '__serverTimestamp__');
  assert.equal(saved.toastMessage, undefined, 'per-device UI state must not be synced');
  assert.equal(saved.playerPopup, undefined, 'per-device UI state must not be synced');
});

// Regression: overHistory is an array of per-over arrays
// (inn.overHistory.push(inn.thisOver)), and Firestore rejects any array
// nested directly inside another array with "Nested arrays are not
// supported". liveMatchSnapshot() must serialize data/superOver to JSON
// strings rather than handing Firestore the raw nested-array shape.
test('pushLiveMatchToCloud serializes innings data (with its nested overHistory arrays) as JSON', () => {
  var fakeFb = makeFakeFirestore();
  global.window.__fb = fakeFb;
  var s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].overHistory = [
    ['1', '4', 'W', '0', '0', '2'],
    ['wd1', '6', '0', '0', '0', '0']
  ];
  app.setState(s);

  assert.doesNotThrow(function () { app.pushLiveMatchToCloud(); });

  var saved = fakeFb.docs.m1;
  assert.equal(typeof saved.dataJson, 'string');
  var roundTripped = JSON.parse(saved.dataJson);
  assert.deepEqual(roundTripped[1].overHistory, s.data[1].overHistory);
});

// Regression: setDoc() validates its argument synchronously and throws
// immediately for bad data shapes (as opposed to network/permission
// failures, which only reject the returned promise) -- pushLiveMatchToCloud
// must not let that escape as an uncaught exception.
test('pushLiveMatchToCloud does not throw if setDoc rejects the data synchronously', () => {
  var fakeFb = makeFakeFirestore();
  fakeFb.setDoc = function () {
    throw new Error('Function setDoc() called with invalid data.');
  };
  global.window.__fb = fakeFb;
  var s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  app.setState(s);

  assert.doesNotThrow(function () { app.pushLiveMatchToCloud(); });
});

test('deleteLiveMatchDoc removes the synced document', () => {
  var fakeFb = makeFakeFirestore();
  global.window.__fb = fakeFb;
  var s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  app.setState(s);
  app.pushLiveMatchToCloud();
  assert.ok(fakeFb.docs.m1);

  app.deleteLiveMatchDoc();

  assert.equal(fakeFb.docs.m1, undefined);
});

test('recordMatchToHistory removes the live-match doc once the match is finalized', () => {
  var fakeFb = makeFakeFirestore();
  global.window.__fb = fakeFb;
  var s = baseState();
  s.matchId = 'm1';
  s.screen = 'result';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[2] = app.freshInnings('Team B', 'Team A');
  app.setState(s);
  fakeFb.docs.m1 = { screen: 'scoring' }; // as if a live sync had already landed

  app.recordMatchToHistory();

  assert.equal(fakeFb.docs.m1, undefined, 'live doc should be cleaned up on finalize');
  assert.equal(app.getState().matchId, null);
});

test('newMatch removes any live-match doc for the abandoned match', () => {
  var fakeFb = makeFakeFirestore();
  global.window.__fb = fakeFb;
  var s = baseState();
  s.matchId = 'm1';
  s.screen = 'scoring';
  app.setState(s);
  fakeFb.docs.m1 = { screen: 'scoring' };

  app.newMatch();

  assert.equal(fakeFb.docs.m1, undefined);
});
