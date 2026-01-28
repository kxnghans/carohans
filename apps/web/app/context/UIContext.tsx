"use client";
import React, { createContext, useContext, useState } from 'react';

export interface UIContextType {
  showNotification: (msg: string, type?: string) => void;
  notification: { msg: string; type: string } | null;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);

  const showNotification = (msg: string, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <UIContext.Provider value={{ notification, showNotification }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};
