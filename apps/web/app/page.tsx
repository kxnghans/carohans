"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icons } from './lib/icons';
import { ContactModal } from './components/modals/ContactModal';

export default function LandingPage() {
  const { User, Search, LayoutDashboard, Phone } = Icons;
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    // Add specific class for home page zoom settings
    document.documentElement.classList.add('home-page');
    return () => {
      document.documentElement.classList.remove('home-page');
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="max-w-4xl w-full z-10 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
          <button 
            onClick={() => setIsContactOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary dark:bg-slate-200 text-primary-text dark:text-primary-text text-theme-caption tracking-wide uppercase hover:bg-primary dark:hover:bg-white transition-colors shadow-sm"
          >
            <Phone className="w-3 h-3" />
            <span className="pt-px">Contact</span>
          </button>
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
            <h1 className="text-theme-hero text-foreground leading-tight mb-4">
              CaroHans <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 dark:from-blue-400 dark:to-blue-300">Ventures</span>
            </h1>

          <p className="text-muted text-theme-label max-w-sm leading-relaxed">
            Enterprise Resource Management System. Manage inventory, track rentals, and analyze growth.
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-md mx-auto">
          {/* CLIENT LOGIN */}
          <Link
            href="/login"
            className="p-6 bg-surface rounded-2xl border border-border shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden block dark:hover:border-primary/50"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <User className="w-24 h-24 text-foreground" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-text transition-colors">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-theme-title text-foreground">Client Login</h3>
                <p className="text-muted text-theme-body">Access your orders & profile</p>
              </div>
            </div>
          </Link>

          {/* GUEST BROWSE */}
          <Link
            href="/portal/inventory"
            className="p-6 bg-surface/80 backdrop-blur-sm rounded-2xl border border-border shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden block dark:hover:border-primary/50"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Search className="w-24 h-24 text-foreground" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-background text-muted rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-text transition-colors">
                <Search className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-theme-title text-foreground">Browse as Guest</h3>
                <p className="text-muted text-theme-body">Explore catalog without signing in</p>
              </div>
            </div>
          </Link>
          
          {/* ADMIN DASHBOARD */}
          <Link
            href="/admin/overview"
            className="p-6 bg-primary dark:bg-slate-200 border border-slate-800 dark:border-slate-300 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden block"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <LayoutDashboard className="w-24 h-24 text-primary-text dark:text-primary-text" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-primary dark:bg-slate-300 text-slate-300 dark:text-primary-text rounded-2xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-primary group-hover:text-foreground dark:group-hover:text-primary-text transition-colors">
                <LayoutDashboard className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-theme-title text-primary-text dark:text-primary-text">Admin Dashboard</h3>
                <p className="text-muted dark:text-slate-600 text-theme-body">Internal operations & Analytics</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
