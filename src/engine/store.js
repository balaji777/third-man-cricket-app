// Replaces the source app's DOM-rebuild render(). The ~30 ported action
// functions keep mutating state's nested fields in place (exactly as the
// source does) and call commit() where the source called render().
//
// commit() does a shallow top-level clone so React's useSyncExternalStore
// sees a changed reference via Object.is, without requiring every mutating
// function to be rewritten into an immutable-update style.

const { getState, setState } = require('./state');

const listeners = new Set();
let persistHook = null;
let clearHook = null;
let syncHook = null;

// Wired up in App.js (M8, AsyncStorage persistence; M10, Firestore live
// match sync). Kept as hooks rather than a direct require of the
// persistence/sync modules so engine/* stays free of any RN/AsyncStorage/
// Firestore dependency and keeps running under plain `node --test`.
function setPersistHook(fn) {
  persistHook = fn;
}

function setClearHook(fn) {
  clearHook = fn;
}

function setSyncHook(fn) {
  syncHook = fn;
}

function commit() {
  setState(Object.assign({}, getState()));
  if (persistHook) persistHook(getState());
  if (syncHook) syncHook(getState());
  listeners.forEach(fn => fn());
}

// Called by newMatch() -- the source's equivalent always clears the saved
// match blob on a fresh match, regardless of which screen triggered it.
function triggerClear() {
  if (clearHook) clearHook();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

module.exports = { commit, subscribe, setPersistHook, setClearHook, setSyncHook, triggerClear };
