import React, { createContext, useContext, useMemo, useState } from 'react';
import { darkTheme, lightTheme, shadowCard } from './tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  const value = useMemo(() => {
    const colors = theme === 'light' ? lightTheme : darkTheme;
    return {
      theme,
      colors,
      shadowCard: shadowCard(theme),
      toggleTheme: () => setTheme(t => (t === 'light' ? 'dark' : 'light')),
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
