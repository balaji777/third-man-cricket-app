import auth from '@react-native-firebase/auth';
import { getState } from '../engine/state';
import { commit } from '../engine/store';

// Ported from the source's window.onFirebaseAuthChange / continueAsGuest /
// signOutUser. Bare RN has no web-vs-native branch to consider (unlike the
// Capacitor source, which had to detect isNativePlatform() since it also
// shipped as a plain website) -- this app is always native.
const SPLASH_MIN_MS = 1600;

// pendingResumeScreen is the screen a persisted match should resume to
// (e.g. 'scoring'), determined by App.js's AsyncStorage load before this
// listener is attached. null means there was nothing to resume -- go to
// 'setup' once signed in.
export function initAuthListener(pendingResumeScreen) {
  const splashStartTime = Date.now();
  let resumeScreen = pendingResumeScreen;

  return auth().onAuthStateChanged(user => {
    const applyAuthChange = () => {
      const state = getState();
      state.user = user;
      state.authReady = true;
      if (user) {
        state.authError = null;
        state.screen = resumeScreen || 'setup';
        resumeScreen = null;
      } else {
        state.screen = 'login';
      }
      commit();
    };
    const elapsed = Date.now() - splashStartTime;
    if (getState().screen === 'authLoading' && elapsed < SPLASH_MIN_MS) {
      setTimeout(applyAuthChange, SPLASH_MIN_MS - elapsed);
    } else {
      applyAuthChange();
    }
  });
}

export function continueAsGuest() {
  auth()
    .signInAnonymously()
    .catch(err => {
      const state = getState();
      state.authError = err.message || 'Sign-in failed. Please try again.';
      commit();
    });
}

export function signOutUser() {
  auth().signOut();
}
