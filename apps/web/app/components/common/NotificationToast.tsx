"use client";

import React from 'react';
import { useAppStore } from '../../context/AppContext';

export const NotificationToast = () => {
  const { notification } = useAppStore();

  if (!notification) return null;

  return (
    <div className="fixed top-24 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-400'}`}></div>
      {notification.msg}
    </div>
  );
};
