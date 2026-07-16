// Separated from store.js so the pure engine (state.js/store.js/helpers.js/
// actions/*) stays React-free and testable with plain `node --test`. Screens
// (from M4 onward) call this hook to re-render when any action commits.
const { useSyncExternalStore } = require('react');
const { getState } = require('./state');
const { subscribe } = require('./store');

function useEngineState() {
  return useSyncExternalStore(subscribe, getState);
}

module.exports = { useEngineState };
