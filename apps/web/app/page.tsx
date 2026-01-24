"use client";

import React from 'react';
import Link from 'next/link';
import { Icons } from './lib/icons';

export default function LandingPage() {
  const { ShoppingCart, LayoutDashboard } = Icons;
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Design */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-4xl w-full z-10 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide uppercase">
            v2.0 Beta
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-none">
            Rental <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Intelligence.</span>
          </h1>
          <p className="text-slate-500 text-xl max-w-md leading-relaxed">
            CaroHans Enterprise Resource Management System. Manage inventory, track rentals, and analyze growth.
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-md mx-auto">
          <Link
            href="/portal/inventory"
            className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden block"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShoppingCart className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Client Portal</h3>
                <p className="text-slate-500 text-sm">Browse catalog & Request items</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/admin/overview"
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden block"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <LayoutDashboard className="w-24 h-24 text-white" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Admin Dashboard</h3>
                <p className="text-slate-400 text-sm">Internal operations & Analytics</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
