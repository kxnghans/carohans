"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../lib/icons';
import { useAppStore } from '../context/AppContext';
import { InvoiceModal } from '../components/modals/InvoiceModal';
import { ContactModal } from '../components/modals/ContactModal';
import { NotificationToast } from '../components/common/NotificationToast';
import { calculateOrderTotal } from '../utils/helpers';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, portalFormData, submitOrder, showNotification, logout, user, inventory } = useAppStore();
  const [showInvoice, setShowInvoice] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { Package, ClipboardList, User, ShoppingCart, LogOut, MapPin, Phone } = Icons;

  // Determine if checkout is allowed (dates selected + items in cart)
  const canCheckout = portalFormData.start && portalFormData.end && cart.length > 0;

  const handleReviewOrder = () => {
    if (!user) {
        // Redirect to login if guest
        router.push('/login');
        return;
    }

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

  const handleConfirmOrder = async () => {
    await submitOrder(portalFormData);
    setShowInvoice(false);
  };

  const navItems = [
    { href: '/portal/inventory', label: 'Catalog', icon: Package },
    ...(user ? [
        { href: '/portal/orders', label: 'My Orders', icon: ClipboardList },
        { href: '/portal/profile', label: 'Profile', icon: User },
    ] : [])
  ];

  const totalAmount = calculateOrderTotal(
    cart.map(i => {
        const item = inventory.find(inv => inv.id === i.id);
        return { price: item?.price || 0, qty: i.qty };
    }),
    portalFormData.start,
    portalFormData.end
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 pb-24">
      <NotificationToast />
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
             <div className="w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
              CH
            </div>
            <div className="hidden md:block">
              <span className="font-bold text-lg tracking-tight block leading-none">CaroHans</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Client Portal</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wide uppercase hover:bg-slate-200 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span className="hidden sm:inline pt-px">Contact</span>
            </button>
            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

            {user ? (
                <button
                    onClick={logout}
                    className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4"/>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
            ) : (
                <button
                    onClick={() => router.push('/login')}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </button>
            )}
          </div>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-slate-800 text-white hover:bg-slate-700 shadow-slate-200"
          >
            <ShoppingCart className="w-4 h-4" />
            {user ? 'Review Order' : 'Login to Checkout'}
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
            client={{ name: `${portalFormData.firstName} ${portalFormData.lastName}`.trim(), email: portalFormData.email, phone: portalFormData.phone }}
            onConfirm={handleConfirmOrder}
            total={totalAmount}
            startDate={portalFormData.start}
            endDate={portalFormData.end}
          />
    </div>
  );
}
