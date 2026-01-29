"use client";

import React from 'react';
import { Icons } from '../../lib/icons';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

export const DatePicker = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "DD MMM YYYY",
  className = "",
  containerClassName = ""
}: DatePickerProps) => {
  const { Calendar } = Icons;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      <label className="text-theme-caption font-black text-muted uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input 
          type="date"
          className={`w-full p-2.5 border border-border rounded-lg bg-background text-foreground text-theme-label font-medium outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary cursor-pointer transition-colors hover:border-primary/50 ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};
