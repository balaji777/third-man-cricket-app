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

function extrasTotal(inn) {
  return inn.extras.wd + inn.extras.nb + inn.extras.b + inn.extras.lb;
}

function formatTime12hr(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const mStr = m < 10 ? '0' + m : '' + m;
  return h + ':' + mStr + ' ' + ampm;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateShort(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return d.getDate() + ' ' + SHORT_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

function formatDuration(startMs, endMs) {
  if (!startMs || !endMs) return '';
  const mins = Math.round((endMs - startMs) / 60000);
  if (mins < 60) return mins + ' min';
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h + 'h ' + m + 'm';
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

function bestBatting() {
  const state = getState();
  let best = null;
  [state.data[1], state.data[2]].forEach(function (inn) {
    if (!inn) return;
    inn.batsmen.forEach(function (b) {
      if (b.balls === 0) return;
      const bSR = (b.runs / b.balls) * 100;
      if (!best) {
        best = b;
        return;
      }
      const bestSR = (best.runs / best.balls) * 100;
      if (b.runs > best.runs || (b.runs === best.runs && bSR > bestSR)) best = b;
    });
  });
  return best;
}

function bestBowling() {
  const state = getState();
  let best = null;
  [state.data[1], state.data[2]].forEach(function (inn) {
    if (!inn) return;
    inn.bowlers.forEach(function (bw) {
      if (bw.balls === 0) return;
      if (!best) {
        best = bw;
        return;
      }
      if (bw.wickets > best.wickets || (bw.wickets === best.wickets && economyRate(bw) < economyRate(best))) best = bw;
    });
  });
  return best;
}

// x is measured in overs (whole overs from overHistory, plus a fractional
// over from thisOver if one is in progress -- see the loop below), y is
// cumulative runs.
function cumulativeRuns(inn) {
  const arr = [{ x: 0, y: 0 }];
  let running = 0;
  inn.overHistory.forEach(function (ov, i) {
    running += computeOverTotal(ov);
    arr.push({ x: i + 1, y: running });
  });
  if (inn.thisOver.length > 0) {
    // Regression: an innings that ends mid-over (all out, or target chased)
    // used to drop this partial over from the graph entirely -- the last
    // plotted point stopped at the last completed over instead of the
    // innings' true final total. Always plot whatever's in thisOver too.
    running += computeOverTotal(inn.thisOver);
    arr.push({ x: inn.overHistory.length + inn.thisOver.length / 6, y: running });
  }
  return arr;
}

// Ported from the source's buildWormChartSVG(), split so the point-geometry
// math (pure, testable under node --test) is separate from the actual SVG
// markup, which the RN port renders via react-native-svg components instead
// of an HTML string -- see src/components/WormChart.js.
function buildWormChartPoints() {
  const state = getState();
  const inn1 = state.data[1];
  const inn2 = state.data[2];
  const w = 300,
    h = 170,
    padL = 28,
    padR = 14,
    padT = 12,
    padB = 14;
  const c1 = cumulativeRuns(inn1);
  const c2 = cumulativeRuns(inn2);
  const maxOvers = Math.max(c1[c1.length - 1].x, c2[c2.length - 1].x, 1);
  const maxRuns = Math.max(c1[c1.length - 1].y, c2[c2.length - 1].y, 10);
  function toPoints(arr) {
    return arr
      .map(function (p) {
        const x = padL + (p.x / maxOvers) * (w - padL - padR);
        const y = h - padB - (p.y / maxRuns) * (h - padT - padB);
        return x.toFixed(1) + ',' + y.toFixed(1);
      })
      .join(' ');
  }
  return {
    width: w,
    height: h,
    padL: padL,
    padR: padR,
    padT: padT,
    padB: padB,
    team1Name: inn1.battingName,
    team2Name: inn2.battingName,
    team1Points: toPoints(c1),
    team2Points: toPoints(c2),
  };
}

module.exports = {
  oversStr,
  rate,
  strikeRate,
  economyRate,
  extrasTotal,
  formatTime12hr,
  formatDateShort,
  formatDuration,
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
  bestBatting,
  bestBowling,
  buildWormChartPoints,
};
