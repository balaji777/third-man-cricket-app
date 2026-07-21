// Tests for the RN-free half of leaderboard aggregation
// (src/leaderboard/leaderboardLogic.js). Uses matchHistoryLogic.js's own
// buildHistoryEntry() to build fixtures, so the shape under test always
// matches what M11 actually writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../engine/index');
const { buildHistoryEntry } = require('../../history/matchHistoryLogic');
const { computeLeaderboardStats } = require('../leaderboardLogic');

function matchEntry({ teamA, teamB, aRuns, aWkts, bRuns, bWkts, target, manOfMatch, batsmenA, bowlersB }) {
  const s = app.freshMatch();
  s.teamA = teamA;
  s.teamB = teamB;
  s.target = target;
  s.manOfMatch = manOfMatch || null;
  s.data[1] = app.freshInnings(teamA, teamB);
  s.data[1].runs = aRuns;
  s.data[1].wickets = aWkts;
  if (batsmenA) s.data[1].batsmen = batsmenA;
  s.data[2] = app.freshInnings(teamB, teamA);
  s.data[2].runs = bRuns;
  s.data[2].wickets = bWkts;
  if (bowlersB) s.data[2].bowlers = bowlersB;
  // buildHistoryEntry() calls matchResultText()/computeMatchWinner(), which
  // read the engine's module-level state via getState() rather than the `s`
  // passed in here -- so the fixture has to be installed as current state
  // first, same as matchHistoryLogic's own tests do.
  app.setState(s);
  return buildHistoryEntry(s);
}

test('computeLeaderboardStats tallies played/won/lost and awards 2 points for a win', () => {
  // Team A scores 150, Team B chases and falls short at 120 -- Team A wins.
  const entry = matchEntry({ teamA: 'Team A', teamB: 'Team B', aRuns: 150, aWkts: 5, bRuns: 120, bWkts: 10, target: 151 });
  const { teams } = computeLeaderboardStats([entry]);

  assert.equal(teams['Team A'].played, 1);
  assert.equal(teams['Team A'].won, 1);
  assert.equal(teams['Team A'].points, 2);
  assert.equal(teams['Team B'].lost, 1);
  assert.equal(teams['Team B'].points, 0);
});

test('computeLeaderboardStats awards 1 point each on a tie (no winner)', () => {
  const entry = matchEntry({ teamA: 'Team A', teamB: 'Team B', aRuns: 150, aWkts: 5, bRuns: 150, bWkts: 8, target: 151 });
  const { teams } = computeLeaderboardStats([entry]);

  assert.equal(teams['Team A'].tied, 1);
  assert.equal(teams['Team A'].points, 1);
  assert.equal(teams['Team B'].tied, 1);
  assert.equal(teams['Team B'].points, 1);
});

test('computeLeaderboardStats accumulates a batter\'s runs and high score across matches, keyed case/whitespace-insensitively', () => {
  const batsmenA1 = [{ name: 'Alice', runs: 40, balls: 30, fours: 3, sixes: 1, out: true }];
  const batsmenA2 = [{ name: ' alice ', runs: 65, balls: 40, fours: 5, sixes: 2, out: false }];
  const entry1 = matchEntry({ teamA: 'Team A', teamB: 'Team B', aRuns: 150, aWkts: 5, bRuns: 120, bWkts: 10, target: 151, batsmenA: batsmenA1 });
  const entry2 = matchEntry({ teamA: 'Team A', teamB: 'Team B', aRuns: 150, aWkts: 5, bRuns: 120, bWkts: 10, target: 151, batsmenA: batsmenA2 });

  const { batters } = computeLeaderboardStats([entry1, entry2]);

  assert.equal(Object.keys(batters).length, 3, 'Team A\'s stock openers plus Alice, deduped by name');
  const alice = batters.alice;
  assert.equal(alice.runs, 105);
  assert.equal(alice.innings, 2);
  assert.equal(alice.highScore, 65);
  assert.equal(alice.outs, 1);
});

test('computeLeaderboardStats tracks a bowler\'s best figures by most wickets, tie-broken by fewest runs', () => {
  const bowlersB1 = [{ name: 'Bob', balls: 24, runs: 30, wickets: 2, maidens: 0 }];
  const bowlersB2 = [{ name: 'Bob', balls: 24, runs: 18, wickets: 2, maidens: 1 }];
  const entry1 = matchEntry({ teamA: 'Team A', teamB: 'Team B', aRuns: 150, aWkts: 5, bRuns: 120, bWkts: 10, target: 151, bowlersB: bowlersB1 });
  const entry2 = matchEntry({ teamA: 'Team A', teamB: 'Team B', aRuns: 150, aWkts: 5, bRuns: 120, bWkts: 10, target: 151, bowlersB: bowlersB2 });

  const { bowlers } = computeLeaderboardStats([entry1, entry2]);

  assert.equal(bowlers.bob.wickets, 4);
  assert.equal(bowlers.bob.bestWkts, 2);
  assert.equal(bowlers.bob.bestRuns, 18, 'same wicket count, fewer runs is the better figures');
});

test('computeLeaderboardStats skips a bowler who never bowled a ball', () => {
  const bowlersB = [{ name: 'Bob', balls: 0, runs: 0, wickets: 0, maidens: 0 }];
  const entry = matchEntry({ teamA: 'Team A', teamB: 'Team B', aRuns: 150, aWkts: 5, bRuns: 120, bWkts: 10, target: 151, bowlersB });

  const { bowlers } = computeLeaderboardStats([entry]);

  assert.equal(bowlers.bob, undefined);
});
