import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEME_MODES } from '../utils/constants';

const ThemeContext = createContext({
  theme: THEME_MODES.SYSTEM,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Load saved theme or default to SYSTEM
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('pulsechat_theme');
    if (saved && Object.values(THEME_MODES).includes(saved)) {
      return saved;
    }
    return THEME_MODES.SYSTEM;
  });

  // Track system dark mode state
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Compute resolved dark mode boolean
  const isDark =
    theme === THEME_MODES.DARK ||
    (theme === THEME_MODES.SYSTEM && systemIsDark);

  // Apply dark class to document root and persist preference
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pulsechat_theme', theme);
  }, [isDark, theme]);

  // One-click quick toggle
  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === THEME_MODES.DARK) return THEME_MODES.LIGHT;
      if (prev === THEME_MODES.LIGHT) return THEME_MODES.DARK;
      // If currently system, flip to opposite of current system theme
      return systemIsDark ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    });
  };

  // Explicit theme setter (light, dark, system)
  const setTheme = (newTheme) => {
    if (Object.values(THEME_MODES).includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
