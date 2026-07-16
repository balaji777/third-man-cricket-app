import AsyncStorage from '@react-native-async-storage/async-storage';

// Ports the source's saveMatchState/loadMatchState/clearSavedMatch
// (localStorage, key 'creaseMatchState') onto AsyncStorage. Same key, same
// field allow/deny semantics -- AsyncStorage is inherently async (unlike
// localStorage), so loadMatchState must be awaited once at bootstrap before
// the first render, rather than called synchronously like the source did.
const STORAGE_KEY = 'creaseMatchState';

export async function saveMatchState(state) {
  try {
    const toSave = Object.assign({}, state);
    delete toSave.user;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    // storage unavailable or full; state just won't persist
  }
}

// Returns the restored state object, or null if there's nothing to resume
// (matches the source's loadMatchState() false-return guard: no saved
// state, or the saved screen was setup/login/authLoading).
export async function loadMatchState() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!parsed || !parsed.screen || parsed.screen === 'setup' || parsed.screen === 'login' || parsed.screen === 'authLoading') {
      return null;
    }
    parsed.playerPopup = null;
    parsed.extraPopup = null;
    parsed.dismissalPopup = null;
    parsed.tossOpen = false;
    parsed.toastMessage = null;
    parsed.resetConfirmOpen = false;
    parsed.guestUpsellOpen = false;
    parsed.user = null;
    parsed.authReady = false;
    parsed.authError = null;
    parsed.matchHistoryCache = null;
    return parsed;
  } catch (e) {
    return null;
  }
}

export async function clearSavedMatch() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // storage unavailable
  }
}
