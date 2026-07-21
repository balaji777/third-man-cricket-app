import firestore from '@react-native-firebase/firestore';
import { recordMatchToHistory } from './matchHistoryLogic';

// Mirrors js/app.js's saveMatchEntryToFirestore. Entry-building and
// cache-update logic lives in matchHistoryLogic.js (RN-free, unit tested
// under node --test); this file is the thin shell that actually talks to
// Firestore, so it can't run there. Split the same way M10 split
// liveMatchLogic.js from liveMatchSync.js.
//
// Saved matches live under users/{uid}/matches -- a separate subcollection
// from M10's users/{uid}/liveMatches, since a recorded match is permanent
// history rather than in-progress scratch state.

function matchesCollection(uid) {
  return firestore().collection('users').doc(uid).collection('matches');
}

async function saveMatchEntryToFirestore(state, entry) {
  if (!state.user) return;
  const previousDocId = state.matchHistoryDocId;
  try {
    // Client-generated id (no network round trip needed), so the match has
    // an id to reference immediately even if the write below is still
    // queued offline (Firestore's offline persistence handles the retry).
    const ref = matchesCollection(state.user.uid).doc();
    state.matchHistoryDocId = ref.id;
    await ref.set(entry);
    if (previousDocId) {
      try {
        await matchesCollection(state.user.uid).doc(previousDocId).delete();
      } catch (e) {
        console.error('Failed to remove the superseded match record:', e);
      }
    }
  } catch (e) {
    console.error('Failed to save match to Firestore:', e);
  }
}

// Wired into store.js's commit() from App.js, alongside M10's
// syncOnCommit. Called on every commit; recordMatchToHistory's own
// matchRecorded guard keeps this a no-op once the current result has
// already been saved.
function recordMatchOnCommit(state) {
  if (state.screen !== 'result') return;
  const entry = recordMatchToHistory(state);
  if (entry) saveMatchEntryToFirestore(state, entry);
}

export { saveMatchEntryToFirestore, recordMatchOnCommit };
