import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card = ({ children, className = "", noPadding = false }: CardProps) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden ${className}`}>
    <div className={noPadding ? "" : "p-6"}>{children}</div>
  </div>
);
