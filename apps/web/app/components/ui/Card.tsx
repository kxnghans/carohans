import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card = ({ children, className = "", noPadding = false }: CardProps) => (
  <div className={twMerge("bg-surface rounded-2xl shadow-sm border border-border overflow-hidden focus:outline-none focus:ring-0 focus:border-transparent", className)}>
    <div className={noPadding ? "" : "p-6"}>{children}</div>
  </div>
);
