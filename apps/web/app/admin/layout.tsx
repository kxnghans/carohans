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
  const { logout } = useAppStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const {
    LayoutDashboard,
    Users,
    TrendingUp,
    Plus,
    Calendar: CalendarIcon,
    MapPin,
    Phone
  } = Icons;

  const navItems = [
    { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/inventory', label: 'Inventory', icon: Plus },
    { href: '/admin/bi', label: 'Insights', icon: TrendingUp },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/users', label: 'Access', icon: Icons.Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 pb-24">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-slate-200">
              CH
            </div>
            <div className="block max-w-[100px] xs:max-w-[120px] sm:max-w-none overflow-hidden">
              <span className="font-bold text-base sm:text-lg tracking-tight block leading-none truncate">CaroHans</span>
              <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider block truncate">Ventures</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wide uppercase hover:bg-slate-200 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span className="pt-px">Contact</span>
            </button>
            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
            <Button variant="secondary" size="sm" onClick={() => setIsCalendarOpen(true)}>
              <CalendarIcon className="w-4 h-4 mr-2 text-slate-600" /> Block Calendar
            </Button>
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={logout}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
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
                    flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all
                    ${isActive
                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}
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
