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

// Wired up in M8 (AsyncStorage persistence) -- a no-op until then.
function setPersistHook(fn) {
  persistHook = fn;
}

function commit() {
  setState(Object.assign({}, getState()));
  if (persistHook) persistHook(getState());
  listeners.forEach(fn => fn());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

module.exports = { commit, subscribe, setPersistHook };
