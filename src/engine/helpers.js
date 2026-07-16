// Pure scoring-engine helpers, ported near-verbatim from js/app.js.
const { getState } = require('./state');

function oversStr(balls) {
  return Math.floor(balls / 6) + '.' + (balls % 6);
}

function rate(runs, balls) {
  if (balls === 0) return '0.00';
  return (runs / (balls / 6)).toFixed(2);
}

function strikeRate(runs, balls) {
  if (balls === 0) return '0.0';
  return ((runs / balls) * 100).toFixed(1);
}

function economyRate(bw) {
  if (bw.balls === 0) return 0;
  return bw.runs / (bw.balls / 6);
}

function currentBowler(inn) {
  return inn.bowlers[inn.bowlerIdx];
}
function striker(inn) {
  return inn.batsmen[inn.strikerIdx];
}
function nonStriker(inn) {
  return inn.batsmen[inn.nonStrikerIdx];
}

// Parses a thisOver/overHistory token back into a run count. 'db' (dead
// ball) is defended against but never produced by any in-scope action.
function parseBallRuns(b) {
  if (b === 'W' || b === 'db') return 0;
  if (/^\d+$/.test(b)) return parseInt(b, 10);
  if (b === 'wd') return 1;
  if (/^wd\d+$/.test(b)) return parseInt(b.slice(2), 10);
  if (b === 'nb') return 1;
  if (/^nb\d+$/.test(b)) return parseInt(b.slice(2), 10) + 1;
  if (/^lb\d+$/.test(b)) return parseInt(b.slice(2), 10);
  if (/^b\d+$/.test(b)) return parseInt(b.slice(1), 10);
  return 0;
}

function computeOverTotal(overArr) {
  return overArr.reduce(function (sum, b) {
    return sum + parseBallRuns(b);
  }, 0);
}

// A maiden excludes wides/no-balls and off-the-bat runs, but NOT byes/leg-byes
// (those tokens have a letter prefix so they fail both guard checks below) --
// matches the real cricket definition, preserve exactly.
function isMaidenOver(overArr) {
  for (let i = 0; i < overArr.length; i++) {
    const b = overArr[i];
    if (/^wd/.test(b) || /^nb/.test(b)) return false;
    if (/^\d+$/.test(b) && b !== '0') return false;
  }
  return true;
}

function powerplayScore(inn) {
  const state = getState();
  if (!state.powerplayOvers || state.powerplayOvers <= 0) return null;
  const ppBalls = state.powerplayOvers * 6;
  let runs = 0;
  const cap = Math.min(inn.overHistory.length, state.powerplayOvers);
  for (let i = 0; i < cap; i++) {
    runs += computeOverTotal(inn.overHistory[i]);
  }
  if (inn.legalBalls < ppBalls) {
    runs += computeOverTotal(inn.thisOver);
  }
  const wkts = inn.wicketLog.filter(function (w) {
    return w.legalBallsAtFall <= ppBalls;
  }).length;
  const ballsShown = Math.min(inn.legalBalls, ppBalls);
  return { runs: runs, wkts: wkts, oversDisplay: oversStr(ballsShown) };
}

function inPowerplay(inn) {
  const state = getState();
  return state.powerplayOvers > 0 && inn.legalBalls < state.powerplayOvers * 6;
}

function howOutText(type, bowlerName, fielderName, d) {
  if (type === 'bowled') return 'b ' + bowlerName;
  if (type === 'lbw') return 'lbw b ' + bowlerName;
  if (type === 'caught') {
    const tag = d && d.catchType === 'extraordinary' ? ' (stunning catch!)' : '';
    return 'c ' + fielderName + ' b ' + bowlerName + tag;
  }
  if (type === 'stumped') return 'st wk b ' + bowlerName;
  if (type === 'runout') {
    const endLabel = d && d.endThrown === 'striker' ? "striker's end" : "non-striker's end";
    const runsLabel =
      d && d.runsCompleted != null
        ? d.runsCompleted + ' run' + (d.runsCompleted === 1 ? '' : 's') + ', '
        : '';
    const fielderLabel = fielderName ? '/' + fielderName : '';
    return 'run out (' + runsLabel + endLabel + fielderLabel + ')';
  }
  return 'out';
}

// Phase 1 simplification: a tie in innings 2 routes straight to 'result'
// (super overs are deferred), so target/runs comparisons below only ever
// see a genuine win or a tie -- matchResultText's tie branch is unchanged
// from the source.
function matchResultText() {
  const state = getState();
  const inn1 = state.data[1],
    inn2 = state.data[2];
  if (state.superOver && state.superOver.winner) {
    return 'Match tied — ' + state.superOver.winner + ' won the Super Over';
  }
  if (state.superOverTiedFinal) {
    return 'Match tied — Super Over also finished level';
  }
  if (inn2.runs >= state.target) {
    const wl = state.wicketsLimit - inn2.wickets;
    return inn2.battingName + ' won by ' + wl + ' wicket' + (wl === 1 ? '' : 's');
  } else if (inn2.runs === state.target - 1) {
    return 'Match tied';
  } else {
    const rm = state.target - 1 - inn2.runs;
    return inn1.battingName + ' won by ' + rm + ' run' + (rm === 1 ? '' : 's');
  }
}

function computeMatchWinner() {
  const state = getState();
  if (state.superOver && state.superOver.winner) return state.superOver.winner;
  if (state.superOverTiedFinal) return null;
  const inn1 = state.data[1],
    inn2 = state.data[2];
  if (inn2.runs >= state.target) return inn2.battingName;
  if (inn2.runs === state.target - 1) return null;
  return inn1.battingName;
}

function computeAutoMOTM() {
  const state = getState();
  const inn1 = state.data[1],
    inn2 = state.data[2];
  if (!inn1 || !inn2) return null;

  let winningTeam = null;
  if (inn2.runs >= state.target) winningTeam = inn2.battingName;
  else if (inn2.runs !== state.target - 1) winningTeam = inn1.battingName;

  const stats = {};
  function entry(name, team) {
    const key = name.trim().toLowerCase();
    if (!stats[key]) stats[key] = { name: name, runs: 0, wickets: 0, team: team };
    return stats[key];
  }
  [inn1, inn2].forEach(function (inn) {
    inn.batsmen.forEach(function (b) {
      entry(b.name, inn.battingName).runs += b.runs;
    });
    inn.bowlers.forEach(function (bw) {
      entry(bw.name, inn.bowlingName).wickets += bw.wickets;
    });
  });

  let best = null,
    bestScore = -Infinity;
  Object.keys(stats).forEach(function (key) {
    const p = stats[key];
    let score = p.runs + p.wickets * 20;
    if (winningTeam && p.team === winningTeam) score += 5;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  });
  return best ? best.name : null;
}

module.exports = {
  oversStr,
  rate,
  strikeRate,
  economyRate,
  currentBowler,
  striker,
  nonStriker,
  parseBallRuns,
  computeOverTotal,
  isMaidenOver,
  powerplayScore,
  inPowerplay,
  howOutText,
  matchResultText,
  computeMatchWinner,
  computeAutoMOTM,
};
