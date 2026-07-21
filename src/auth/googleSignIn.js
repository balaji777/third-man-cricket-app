import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { getState } from '../engine/state';
import { commit } from '../engine/store';

// The 'client_type: 3' (Web) OAuth client already registered in this
// project's google-services.json -- required by GoogleSignin to get an
// idToken usable by Firebase Auth (a "server client ID", not the Android
// client bound to this app's signing cert).
const WEB_CLIENT_ID = '45655423481-m24d7u9h03sq4fi03f8g3qpqbpkkrps3.apps.googleusercontent.com';

export function configureGoogleSignIn() {
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
}

// Bridges a native Google Sign-In idToken into a Firebase JS-SDK-style
// credential -- the RN equivalent of the source's nativeGoogleCredential(),
// which did the same bridging from Capacitor's native plugin.
//
// signIn() alone doesn't return an accessToken (only idToken) on this
// library version -- getTokens() is a second native call for it. The
// Firebase JS wrapper accepts a null accessToken, but the underlying native
// Android SDK's GoogleAuthProvider.getCredential() throws "accessToken
// cannot be empty" if it's actually missing, so both are required here.
async function nativeGoogleCredential() {
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  const idToken = result && result.data ? result.data.idToken : result && result.idToken;
  if (!idToken) throw new Error('No idToken returned from Google Sign-In');
  const { accessToken } = await GoogleSignin.getTokens();
  return auth.GoogleAuthProvider.credential(idToken, accessToken);
}

export function signInWithGoogle() {
  const state = getState();
  state.authError = null;
  commit();
  nativeGoogleCredential()
    .then(credential => auth().signInWithCredential(credential))
    .catch(err => {
      const s = getState();
      s.authError = err.message || 'Sign-in failed. Please try again.';
      commit();
    });
}

function applyLinkedUser(result) {
  const state = getState();
  state.user = result.user;
  state.guestUpsellOpen = false;
  commit();
}

function setAuthError(err) {
  const state = getState();
  state.authError = err.message || 'Sign-in failed. Please try again.';
  commit();
}

// Guest -> Google upgrade. Mirrors the source's upgradeToGoogle() +
// handleLinkResult(): on 'auth/credential-already-in-use' (that Google
// account already has a real account elsewhere), falls back to signing
// into the existing account rather than the anonymous one.
export function upgradeToGoogle() {
  const state = getState();
  if (!state.user || !state.user.isAnonymous) return;
  nativeGoogleCredential()
    .then(credential => auth().currentUser.linkWithCredential(credential))
    .then(applyLinkedUser)
    .catch(err => {
      if (err.code === 'auth/credential-already-in-use') {
        const credential = auth.GoogleAuthProvider.credentialFromError(err);
        auth().signInWithCredential(credential).then(applyLinkedUser).catch(setAuthError);
      } else {
        setAuthError(err);
      }
    });
}
