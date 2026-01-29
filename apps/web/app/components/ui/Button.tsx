import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, ...props }: ButtonProps) => {
  const baseStyle = "text-theme-body-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary text-primary-text hover:opacity-90 shadow-lg dark:shadow-none",
    secondary: "bg-surface text-foreground border border-border hover:bg-background",
    danger: "bg-error text-primary-text hover:opacity-90 shadow-md dark:shadow-none",
    success: "bg-success text-primary-text hover:opacity-90 shadow-md dark:shadow-none",
    warning: "bg-warning text-primary-text hover:opacity-90 shadow-md dark:shadow-none",
    info: "bg-accent-primary text-primary-text hover:opacity-90 shadow-md dark:shadow-none",
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
