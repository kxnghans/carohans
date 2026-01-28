import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, ...props }: ButtonProps) => {
  const baseStyle = "text-theme-body-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-slate-200 dark:shadow-none",
    secondary: "bg-surface text-muted border border-border hover:bg-background",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-100 dark:shadow-none",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 dark:shadow-none",
    warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-100 dark:shadow-none",
    info: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 dark:shadow-none",
    ghost: "text-muted hover:bg-background hover:text-foreground"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-theme-caption",
    md: "px-5 py-2.5",
    lg: "px-6 py-4"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
