import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card = ({ children, className = "", noPadding = false }: CardProps) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden focus:outline-none focus:ring-0 focus:border-transparent ${className}`}>
    <div className={noPadding ? "" : "p-6"}>{children}</div>
  </div>
);
