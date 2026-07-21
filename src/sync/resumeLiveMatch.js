import firestore from '@react-native-firebase/firestore';
import { getState } from '../engine/state';
import { commit } from '../engine/store';
import { hydrateFromLiveMatch } from './liveMatchLogic';
import { deleteLiveMatchDoc } from './liveMatchSync';

// New surface, not in the source -- js/app.js scaffolded live match sync
// (liveMatchSync.js) but never built the cross-device resume prompt itself
// (per its own commit message: "the actual cross-device resume prompt ...
// is a follow-up"). This is that follow-up: check for an existing live
// match on sign-in, and let the user resume it or discard it.
//
// hydrateFromLiveMatch itself (the inverse of liveMatchSnapshot) lives in
// liveMatchLogic.js, RN-free and unit tested under node --test; this file
// is the thin shell around it that talks to Firestore and commit().

// Called from firebaseAuth.js's sign-in path. Returns the live match doc
// (plain data, not the Firestore snapshot) or null if there's nothing to
// resume -- including on error (e.g. offline), so a lookup failure just
// falls through to the normal setup/local-resume flow instead of blocking
// sign-in.
async function findExistingLiveMatch(uid) {
  try {
    const snap = await firestore()
      .collection('users')
      .doc(uid)
      .collection('liveMatches')
      .limit(1)
      .get();
    if (snap.empty) return null;
    return snap.docs[0].data();
  } catch (e) {
    console.error('Failed to check for a resumable live match:', e);
    return null;
  }
}

function confirmResumeLiveMatch() {
  const state = getState();
  if (!state.pendingLiveMatch) return;
  hydrateFromLiveMatch(state, state.pendingLiveMatch);
  commit();
}

function declineResumeLiveMatch() {
  const state = getState();
  const doc = state.pendingLiveMatch;
  if (doc) deleteLiveMatchDoc(state.user, doc.matchId);
  state.pendingLiveMatch = null;
  state.screen = 'setup';
  commit();
}

export { findExistingLiveMatch, confirmResumeLiveMatch, declineResumeLiveMatch };
