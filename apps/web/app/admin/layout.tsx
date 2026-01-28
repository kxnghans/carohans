"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../lib/icons';
import { Button } from '../components/ui/Button';
import { CalendarModal } from '../components/modals/CalendarModal';
import { ContactModal } from '../components/modals/ContactModal';
import { NotificationToast } from '../components/common/NotificationToast';
import { useAppStore } from '../context/AppContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, theme, setTheme } = useAppStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const {
    LayoutDashboard,
    Users,
    TrendingUp,
    Plus,
    Calendar: CalendarIcon,
    MapPin,
    Phone,
    Sun,
    Moon,
    Laptop
  } = Icons;

  const ThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const navItems = [
    { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/inventory', label: 'Inventory', icon: Plus },
    { href: '/admin/bi', label: 'Insights', icon: TrendingUp },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/users', label: 'Access', icon: Icons.Shield },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-indigo-100 pb-24">
      {/* HEADER */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-bold shadow-lg shadow-slate-200 dark:shadow-none">
              CH
            </div>
            <div className="block max-w-[100px] xs:max-w-[120px] sm:max-w-none overflow-hidden">
              <span className="font-bold text-base sm:text-lg tracking-tight block leading-none truncate">CaroHans</span>
              <span className="text-[8px] sm:text-[10px] text-muted font-bold uppercase tracking-wider block truncate">Ventures</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button 
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-theme-caption font-bold tracking-wide uppercase hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-border/50"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="pt-px">Contact</span>
            </button>
            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
            
            <div className="hidden sm:block">
              <Button variant="secondary" size="sm" className="h-[42px]" onClick={() => setIsCalendarOpen(true)}>
                <CalendarIcon className="w-4 h-4 mr-2 text-muted" /> Block Calendar
              </Button>
            </div>
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsContactOpen(false)} />

            <div className="h-6 w-px bg-border mx-1"></div>

            {/* SIGN OUT */}
            <button
              onClick={logout}
              className="text-theme-caption font-bold text-muted hover:text-foreground h-[42px] px-4 rounded-xl bg-background border border-border hover:bg-surface transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>

                        {/* THEME TOGGLE */}
                        <button 
                          onClick={cycleTheme}
                          title={`Theme: ${theme}`}
                          className="h-[42px] aspect-square text-muted hover:text-primary dark:hover:text-amber-500 transition-colors flex items-center justify-center rounded-full bg-background border border-border hover:bg-surface"
                        >
                          <ThemeIcon />
                        </button>          </div>
        </div>
      </header>

      <NotificationToast />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* ADMIN NAVIGATION */}
        <div className="flex flex-wrap items-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {navItems.map((tab) => {
             const isActive = pathname === tab.href;
             return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-full text-theme-subtitle transition-all border-2
                    ${isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-white dark:border-slate-900 shadow-lg shadow-indigo-200/20 dark:shadow-none'
                    : 'bg-surface text-muted hover:bg-background border-transparent'}
                  `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* PAGE CONTENT */}
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
