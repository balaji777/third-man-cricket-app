// Tests for the RN-free share-text generators (src/export/shareText.js).
// The actual native Share sheet call (share.js) needs the RN Share API and
// can't run under node --test, so isn't covered here.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../engine/index');
const { generateShareText, generateInningsShareText } = require('../shareText');

function wonMatchState() {
  const s = app.freshMatch();
  s.teamA = 'Team A';
  s.teamB = 'Team B';
  s.target = 100;
  s.manOfMatch = 'Alice';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].runs = 99;
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.data[2].runs = 100;
  s.data[2].wickets = 3;
  s.data[2].legalBalls = 55;
  return s;
}

test('generateShareText includes both innings scores, the result, and MOTM', () => {
  const s = wonMatchState();
  app.setState(s);

  const text = generateShareText();
  const lines = text.split('\n');

  assert.equal(lines[0], 'Team A vs Team B');
  assert.match(lines[1], /^Team A: 99\/0 \(/);
  assert.match(lines[2], /^Team B: 100\/3 \(/);
  assert.match(text, /Team B won by 7 wickets/);
  assert.match(text, /Player of the Match: Alice/);
});

test('generateShareText omits the MOTM line when there is none', () => {
  const s = wonMatchState();
  s.manOfMatch = null;
  app.setState(s);

  const text = generateShareText();

  assert.doesNotMatch(text, /Player of the Match/);
});

test('generateInningsShareText lists each batter with runs/balls/strike rate', () => {
  const s = wonMatchState();
  s.data[1].batsmen = [
    { name: 'Alice', runs: 60, balls: 40, fours: 5, sixes: 2, out: true },
    { name: 'Bella', runs: 30, balls: 20, fours: 3, sixes: 0, out: false },
  ];
  app.setState(s);

  const text = generateInningsShareText(1);

  assert.match(text, /Alice: 60 \(40\) SR 150\.0 \[4s:5 6s:2\]/);
  assert.match(text, /Bella \*: 30 \(20\) SR 150\.0 \[4s:3 6s:0\]/);
});

test('generateInningsShareText includes partnerships and over totals when present', () => {
  const s = wonMatchState();
  const inn = s.data[1];
  inn.overHistory = [
    ['4', '4', '0', '1', '0', '2'],
    ['1', '1', '1', '1', '1', '1'],
  ];
  inn.wicketLog = [{ partner: 'Alice', batsman: 'Bella', partnershipRuns: 25, partnershipBalls: 18 }];
  app.setState(s);

  const text = generateInningsShareText(1);

  assert.match(text, /Partnerships: Alice & Bella 25\(18\)/);
  assert.match(text, /Over totals: 11, 6/);
});
