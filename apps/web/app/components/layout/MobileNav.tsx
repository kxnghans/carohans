"use client";

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../../lib/icons';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ActionItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  className?: string;
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  actions?: ActionItem[];
  footer?: ReactNode;
}

export const MobileNav = ({ isOpen, onClose, navItems, actions, footer }: MobileNavProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { X } = Icons;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-[300px] xs:w-[340px] sm:w-[380px] bg-surface/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col border-l border-border/50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="flex-shrink-0 w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-primary-text font-black shadow-lg shadow-primary/20">
              CH
            </div>
            <div className="flex flex-col">
              <span className="text-theme-subtitle tracking-tight leading-none">Menu</span>
              <span className="text-[10px] text-muted uppercase tracking-[0.2em] mt-1.5">Workspace</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-background rounded-full transition-all text-muted hover:text-foreground border border-transparent hover:border-border active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
          
          {/* Navigation Links */}
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] text-muted uppercase tracking-[0.2em] mb-3 opacity-60">Navigation</p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group
                    ${isActive 
                      ? 'bg-primary text-primary-text shadow-xl shadow-primary/20' 
                      : 'text-muted hover:text-primary hover:bg-primary/5'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-text' : 'text-muted group-hover:text-primary'} transition-colors`} />
                  <span className="text-theme-label font-semibold">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-text" />}
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          {actions && actions.length > 0 && (
            <div className="space-y-3">
              <p className="px-2 text-[10px] text-muted uppercase tracking-[0.2em] mb-3 opacity-60">Quick Actions</p>
              <div className="grid grid-cols-1 gap-2.5">
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                        action.onClick();
                        onClose();
                    }}
                    className={`
                        flex items-center gap-4 px-4 py-4 rounded-2xl text-theme-caption border transition-all text-left group
                        ${action.className || 'bg-background/50 border-border/50 text-foreground hover:border-primary/30 hover:bg-surface hover:shadow-lg hover:shadow-primary/5'}
                    `}
                  >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-text transition-colors">
                      <action.icon className="w-4 h-4" />
                    </div>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer (User Actions) */}
        {footer && (
          <div className="p-6 border-t border-border/50 bg-background/30 backdrop-blur-md">
             {footer}
          </div>
        )}
      </div>
    </>,
    document.body
  );
};
