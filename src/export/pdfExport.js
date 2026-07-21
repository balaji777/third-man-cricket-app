import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { getState } from '../engine/state';
import { commit } from '../engine/store';
import { buildMatchReportHTML, buildInningsReportDocument, buildLeaderboardReportHTML } from './reportHtml';

// Mirrors js/app.js's printAndRestoreTitle() + window.print() -- the source
// rendered a hidden #print-area and invoked the browser's print dialog (the
// user picked "Save as PDF" themselves); RN has no such dialog, so this
// generates a real PDF file via react-native-html-to-pdf and hands it
// straight to the native share sheet so the user can save/send it.
async function generateAndSharePDF(html, fileName) {
  const safeName = fileName.replace(/\s+/g, '_');
  try {
    const pdf = await generatePDF({ html, fileName: safeName, base64: false });
    const filePath = pdf.filePath.startsWith('file://') ? pdf.filePath : `file://${pdf.filePath}`;
    await Share.open({ url: filePath, type: 'application/pdf', title: safeName, failOnCancel: false });
  } catch (e) {
    if (e && e.message === 'User did not share') return; // share sheet dismissed, not an error
    console.error('Failed to export PDF:', e);
    const state = getState();
    state.toastMessage = "Couldn't create the PDF — please try again.";
    commit();
  }
}

export function exportScorecardPDF() {
  const state = getState();
  generateAndSharePDF(buildMatchReportHTML(), `${state.teamA}_vs_${state.teamB}_scorecard`);
}

export function exportInningsPDF(inningsNum) {
  const state = getState();
  const inn = state.data[inningsNum];
  generateAndSharePDF(buildInningsReportDocument(inningsNum), `${inn.battingName}_innings_report`);
}

// history: the flat match-history array (state.matchHistoryCache shape).
export function exportLeaderboardPDF(history) {
  if (!history || history.length === 0) return;
  generateAndSharePDF(buildLeaderboardReportHTML(history), 'leaderboard_report');
}
