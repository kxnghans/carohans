"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../lib/icons';
import { Button } from '../components/ui/Button';
import { CalendarModal } from '../components/modals/CalendarModal';
import { ContactModal } from '../components/modals/ContactModal';
import { ClientSelector } from '../components/modals/ClientSelector';
import { NotificationToast } from '../components/common/NotificationToast';
import { MobileNav } from '../components/layout/MobileNav';
import { useAppStore } from '../context/AppContext';
import { Client } from '../types';

const ThemeIcon = ({ theme }: { theme: 'light' | 'dark' | 'system' }) => {
  const { Sun, Moon, Laptop } = Icons;
  if (theme === 'light') return <Sun className="w-4 h-4" />;
  if (theme === 'dark') return <Moon className="w-4 h-4" />;
  return <Laptop className="w-4 h-4" />;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, theme, setTheme, clients, setPortalFormData } = useAppStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    LayoutDashboard,
    Users,
    TrendingUp,
    Plus,
    Calendar: CalendarIcon,
    Phone,
    ExternalLink,
    Menu
  } = Icons;

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const handleClientPortalAccess = (client: Client) => {
    setPortalFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        username: client.username || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        image: client.image || '',
        color: client.color || '',
        start: '',
        end: ''
    });
    setIsClientSelectorOpen(false);
    router.push('/portal/inventory');
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
      <header className="bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-40 shadow-sm md:shadow-md transition-shadow">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 md:h-22 flex items-center justify-between">
          <Link href="/admin/overview" className="flex items-center gap-4 group">
            <div className="flex-shrink-0 w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-primary-text font-black shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              CH
            </div>
            <div className="block max-w-[140px] xs:max-w-[160px] sm:max-w-none overflow-hidden">
              <span className="text-theme-title tracking-tight block leading-none truncate font-black">CaroHans</span>
              <span className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] block truncate mt-1">Ventures</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              <button 
                onClick={() => setIsClientSelectorOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 text-primary border border-primary/10 hover:bg-primary/10 transition-all font-semibold text-theme-caption uppercase tracking-wide"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="pt-px">Client Portal</span>
              </button>
              
              <button 
                onClick={() => setIsContactOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 text-primary border border-primary/10 hover:bg-primary/10 transition-all font-semibold text-theme-caption uppercase tracking-wide"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="pt-px">Contact</span>
              </button>

              <Button variant="secondary" size="sm" className="h-[42px] font-semibold" onClick={() => setIsCalendarOpen(true)}>
                <CalendarIcon className="w-4 h-4 mr-2 text-muted" /> Block Calendar
              </Button>

              <div className="h-6 w-px bg-border mx-1"></div>

              {/* SIGN OUT */}
              <button
                onClick={logout}
                className="text-theme-caption font-semibold text-muted hover:text-foreground h-[42px] px-4 rounded-xl bg-background border border-border hover:bg-surface transition-colors whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden h-[42px] px-4 flex items-center justify-center gap-2.5 rounded-xl bg-primary text-primary-text shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all border border-white/10"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] pt-0.5">Menu</span>
            </button>

            {isClientSelectorOpen && (
                <ClientSelector 
                    clients={clients} 
                    onSelect={handleClientPortalAccess} 
                    onClose={() => setIsClientSelectorOpen(false)} 
                />
            )}
            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />

            {/* THEME TOGGLE (Always Visible) */}
            <button 
              onClick={cycleTheme}
              title={`Theme: ${theme}`}
              className="h-[42px] aspect-square text-muted hover:text-primary dark:hover:text-warning transition-colors flex items-center justify-center rounded-full bg-background border border-border hover:bg-surface"
            >
              <ThemeIcon theme={theme} />
            </button>
          </div>
        </div>
      </header>

      <NotificationToast />

      <main className="max-w-[1440px] mx-auto p-4 md:p-8">
        {/* ADMIN NAVIGATION (Desktop Only) */}
        <div className="hidden lg:flex flex-wrap items-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {navItems.map((tab) => {
             const isActive = pathname === tab.href;
             return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-theme-subtitle transition-all border-2 font-semibold
                    ${isActive
                    ? 'bg-primary text-primary-text border-primary shadow-xl shadow-primary/20 hover:opacity-90'
                    : 'bg-surface text-muted hover:bg-primary/5 hover:text-primary hover:border-primary/10 border-transparent'}
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

      {/* MOBILE NAVIGATION DRAWER */}
      <MobileNav 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        navItems={navItems}
        actions={[
            { label: 'Client Portal', icon: ExternalLink, onClick: () => setIsClientSelectorOpen(true) },
            { label: 'Contact Business', icon: Phone, onClick: () => setIsContactOpen(true) },
            { label: 'Block Calendar', icon: CalendarIcon, onClick: () => setIsCalendarOpen(true) },
        ]}
        footer={
            <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-error/10 text-error font-bold text-sm hover:bg-error/20 transition-all"
            >
                <Icons.LogOut className="w-4 h-4" />
                Sign Out
            </button>
        }
      />
    </div>
  );
}
