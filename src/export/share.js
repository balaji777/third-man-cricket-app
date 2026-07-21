import { Share } from 'react-native';
import { getState } from '../engine/state';
import { commit } from '../engine/store';
import { generateShareText, generateInningsShareText } from './shareText';

// Mirrors js/app.js's shareScorecard/shareInnings -- the source preferred
// navigator.share and fell back to clipboard copy where it wasn't available.
// RN's core Share module covers the same ground for plain text on both
// platforms (unlike its handling of file URLs -- see pdfExport.js/
// shareImage.js, which need react-native-share instead), so there's no
// clipboard fallback to port here.
async function shareText(message, title) {
  try {
    await Share.share({ message, title });
  } catch (e) {
    console.error('Failed to open the share sheet:', e);
    const state = getState();
    state.toastMessage = "Couldn't open the share sheet — please try again.";
    commit();
  }
}

export function shareScorecard() {
  shareText(generateShareText(), 'Match scorecard');
}

export function shareInnings(inningsNum) {
  shareText(generateInningsShareText(inningsNum), 'Innings report');
}
