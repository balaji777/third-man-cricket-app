// Tests for the RN-free half of match-history recording
// (src/history/matchHistoryLogic.js). The Firestore-touching shell
// (matchHistorySync.js) needs the actual SDK and can't run under
// node --test, so isn't covered here -- mirrors sync/__tests__'s split.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../engine/index');
const { packInnings, buildHistoryEntry, recordMatchToHistory } = require('../matchHistoryLogic');

function wonMatchState() {
  const s = app.freshMatch();
  s.teamA = 'Team A';
  s.teamB = 'Team B';
  s.battingFirst = 'A';
  s.target = 100;
  s.manOfMatch = 'Alice';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].runs = 99;
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.data[2].runs = 100;
  s.data[2].wickets = 3;
  s.data[2].legalBalls = 55;
  s.screen = 'result';
  return s;
}

test('packInnings maps the fields worth keeping in history, defaulting missing maidens to 0', () => {
  const inn = app.freshInnings('Team A', 'Team B');
  inn.runs = 42;
  inn.wickets = 2;
  inn.legalBalls = 30;
  inn.batsmen = [{ name: 'Alice', runs: 20, balls: 15, fours: 2, sixes: 1, out: true, howOut: 'b Bob' }];
  inn.bowlers = [{ name: 'Bob', balls: 24, runs: 18, wickets: 1 }];

  const packed = packInnings(inn);

  assert.equal(packed.team, 'Team A');
  assert.equal(packed.runs, 42);
  assert.equal(packed.wickets, 2);
  assert.equal(packed.overs, '5.0');
  assert.deepEqual(packed.batsmen, [{ name: 'Alice', runs: 20, balls: 15, fours: 2, sixes: 1, out: true }]);
  assert.deepEqual(packed.bowlers, [{ name: 'Bob', balls: 24, runs: 18, wickets: 1, maidens: 0 }]);
});

test('buildHistoryEntry captures both innings plus the result, winner, and man of the match', () => {
  const s = wonMatchState();
  app.setState(s);

  const entry = buildHistoryEntry(s);

  assert.equal(entry.teamA, 'Team A');
  assert.equal(entry.teamB, 'Team B');
  assert.equal(entry.winner, 'Team B');
  assert.match(entry.resultText, /Team B won by 7 wickets/);
  assert.equal(entry.manOfMatch, 'Alice');
  assert.equal(entry.innings.length, 2);
  assert.equal(entry.innings[1].runs, 100);
  assert.equal(typeof entry.date, 'number');
});

test('recordMatchToHistory sets matchRecorded and returns the entry the first time', () => {
  const s = wonMatchState();
  app.setState(s);

  const entry = recordMatchToHistory(s);

  assert.equal(s.matchRecorded, true);
  assert.equal(entry.winner, 'Team B');
});

test('recordMatchToHistory is a no-op once already recorded', () => {
  const s = wonMatchState();
  s.matchRecorded = true;
  app.setState(s);

  const entry = recordMatchToHistory(s);

  assert.equal(entry, null);
});

test('recordMatchToHistory invalidates a cached list rather than appending when re-recording a corrected result', () => {
  const s = wonMatchState();
  s.matchHistoryDocId = 'existing-doc-id';
  s.matchHistoryCache = [{ teamA: 'Old', teamB: 'Match' }];
  app.setState(s);

  recordMatchToHistory(s);

  assert.equal(s.matchHistoryCache, null);
});

test('recordMatchToHistory appends to a cached list when recording a match for the first time', () => {
  const s = wonMatchState();
  s.matchHistoryDocId = null;
  s.matchHistoryCache = [{ teamA: 'Previous', teamB: 'Match' }];
  app.setState(s);

  const entry = recordMatchToHistory(s);

  assert.equal(s.matchHistoryCache.length, 2);
  assert.equal(s.matchHistoryCache[1], entry);
});

test('recordMatchToHistory leaves a null cache alone -- no fetch has happened yet to populate it', () => {
  const s = wonMatchState();
  s.matchHistoryDocId = null;
  s.matchHistoryCache = null;
  app.setState(s);

  recordMatchToHistory(s);

  assert.equal(s.matchHistoryCache, null);
});
