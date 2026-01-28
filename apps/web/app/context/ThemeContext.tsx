"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  // Load theme from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('carohans_theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    localStorage.setItem('carohans_theme', newTheme);
  };

  useEffect(() => {
    const applyTheme = (targetTheme: 'light' | 'dark' | 'system') => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      let effectiveTheme: 'light' | 'dark' = 'light';
      if (targetTheme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        effectiveTheme = targetTheme;
      }
      
      root.classList.add(effectiveTheme);
      root.setAttribute('data-theme', targetTheme); // For potential CSS targeting
    };

    applyTheme(theme);

    // Add listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
