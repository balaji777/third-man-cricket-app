import firestore from '@react-native-firebase/firestore';
import { getState } from '../engine/state';
import { LIVE_SYNC_SCREENS, canSyncLiveMatch, liveMatchSnapshot } from './liveMatchLogic';

// Mirrors js/app.js's pushLiveMatchToCloud/scheduleLiveMatchSync/
// deleteLiveMatchDoc. The sync-decision and data-shaping logic itself lives
// in liveMatchLogic.js (RN-free, unit tested under node --test); this file
// is the thin shell that actually talks to Firestore, so it can't run
// there.
//
// @react-native-firebase/firestore enables offline persistence by default
// (unlike the source's Firebase JS SDK, which had to opt in via
// initializeFirestore) -- no extra setup needed here.

function liveMatchesCollection(uid) {
  return firestore().collection('users').doc(uid).collection('liveMatches');
}

function pushLiveMatchToCloud(state) {
  if (!canSyncLiveMatch(state)) return;
  try {
    // .set() can throw synchronously for a bad data shape (as opposed to
    // network/permission failures, which only reject the returned promise)
    // -- catch both.
    liveMatchesCollection(state.user.uid)
      .doc(state.matchId)
      .set(liveMatchSnapshot(state, firestore.FieldValue.serverTimestamp()))
      .catch(e => {
        console.error('Failed to sync live match:', e);
      });
  } catch (e) {
    console.error('Failed to sync live match:', e);
  }
}

let liveSyncTimer = null;

// Debounced so a burst of commits (popup open/close, undo, etc.) collapses
// into one write instead of one per commit -- Firestore's offline queue
// already handles the actual network retry, so this is purely about write
// volume.
function scheduleLiveMatchSync(state) {
  if (!canSyncLiveMatch(state)) return;
  if (liveSyncTimer) clearTimeout(liveSyncTimer);
  liveSyncTimer = setTimeout(() => {
    liveSyncTimer = null;
    pushLiveMatchToCloud(getState());
  }, 2500);
}

function clearLiveSyncTimer() {
  if (liveSyncTimer) {
    clearTimeout(liveSyncTimer);
    liveSyncTimer = null;
  }
}

function deleteLiveMatchDoc(user, matchId) {
  if (!(user && matchId)) return;
  liveMatchesCollection(user.uid)
    .doc(matchId)
    .delete()
    .catch(e => {
      console.error('Failed to remove synced live match:', e);
    });
}

// The live-sync-cleanup subset of the source's recordMatchToHistory() (the
// rest of that function -- building and saving the match-history entry --
// is M11's job; this is the part M10 owns). Called whenever a commit lands
// on the terminal 'result' screen; idempotent once matchId is nulled out.
function finalizeLiveMatchSync(state) {
  clearLiveSyncTimer();
  deleteLiveMatchDoc(state.user, state.matchId);
  state.matchId = null;
}

// Wired into store.js's commit() from App.js, mirroring the source's
// render()-time unconditional scheduleLiveMatchSync() call.
function syncOnCommit(state) {
  if (canSyncLiveMatch(state)) {
    scheduleLiveMatchSync(state);
  } else if (state.matchId && state.screen === 'result') {
    finalizeLiveMatchSync(state);
  }
}

export {
  LIVE_SYNC_SCREENS,
  canSyncLiveMatch,
  pushLiveMatchToCloud,
  scheduleLiveMatchSync,
  clearLiveSyncTimer,
  deleteLiveMatchDoc,
  finalizeLiveMatchSync,
  syncOnCommit,
};
