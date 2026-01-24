"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../lib/icons';
import { useAppStore } from '../context/AppContext';
import { InvoiceModal } from '../components/modals/InvoiceModal';
import { NotificationToast } from '../components/common/NotificationToast';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, portalFormData, submitOrder, showNotification } = useAppStore();
  const [showInvoice, setShowInvoice] = useState(false);
  const { Package, ClipboardList, User, ShoppingCart, LogOut } = Icons;

  // Determine if checkout is allowed (dates selected + items in cart)
  const canCheckout = portalFormData.start && portalFormData.end && cart.length > 0;

  const handleReviewOrder = () => {
    if (canCheckout) {
      setShowInvoice(true);
    } else {
      const missing = [];
      if (!portalFormData.start) missing.push("start date");
      if (!portalFormData.end) missing.push("end date");
      if (cart.length === 0) missing.push("items in cart");
      
      showNotification(`Please provide: ${missing.join(', ')}`, 'error');
    }
  };

  const navItems = [
    { href: '/portal/inventory', label: 'Catalog', icon: Package },
    { href: '/portal/orders', label: 'My Orders', icon: ClipboardList },
    { href: '/portal/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 pb-24">
      <NotificationToast />
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
              CH
            </div>
            <div className="hidden md:block">
              <span className="font-bold text-lg tracking-tight block leading-none">CaroHans</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Client Portal</span>
            </div>
          </div>
          
          <button
              onClick={() => router.push('/')}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
             <LogOut className="w-4 h-4"/>
             <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* CLIENT NAV & CHECKOUT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-20 z-30">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {navItems.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                        ${isActive
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}
                      `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleReviewOrder}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
          >
            <ShoppingCart className="w-4 h-4" />
            Review Order
            {cart.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{cart.length}</span>}
          </button>
        </div>

        {/* PAGE CONTENT */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            {children}
        </div>
      </main>

      {/* CHECKOUT MODAL */}
      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        cart={cart}
        customer={{ name: portalFormData.name, email: portalFormData.email, phone: portalFormData.phone }}
        total={cart.reduce((sum: number, i: any) => sum + (i.price * i.qty * 2), 0)}
        onConfirm={() => {
          submitOrder(portalFormData);
          setShowInvoice(false);
          router.push('/portal/orders');
        }}
      />
    </div>
  );
}
