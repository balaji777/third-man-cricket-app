import React, { createContext, useContext } from 'react';
import { useEngineState } from './useEngineState';

// Hosts the one useSyncExternalStore subscription and hands the current
// state snapshot down. Action functions are not provided here -- screens
// import them directly from engine/actions/*, mirroring the source's flat
// "any handler can call any global function" model.
const EngineContext = createContext(null);

export function EngineProvider({ children }) {
  const state = useEngineState();
  return <EngineContext.Provider value={state}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const state = useContext(EngineContext);
  if (!state) {
    throw new Error('useEngine must be used within an EngineProvider');
  }
  return state;
}
