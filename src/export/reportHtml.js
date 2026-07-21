// Pure, RN-free HTML report builders, ported from js/app.js's
// buildInningsPrintHTML/buildMatchPrintHTML/buildLeaderboardPrintHTML. The
// source rendered these into a hidden #print-area and called window.print();
// react-native-html-to-pdf has no such DOM to render into, so these return
// complete standalone HTML documents (with the print CSS inlined) that the
// RN shell (pdfExport.js) hands straight to the PDF converter.
const { getState } = require('../engine/state');
const {
  oversStr,
  strikeRate,
  economyRate,
  extrasTotal,
  rate,
  formatTime12hr,
  formatDuration,
  formatDateShort,
  powerplayScore,
  currentBowler,
  computeOverTotal,
  matchResultText,
  bestBatting,
  bestBowling,
} = require('../engine/helpers');
const { computeLeaderboardStats } = require('../leaderboard/leaderboardLogic');

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Mirrors the retired web app's #print-area @media print rules (css/styles.css)
// -- carried over verbatim since react-native-html-to-pdf renders this as a
// plain (non-app) HTML document with no other stylesheet to inherit from.
const REPORT_STYLE = `
  body { font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; padding: 10px; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 8px; text-align: center; font-weight: normal; border-bottom: 2px solid #333; padding-bottom: 8px; }
  .rpt-result { font-size: 12px; margin: 0 0 4px; border-bottom: 1px solid #333; padding-bottom: 8px; }
  .rpt-band { background: #1F5C3E; color: #fff; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; padding: 6px 10px; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 2px; font-size: 11px; }
  th { background: #AFCBA0; color: #111; font-weight: bold; text-align: left; padding: 5px 8px; border-bottom: 1px solid #8fae86; }
  th:not(:first-child) { text-align: right; }
  td { padding: 4px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  td:not(:first-child) { text-align: right; }
  .rpt-name { font-weight: bold; }
  .rpt-sub { color: #777; font-size: 10px; font-weight: normal; }
  .rpt-two-col td { font-size: 12px; border-bottom: 1px solid #333; }
  .rpt-two-col td.rpt-label { font-weight: bold; text-align: left; }
  .rpt-section-title { font-size: 13px; font-weight: bold; margin: 16px 0 4px; }
  .rpt-note { font-size: 11px; margin: 4px 0; }
`;

function wrapReportDocument(title, bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${REPORT_STYLE}</style></head><body>${bodyHtml}</body></html>`;
}

function buildInningsReportHTML(inningsNum, omitTime) {
  const state = getState();
  const inn = state.data[inningsNum];
  const scoreLine = `${inn.runs}-${inn.wickets} (${oversStr(inn.legalBalls)})`;

  let html = `<div class="rpt-band"><span>${escapeHtml(inn.battingName)}</span><span>${scoreLine}</span></div>`;
  if (inn.startTime && !omitTime) {
    html += `<p style="font-size:10px;color:#666;margin:2px 0 6px;">Started ${formatTime12hr(inn.startTime)}`;
    if (inn.endTime) html += ` &middot; finished ${formatTime12hr(inn.endTime)} &middot; took ${formatDuration(inn.startTime, inn.endTime)}`;
    html += '</p>';
  }
  const pp = powerplayScore(inn);
  if (pp) {
    html += `<p style="font-size:11px;margin:4px 0;"><b>Powerplay (${state.powerplayOvers} ov):</b> ${pp.runs}/${pp.wkts} (${pp.oversDisplay})</p>`;
  }

  html += '<table><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>';
  inn.batsmen.forEach(b => {
    const sub = b.out ? escapeHtml(b.howOut || 'out') : 'not out';
    html +=
      `<tr><td><div class="rpt-name">${escapeHtml(b.name)}</div><div class="rpt-sub">${sub}</div></td>` +
      `<td>${b.runs}</td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${strikeRate(b.runs, b.balls)}</td></tr>`;
  });
  html += '</table>';

  html += '<table class="rpt-two-col">';
  html += `<tr><td class="rpt-label">Extras</td><td>(${extrasTotal(inn)}) ${inn.extras.b} B, ${inn.extras.lb} LB, ${inn.extras.wd} WD, ${inn.extras.nb} NB, 0 P</td></tr>`;
  html += `<tr><td class="rpt-label">Total</td><td>${scoreLine} ${rate(inn.runs, inn.legalBalls)}</td></tr>`;
  html += '</table>';

  html += '<table><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ER</th></tr>';
  inn.bowlers.forEach(bw => {
    html += `<tr><td>${escapeHtml(bw.name)}</td><td>${oversStr(bw.balls)}</td><td>${bw.maidens}</td><td>${bw.runs}</td><td>${bw.wickets}</td><td>${economyRate(bw).toFixed(2)}</td></tr>`;
  });
  html += '</table>';

  if (inn.wicketLog.length > 0) {
    html += '<table><tr><th>Fall of wickets</th><th>Score</th><th>Over</th></tr>';
    inn.wicketLog.forEach(w => {
      html += `<tr><td>${escapeHtml(w.batsman)}</td><td>${w.score}/${w.num}</td><td>${w.overs}</td></tr>`;
    });
    html += '</table>';

    html += '<div class="rpt-section-title">Partnerships</div>';
    html += '<table><tr><th>Pair</th><th>Runs (Balls)</th></tr>';
    inn.wicketLog.forEach(w => {
      html += `<tr><td>${escapeHtml(w.partner)} &amp; ${escapeHtml(w.batsman)}</td><td>${w.partnershipRuns} (${w.partnershipBalls})</td></tr>`;
    });
    const strikerObj = inn.batsmen[inn.strikerIdx];
    const nonStrikerObj = inn.batsmen[inn.nonStrikerIdx];
    if (strikerObj && !strikerObj.out && nonStrikerObj && !nonStrikerObj.out) {
      const lastRuns = inn.runs - inn.partnershipStartRuns;
      const lastBalls = inn.legalBalls - inn.partnershipStartBalls;
      html += `<tr><td>${escapeHtml(nonStrikerObj.name)} &amp; ${escapeHtml(strikerObj.name)} (unbeaten)</td><td>${lastRuns} (${lastBalls})</td></tr>`;
    }
    html += '</table>';
  }

  html += '<div class="rpt-section-title">Over-by-over</div>';
  html += '<table><tr><th>Over</th><th>Bowler</th><th>Balls</th><th>Runs</th></tr>';
  inn.overHistory.forEach((ov, i) => {
    html += `<tr><td>${i + 1}</td><td>${escapeHtml(inn.overBowlers[i])}</td><td>${ov.join(' ')}</td><td>${computeOverTotal(ov)}</td></tr>`;
  });
  if (inn.thisOver.length > 0) {
    html += `<tr><td>${inn.overHistory.length + 1} (in progress)</td><td>${escapeHtml(currentBowler(inn).name)}</td><td>${inn.thisOver.join(' ')}</td><td>${computeOverTotal(inn.thisOver)}</td></tr>`;
  }
  html += '</table>';

  return html;
}

function buildMatchReportHTML() {
  const state = getState();
  const guest = !!(state.user && state.user.isAnonymous);
  const inn1 = state.data[1];
  const inn2 = state.data[2];
  let html = `<h1>${escapeHtml(state.teamA)} v/s ${escapeHtml(state.teamB)}</h1>`;
  html += `<div class="rpt-result">${escapeHtml(matchResultText())}.</div>`;
  if (!guest && inn1.startTime && inn2.endTime) {
    html += `<p style="font-size:11px;color:#666;margin:2px 0 10px;">Started ${formatTime12hr(inn1.startTime)} &middot; finished ${formatTime12hr(inn2.endTime)} &middot; took ${formatDuration(inn1.startTime, inn2.endTime)}</p>`;
  }
  html += buildInningsReportHTML(1, guest);
  html += buildInningsReportHTML(2, guest);

  const bb = guest ? null : bestBatting();
  const bwl = guest ? null : bestBowling();
  if (bb || bwl) {
    html += '<div class="rpt-section-title">Top performers</div>';
    if (bb) html += `<div class="rpt-note"><b>Best batting:</b> ${escapeHtml(bb.name)} — ${bb.runs} (${bb.balls}) SR ${strikeRate(bb.runs, bb.balls)}</div>`;
    if (bwl) html += `<div class="rpt-note"><b>Best bowling:</b> ${escapeHtml(bwl.name)} — ${bwl.wickets}/${bwl.runs} (${oversStr(bwl.balls)} ov)</div>`;
  }
  if (state.manOfMatch) html += `<div class="rpt-note"><b>Player of the Match:</b> ${escapeHtml(state.manOfMatch)}</div>`;
  return wrapReportDocument(`${state.teamA}_vs_${state.teamB}_scorecard`, html);
}

function buildInningsReportDocument(inningsNum) {
  const state = getState();
  const inn = state.data[inningsNum];
  const html = `<h1>${escapeHtml(inn.battingName)} — Innings Report</h1>` + buildInningsReportHTML(inningsNum, false);
  return wrapReportDocument(`${inn.battingName}_innings_report`, html);
}

// history: the flat match-history array (state.matchHistoryCache shape),
// passed in rather than read from state -- matches how M12's
// computeLeaderboardStats(history) already threads it explicitly.
function buildLeaderboardReportHTML(history) {
  const stats = computeLeaderboardStats(history);
  let html = '<h1>Leaderboard</h1>';

  html += '<div class="rpt-band"><span>Points Table</span><span>&nbsp;</span></div>';
  html += '<table><tr><th>Team</th><th>P</th><th>W</th><th>L</th><th>T</th><th>Pts</th></tr>';
  Object.values(stats.teams)
    .sort((a, b) => b.points - a.points)
    .forEach(t => {
      html += `<tr><td>${escapeHtml(t.name)}</td><td>${t.played}</td><td>${t.won}</td><td>${t.lost}</td><td>${t.tied}</td><td>${t.points}</td></tr>`;
    });
  html += '</table>';

  html += '<div class="rpt-band"><span>Top Run Scorers</span><span>&nbsp;</span></div>';
  html += '<table><tr><th>Batsman</th><th>Runs</th><th>HS</th><th>Avg</th><th>SR</th><th>Inns</th></tr>';
  Object.values(stats.batters)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 20)
    .forEach(b => {
      const avg = b.outs > 0 ? (b.runs / b.outs).toFixed(1) : b.runs + '*';
      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
      html += `<tr><td>${escapeHtml(b.name)}</td><td>${b.runs}</td><td>${b.highScore}</td><td>${avg}</td><td>${sr}</td><td>${b.innings}</td></tr>`;
    });
  html += '</table>';

  html += '<div class="rpt-band"><span>Top Wicket-Takers</span><span>&nbsp;</span></div>';
  html += '<table><tr><th>Bowler</th><th>Wkts</th><th>Best</th><th>Econ</th><th>Maidens</th></tr>';
  Object.values(stats.bowlers)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 20)
    .forEach(bw => {
      const econ = bw.balls > 0 ? (bw.runs / (bw.balls / 6)).toFixed(2) : '0.00';
      html += `<tr><td>${escapeHtml(bw.name)}</td><td>${bw.wickets}</td><td>${bw.bestWkts}/${bw.bestRuns}</td><td>${econ}</td><td>${bw.maidens}</td></tr>`;
    });
  html += '</table>';

  html += '<div class="rpt-band"><span>Match History</span><span>&nbsp;</span></div>';
  html += '<table><tr><th>Date</th><th>Match</th><th>Result</th></tr>';
  history.forEach(m => {
    html += `<tr><td>${formatDateShort(m.date)}</td><td>${escapeHtml(m.teamA)} vs ${escapeHtml(m.teamB)}</td><td>${escapeHtml(m.resultText)}</td></tr>`;
  });
  html += '</table>';

  return wrapReportDocument('leaderboard_report', html);
}

module.exports = {
  escapeHtml,
  buildInningsReportHTML,
  buildMatchReportHTML,
  buildInningsReportDocument,
  buildLeaderboardReportHTML,
};
