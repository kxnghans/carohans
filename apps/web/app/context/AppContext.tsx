"use client";

import React from 'react';
import { DataProvider, useData } from './DataContext';
import { UIProvider, useUI } from './UIContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { AuthProvider, useAuth } from './AuthContext';
import { AppContextType } from '../types/context'; // Import legacy type definition

export * from '../types/context'; // Re-export for compatibility

/**
 * AppProvider now composes all the domain-specific providers.
 * The order is important: UI and Theme are outer (global/static), Auth is next (user state), and Data is inner (depends on user).
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </UIProvider>
  );
}

/**
 * The legacy hook. It now composes the other hooks to provide a single,
 * backward-compatible interface to the rest of the application.
 * This prevents us from having to refactor 30+ components at once.
 */
export function useAppStore(): AppContextType {
  const data = useData();
  const ui = useUI();
  const theme = useTheme();
  const auth = useAuth();

  return {
    ...data,
    ...ui,
    ...theme,
    ...auth,
  };
}
