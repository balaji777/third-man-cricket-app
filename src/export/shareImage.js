import Share from 'react-native-share';
import { getState } from '../engine/state';
import { commit } from '../engine/store';

// Mirrors js/app.js's shareScorecardImage()/buildShareCanvas(). The source
// drew the card directly onto a <canvas> and shared the resulting blob; the
// RN port instead renders a real ShareCard component (src/components/
// ShareCard.js) off-screen and captures it via react-native-view-shot --
// shareCardRef is that capture ref, created in ResultScreen.js where the
// ShareCard is mounted.
export async function shareScorecardImage(shareCardRef) {
  const state = getState();
  try {
    const uri = await shareCardRef.current.capture();
    const filePath = uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`;
    const fileName = `${state.teamA}_vs_${state.teamB}_result`.replace(/\s+/g, '_');
    await Share.open({ url: filePath, type: 'image/png', title: fileName, failOnCancel: false });
  } catch (e) {
    if (e && e.message === 'User did not share') return; // share sheet dismissed, not an error
    console.error('Failed to share scorecard image:', e);
    state.toastMessage = "Couldn't create the share image — please try again.";
    commit();
  }
}
