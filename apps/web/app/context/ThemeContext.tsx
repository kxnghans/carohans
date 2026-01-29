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
      root.setAttribute('data-theme', targetTheme);
      root.style.colorScheme = effectiveTheme;

      // Robust theme-color update
      const themeColor = effectiveTheme === 'dark' ? '#0f172a' : '#f8fafc';
      
      // Remove all existing theme-color tags to avoid media query conflicts
      const existingTags = document.querySelectorAll('meta[name="theme-color"]');
      existingTags.forEach(tag => tag.remove());

      // Create new tag
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      metaTag.setAttribute('content', themeColor);
      document.head.appendChild(metaTag);

      // Handle iOS Status Bar Style
      let appleTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!appleTag) {
        appleTag = document.createElement('meta');
        appleTag.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(appleTag);
      }
      // "default" is white bg/black text, "black-translucent" is transparent bg/white text
      // This combined with viewport-fit=cover lets the html bg bleed into safe areas
      appleTag.setAttribute('content', effectiveTheme === 'dark' ? 'black-translucent' : 'default');

      // Web app capability for standalone behavior
      let capableTag = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (!capableTag) {
        capableTag = document.createElement('meta');
        capableTag.setAttribute('name', 'apple-mobile-web-app-capable');
        capableTag.setAttribute('content', 'yes');
        document.head.appendChild(capableTag);
      }
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
