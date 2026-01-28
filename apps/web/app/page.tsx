"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icons } from './lib/icons';
import { ContactModal } from './components/modals/ContactModal';

export default function LandingPage() {
  const { User, Search, LayoutDashboard, MapPin, Phone } = Icons;
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide uppercase hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Phone className="w-3 h-3" />
            <span className="pt-px">Contact</span>
          </button>
          <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
            <h1 className="text-4xl xs:text-5xl sm:text-6xl font-black text-slate-900 leading-tight mb-6">
              CaroHans <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Ventures</span>
            </h1>

          <p className="text-slate-500 text-xl max-w-md leading-relaxed">
            CaroHans Enterprise Resource Management System. Manage inventory, track rentals, and analyze growth.
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-md mx-auto">
          {/* CLIENT LOGIN */}
          <Link
            href="/login"
            className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden block"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <User className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Client Login</h3>
                <p className="text-slate-500 text-sm">Access your orders & profile</p>
              </div>
            </div>
          </Link>

          {/* GUEST BROWSE */}
          <Link
            href="/portal/inventory"
            className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden block"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Search className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Search className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Browse as Guest</h3>
                <p className="text-slate-500 text-sm">Explore catalog without signing in</p>
              </div>
            </div>
          </Link>
          
          {/* ADMIN DASHBOARD */}
          <Link
            href="/admin/overview"
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden block"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <LayoutDashboard className="w-24 h-24 text-white" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-slate-800 text-slate-300 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                <LayoutDashboard className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Admin Dashboard</h3>
                <p className="text-slate-400 text-sm">Internal operations & Analytics</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
