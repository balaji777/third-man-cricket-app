// Regression coverage for: closing the browser mid-match (or after
// finishing), undoing a few balls via "Undo last ball", and replaying to
// completion used to leave TWO history entries in Firestore for what's
// really one match -- recordMatchToHistory() re-fires (by design, so a
// corrected result gets saved), but each firing used to blindly addDoc a
// new entry with no memory of the one it was replacing.
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
    doc: function (_db, _users, _uid, _matches, id) {
      return { __id: id };
    },
    addDoc: function (_col, data) {
      var id = 'doc' + nextId++;
      docs[id] = data;
      return Promise.resolve({ id: id });
    },
    deleteDoc: function (ref) {
      delete docs[ref.__id];
      return Promise.resolve();
    }
  };
}

test('recording a match for the first time creates exactly one Firestore doc', async () => {
  var fakeFb = makeFakeFirestore();
  global.window.__fb = fakeFb;
  var s = app.freshMatch();
  s.user = { uid: 'u1', isAnonymous: false };
  app.setState(s);

  await app.saveMatchEntryToFirestore({ teamA: 'A', teamB: 'B' });

  assert.equal(Object.keys(fakeFb.docs).length, 1);
  assert.equal(app.getState().matchHistoryDocId, 'doc1');
});

test('re-recording a corrected result replaces the previous entry instead of duplicating it', async () => {
  var fakeFb = makeFakeFirestore();
  global.window.__fb = fakeFb;
  var s = app.freshMatch();
  s.user = { uid: 'u1', isAnonymous: false };
  app.setState(s);

  // First recording, as if the match had already been completed once.
  await app.saveMatchEntryToFirestore({ teamA: 'A', teamB: 'B', resultText: 'A won by 10 runs' });
  assert.equal(Object.keys(fakeFb.docs).length, 1);

  // Simulate "Undo last ball" -> replay -> reach the result screen again,
  // which re-fires a save for the corrected result.
  await app.saveMatchEntryToFirestore({ teamA: 'A', teamB: 'B', resultText: 'A won by 4 runs' });

  var remaining = Object.values(fakeFb.docs);
  assert.equal(remaining.length, 1, 'the superseded entry must be removed, not left alongside the new one');
  assert.equal(remaining[0].resultText, 'A won by 4 runs');
});

test('recordMatchToHistory invalidates the cached history instead of appending on a re-record', () => {
  global.window.__fb = makeFakeFirestore();
  var s = app.freshMatch();
  s.user = { uid: 'u1', isAnonymous: false };
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.matchHistoryCache = [{ teamA: 'Old', teamB: 'Match' }];
  s.matchHistoryDocId = 'doc1'; // a previous recording already exists
  app.setState(s);

  app.recordMatchToHistory();

  assert.equal(
    app.getState().matchHistoryCache,
    null,
    'cache should be invalidated (forcing a re-fetch) rather than showing both entries'
  );
});

test('recordMatchToHistory appends to the cache on a genuine first recording', () => {
  global.window.__fb = makeFakeFirestore();
  var s = app.freshMatch();
  s.user = { uid: 'u1', isAnonymous: false };
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.matchHistoryCache = [{ teamA: 'Old', teamB: 'Match' }];
  s.matchHistoryDocId = null; // no previous recording for this match
  app.setState(s);

  app.recordMatchToHistory();

  assert.equal(app.getState().matchHistoryCache.length, 2);
});
