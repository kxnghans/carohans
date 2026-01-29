"use client";

import React from 'react';
import { useAppStore } from '../../context/AppContext';

export const NotificationToast = () => {
  const { notification } = useAppStore();

  if (!notification) return null;

  return (
    <div className="fixed top-24 right-6 bg-surface/90 backdrop-blur-xl text-foreground px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none border border-border z-[100] animate-in slide-in-from-right-4 fade-in duration-500 flex items-center gap-4 group">
      <div className={`w-3 h-3 rounded-full shrink-0 shadow-sm ${
        notification.type === 'error' 
        ? 'bg-error shadow-rose-500/40' 
        : notification.type === 'info'
        ? 'bg-primary shadow-primary/40'
        : 'bg-success shadow-emerald-500/40'
      }`}></div>
      <p className="text-theme-body font-medium tracking-tight">{notification.msg}</p>
    </div>
  );
};
