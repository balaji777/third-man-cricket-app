import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, shadowCard } from './tokens';

const ThemeContext = createContext(null);

// The source keeps theme inside its single global `state` object, persisted
// as part of the same localStorage blob as match state. Here theme lives in
// its own context (see engine/EngineProvider.js for why), so it needs its
// own small persistence key to survive an app restart.
const THEME_STORAGE_KEY = 'creaseTheme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(saved => {
        if (saved === 'light' || saved === 'dark') setTheme(saved);
      })
      .catch(() => {});
  }, []);

  const value = useMemo(() => {
    const colors = theme === 'light' ? lightTheme : darkTheme;
    return {
      theme,
      colors,
      shadowCard: shadowCard(theme),
      toggleTheme: () => {
        setTheme(t => {
          const next = t === 'light' ? 'dark' : 'light';
          AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
          return next;
        });
      },
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
