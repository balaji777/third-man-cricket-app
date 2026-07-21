// Pure, RN-free share-text generators, ported from js/app.js's
// generateShareText/generateInningsShareText. The actual native Share sheet
// call lives in share.js (needs the RN Share API, so can't run under
// node --test).
const { getState } = require('../engine/state');
const { oversStr, rate, strikeRate, extrasTotal, computeOverTotal, matchResultText } = require('../engine/helpers');

function generateInningsShareText(inningsNum) {
  const state = getState();
  const inn = state.data[inningsNum];
  const lines = [];
  lines.push(`${inn.battingName} innings: ${inn.runs}/${inn.wickets} (${oversStr(inn.legalBalls)} ov), RR ${rate(inn.runs, inn.legalBalls)}`);
  inn.batsmen.forEach(b => {
    lines.push(`${b.name}${b.out ? '' : ' *'}: ${b.runs} (${b.balls}) SR ${strikeRate(b.runs, b.balls)} [4s:${b.fours} 6s:${b.sixes}]`);
  });
  lines.push(`Extras: ${extrasTotal(inn)} (wd ${inn.extras.wd}, nb ${inn.extras.nb}, b ${inn.extras.b}, lb ${inn.extras.lb})`);
  if (inn.wicketLog.length > 0) {
    lines.push('Partnerships: ' + inn.wicketLog.map(w => `${w.partner} & ${w.batsman} ${w.partnershipRuns}(${w.partnershipBalls})`).join(', '));
  }
  const overTotals = inn.overHistory.map(ov => computeOverTotal(ov));
  if (overTotals.length) lines.push('Over totals: ' + overTotals.join(', '));
  return lines.join('\n');
}

function generateShareText() {
  const state = getState();
  const inn1 = state.data[1];
  const inn2 = state.data[2];
  const lines = [];
  lines.push(`${inn1.battingName} vs ${inn2.battingName}`);
  lines.push(`${inn1.battingName}: ${inn1.runs}/${inn1.wickets} (${oversStr(inn1.legalBalls)} ov)`);
  lines.push(`${inn2.battingName}: ${inn2.runs}/${inn2.wickets} (${oversStr(inn2.legalBalls)} ov)`);
  lines.push(matchResultText());
  if (state.manOfMatch) lines.push('Player of the Match: ' + state.manOfMatch);
  return lines.join('\n');
}

module.exports = { generateInningsShareText, generateShareText };
