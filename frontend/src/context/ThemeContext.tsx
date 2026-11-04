import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Theme,
  ThemeOption,
  THEMES_LIST,
  THEME_MAP,
  THEME_IDS,
  DEFAULT_THEME,
} from '../constants/themes';

export type { Theme, ThemeOption };
export { THEMES_LIST, THEME_MAP, THEME_IDS, DEFAULT_THEME };

interface ThemeContextType {
  theme: Theme;
  currentTheme: ThemeOption;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  vivid: boolean;
  setVivid: (vivid: boolean) => void;
  themesList: ThemeOption[];
}

const THEME_STORAGE_KEY = 'affiliatex_theme';
const VIVID_STORAGE_KEY = 'affiliatex_vivid';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeClasses(theme: Theme, vivid: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const classes = root.classList;

  // Remove existing non-active theme-* classes
  THEME_IDS.forEach((id) => {
    if (id !== 'light' && id !== 'dark') {
      classes.remove(`theme-${id}`);
    }
  });

  const isDark =
    theme === 'dark' ||
    theme === 'midnight' ||
    Boolean(THEME_MAP[theme]?.isDark);

  classes.toggle('dark', isDark);
  classes.toggle('light', !isDark);

  if (theme !== 'light' && theme !== 'dark') {
    classes.add(`theme-${theme}`);
  }

  root.setAttribute('data-theme', theme);
  classes.toggle('vivid', vivid);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
      if (saved && THEME_IDS.includes(saved)) {
        return saved;
      }
    } catch {
      /* storage unavailable: default */
    }
    return DEFAULT_THEME;
  });

  const [vivid, setVividState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(VIVID_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    applyThemeClasses(theme, vivid);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(VIVID_STORAGE_KEY, vivid ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  }, [theme, vivid]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setVivid = (nextVivid: boolean) => {
    setVividState(nextVivid);
  };

  const currentTheme = THEME_MAP[theme] || THEME_MAP[DEFAULT_THEME];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentTheme,
        setTheme,
        toggleTheme,
        vivid,
        setVivid,
        themesList: THEMES_LIST,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
