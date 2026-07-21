// Tests for the RN-free HTML report builders (src/export/reportHtml.js).
// The actual PDF conversion (pdfExport.js) needs react-native-html-to-pdf
// and can't run under node --test, so isn't covered here.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../engine/index');
const {
  escapeHtml,
  buildInningsReportHTML,
  buildMatchReportHTML,
  buildInningsReportDocument,
  buildLeaderboardReportHTML,
} = require('../reportHtml');

function wonMatchState() {
  const s = app.freshMatch();
  s.teamA = 'Team A';
  s.teamB = 'Team B';
  s.target = 100;
  s.manOfMatch = 'Alice';
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].runs = 99;
  s.data[1].batsmen = [{ name: 'Alice', runs: 60, balls: 40, fours: 5, sixes: 2, out: true, howOut: 'b Bob' }];
  s.data[1].bowlers = [{ name: 'Bob', balls: 24, runs: 20, wickets: 1, maidens: 0 }];
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.data[2].runs = 100;
  s.data[2].wickets = 3;
  s.data[2].legalBalls = 55;
  return s;
}

test('escapeHtml escapes the five reserved HTML characters', () => {
  assert.equal(escapeHtml(`<Team "A" & 'B'>`), '&lt;Team &quot;A&quot; &amp; &#39;B&#39;&gt;');
});

test('buildInningsReportHTML includes batting, bowling, and extras tables', () => {
  const s = wonMatchState();
  app.setState(s);

  const html = buildInningsReportHTML(1, false);

  assert.match(html, /Alice/);
  assert.match(html, /Bob/);
  assert.match(html, /rpt-band/);
  assert.match(html, /Extras/);
});

test('buildInningsReportHTML escapes batter/bowler names', () => {
  const s = wonMatchState();
  s.data[1].batsmen = [{ name: '<script>', runs: 1, balls: 1, fours: 0, sixes: 0, out: false }];
  app.setState(s);

  const html = buildInningsReportHTML(1, false);

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('buildMatchReportHTML wraps a full document with both innings and top performers', () => {
  const s = wonMatchState();
  app.setState(s);

  const html = buildMatchReportHTML();

  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /Team A v\/s Team B/);
  assert.match(html, /Best batting/);
  assert.match(html, /Best bowling/);
  assert.match(html, /Player of the Match/);
  assert.match(html, /Alice/); // MOTM name present
});

test('buildMatchReportHTML omits top performers for a guest, but still shows MOTM', () => {
  const s = wonMatchState();
  s.user = { uid: 'g1', isAnonymous: true };
  app.setState(s);

  const html = buildMatchReportHTML();

  assert.doesNotMatch(html, /Best batting/);
  assert.match(html, /Player of the Match/); // MOTM isn't guest-gated in the source
});

test('buildInningsReportDocument wraps a single innings as a standalone document', () => {
  const s = wonMatchState();
  app.setState(s);

  const html = buildInningsReportDocument(1);

  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /Team A — Innings Report/);
});

test('buildLeaderboardReportHTML includes the points table, top scorers, and match history', () => {
  const s = wonMatchState();
  app.setState(s);
  const entry = {
    date: Date.now(),
    teamA: 'Team A',
    teamB: 'Team B',
    resultText: 'Team B won by 7 wickets',
    winner: 'Team B',
    manOfMatch: 'Alice',
    innings: [
      { team: 'Team A', runs: 99, wickets: 5, batsmen: [{ name: 'Alice', runs: 60, balls: 40, fours: 5, sixes: 2, out: true }], bowlers: [] },
      { team: 'Team B', runs: 100, wickets: 3, batsmen: [], bowlers: [{ name: 'Bob', balls: 24, runs: 20, wickets: 1, maidens: 0 }] },
    ],
  };

  const html = buildLeaderboardReportHTML([entry]);

  assert.match(html, /Points Table/);
  assert.match(html, /Top Run Scorers/);
  assert.match(html, /Top Wicket-Takers/);
  assert.match(html, /Match History/);
  assert.match(html, /Alice/);
  assert.match(html, /Team B won by 7 wickets/);
});
