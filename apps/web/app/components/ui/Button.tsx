import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, ...props }: ButtonProps) => {
  const baseStyle = "font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-slate-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-4 text-base"
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
