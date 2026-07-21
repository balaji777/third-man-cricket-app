// Ported from the retired web app's test/pure-helpers.test.js. No DOM stub
// needed -- the engine has zero document/localStorage dependency.
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');

test('parseBallRuns reads plain runs, wides, no-balls, byes and leg-byes', () => {
  assert.equal(app.parseBallRuns('0'), 0);
  assert.equal(app.parseBallRuns('4'), 4);
  assert.equal(app.parseBallRuns('W'), 0);
  assert.equal(app.parseBallRuns('wd'), 1);
  assert.equal(app.parseBallRuns('wd2'), 2);
  assert.equal(app.parseBallRuns('nb'), 1);
  assert.equal(app.parseBallRuns('nb4'), 5);
  assert.equal(app.parseBallRuns('b2'), 2);
  assert.equal(app.parseBallRuns('lb1'), 1);
});

test('computeOverTotal sums every ball in an over', () => {
  assert.equal(app.computeOverTotal(['1', '4', 'W', '0', 'wd', '6']), 12);
});

test('isMaidenOver is true for an over with only dot balls and wickets', () => {
  assert.equal(app.isMaidenOver(['0', '0', 'W', '0', '0', '0']), true);
});

test('isMaidenOver stays true when byes/leg-byes are scored off no-shot balls', () => {
  // Runs conceded via byes/leg-byes are never charged to the bowler, so per
  // the Laws of Cricket they don't break a maiden.
  assert.equal(app.isMaidenOver(['0', 'b1', '0', 'lb2', '0', '0']), true);
});

test('isMaidenOver is false when the batter scores off the bat', () => {
  assert.equal(app.isMaidenOver(['0', '0', '1', '0', '0', '0']), false);
});

test('isMaidenOver is false when the over contains a wide or no-ball', () => {
  assert.equal(app.isMaidenOver(['0', '0', '0', '0', '0', 'wd']), false);
  assert.equal(app.isMaidenOver(['0', '0', '0', '0', '0', 'nb']), false);
});

test('oversStr formats legal balls as overs.balls', () => {
  assert.equal(app.oversStr(0), '0.0');
  assert.equal(app.oversStr(5), '0.5');
  assert.equal(app.oversStr(6), '1.0');
  assert.equal(app.oversStr(19), '3.1');
});

test('rate and strikeRate handle zero balls without dividing by zero', () => {
  assert.equal(app.rate(0, 0), '0.00');
  assert.equal(app.strikeRate(0, 0), '0.0');
  assert.equal(app.rate(30, 30), '6.00');
  assert.equal(app.strikeRate(50, 40), '125.0');
});

test('economyRate is runs per over', () => {
  assert.equal(app.economyRate({ runs: 24, balls: 24 }), 6);
  assert.equal(app.economyRate({ runs: 0, balls: 0 }), 0);
});

test('howOutText formats each dismissal type', () => {
  assert.equal(app.howOutText('bowled', 'Kane'), 'b Kane');
  assert.equal(app.howOutText('lbw', 'Kane'), 'lbw b Kane');
  assert.equal(app.howOutText('caught', 'Kane', 'Root', {}), 'c Root b Kane');
  assert.equal(app.howOutText('stumped', 'Kane'), 'st wk b Kane');
  assert.equal(
    app.howOutText('runout', null, 'Root', { runsCompleted: 1, endThrown: 'striker' }),
    "run out (1 run, striker's end/Root)"
  );
});

test('bestBatting picks the higher score across both innings, tie-broken by strike rate', () => {
  const s = app.freshMatch();
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].batsmen = [
    { name: 'Alice', runs: 40, balls: 30, fours: 3, sixes: 1, out: true },
    { name: 'Bella', runs: 40, balls: 20, fours: 4, sixes: 2, out: false },
  ];
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.data[2].batsmen = [{ name: 'Cara', runs: 39, balls: 10, fours: 0, sixes: 3, out: false }];
  app.setState(s);

  const best = app.bestBatting();

  assert.equal(best.name, 'Bella', 'same runs as Alice but a better strike rate');
});

test('bestBatting ignores a batter who has not faced a ball', () => {
  const s = app.freshMatch();
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].batsmen[0].balls = 0;
  s.data[1].batsmen[1] = { name: 'Dee', runs: 5, balls: 3, fours: 1, sixes: 0, out: false };
  s.data[2] = app.freshInnings('Team B', 'Team A');
  app.setState(s);

  assert.equal(app.bestBatting().name, 'Dee');
});

test('bestBowling picks the most wickets, tie-broken by economy', () => {
  const s = app.freshMatch();
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].bowlers = [{ name: 'Eve', balls: 24, runs: 30, wickets: 2, maidens: 0 }];
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.data[2].bowlers = [{ name: 'Finn', balls: 24, runs: 18, wickets: 2, maidens: 1 }];
  app.setState(s);

  assert.equal(app.bestBowling().name, 'Finn', 'same wickets as Eve but a better economy');
});

test('buildWormChartPoints scales both innings against the same max axes', () => {
  const s = app.freshMatch();
  s.data[1] = app.freshInnings('Team A', 'Team B');
  s.data[1].overHistory = [['4', '4', '0', '1', '0', '2']]; // 11 runs, 1 over
  s.data[2] = app.freshInnings('Team B', 'Team A');
  s.data[2].overHistory = [
    ['1', '1', '1', '1', '1', '1'],
    ['1', '1', '1', '1', '1', '1'],
  ]; // 12 runs, 2 overs -- the taller/wider innings, sets both axes' max
  app.setState(s);

  const chart = app.buildWormChartPoints();

  assert.equal(chart.team1Name, 'Team A');
  assert.equal(chart.team2Name, 'Team B');
  const team1Points = chart.team1Points.trim().split(' ');
  const team2Points = chart.team2Points.trim().split(' ');
  assert.equal(team1Points.length, 2, 'origin plus one completed over');
  assert.equal(team2Points.length, 3, 'origin plus two completed overs');
});

test('buildWormChartPoints plots the partial over left in progress when an innings ends mid-over', () => {
  // Reproduces a source regression: buildWormChartSVG only summed
  // inn.overHistory, so whatever partial over was in flight when an innings
  // ended (all out or target chased mid-over) was dropped from the graph.
  const s = app.freshMatch();
  const inn1 = app.freshInnings('Team A', 'Team B');
  inn1.overHistory = [['4', '4']]; // 8 runs across one completed over
  inn1.thisOver = ['4', '6']; // 10 more runs, over still in progress
  const inn2 = app.freshInnings('Team B', 'Team A');
  inn2.overHistory = [['4'], ['4']]; // 8 runs, innings ended on the over boundary
  inn2.thisOver = [];
  s.data[1] = inn1;
  s.data[2] = inn2;
  app.setState(s);

  const chart = app.buildWormChartPoints();
  const team1Points = chart.team1Points.trim().split(' ');
  const lastPoint = team1Points[team1Points.length - 1].split(',').map(Number);
  const lastY = lastPoint[1];

  // Chart y-axis: padT=12 is the top (max value). If the partial over's 10
  // runs were dropped, team1's true total (18) would never be plotted and
  // the last point would sit well below the top of the chart.
  assert.ok(lastY < 13, `expected the final point near the top of the chart, got y=${lastY}`);
});
