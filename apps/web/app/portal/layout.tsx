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
  const { cart, portalFormData, submitOrder, showNotification, logout, user, inventory, theme, setTheme } = useAppStore();
  const [showInvoice, setShowInvoice] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { Package, ClipboardList, User, ShoppingCart, LogOut, MapPin, Phone, Sun, Moon, Laptop } = Icons;

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

  // Determine if checkout is allowed (dates selected + items in cart)
  const canCheckout = portalFormData.start && portalFormData.end && cart.length > 0;

  const isCatalogPage = pathname === '/portal/inventory';
  const hasItems = cart.length > 0;
  const buttonLabel = (isCatalogPage && hasItems) ? 'Review Order' : 'Start Order';

  const handleAction = () => {
    if (buttonLabel === 'Start Order') {
        if (!isCatalogPage) {
            router.push('/portal/inventory');
            // Small timeout to ensure navigation starts before toast appears
            setTimeout(() => {
                showNotification("Select items to begin your order", "info");
            }, 100);
        } else {
            showNotification("Select items from the catalog below", "info");
        }
        return;
    }

    if (!user) {
        router.push('/login');
        return;
    }

    if (canCheckout) {
      setShowInvoice(true);
    } else {
      const missing: string[] = [];
      if (!portalFormData.start) missing.push("start date");
      if (!portalFormData.end) missing.push("end date");
      showNotification(`Please provide: ${missing.join(', ')}`, 'error');
    }
  };

  const handleConfirmOrder = async () => {
    await submitOrder(portalFormData);
    setShowInvoice(false);
    showNotification("Order placed successfully!", "success");
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
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-indigo-100 pb-24">
      <NotificationToast />
      
      {/* HEADER */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
             <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-bold shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform dark:shadow-none">
              CH
            </div>
            <div className="block max-w-[100px] xs:max-w-[120px] sm:max-w-none overflow-hidden">
              <span className="font-bold text-base sm:text-lg tracking-tight block leading-none truncate">CaroHans</span>
              <span className="text-[8px] sm:text-[10px] text-muted font-bold uppercase tracking-wider block truncate">Client Portal</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
             <button 
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-theme-caption font-bold tracking-wide uppercase hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-border/50"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="pt-px">Contact</span>
            </button>
            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

            <div className="h-6 w-px bg-border mx-1"></div>

            {user ? (
                <button
                    onClick={logout}
                    className="text-theme-caption font-bold text-muted hover:text-foreground h-[42px] px-4 rounded-xl bg-background border border-border hover:bg-surface transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4"/>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
            ) : (
                <button
                    onClick={() => router.push('/login')}
                    className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 h-[42px] px-4 rounded-xl transition-colors"
                >
                  Sign In
                </button>
            )}

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

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* CLIENT NAV & CHECKOUT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-2xl shadow-sm border border-border sticky top-20 z-30">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {navItems.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl text-theme-subtitle transition-all whitespace-nowrap border-2
                        ${isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-white dark:border-slate-900 shadow-md dark:shadow-none'
                      : 'bg-background text-muted hover:bg-surface border-transparent hover:border-border'}
                      `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleAction}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-theme-subtitle transition-all shadow-lg border-2
              bg-slate-900 text-white border-slate-900 hover:bg-slate-800
              dark:bg-white dark:text-slate-900 dark:border-white dark:hover:bg-slate-100
              shadow-indigo-500/10 dark:shadow-none
            `}
          >
            <ShoppingCart className="w-4 h-4" />
            {buttonLabel}
            {hasItems && (
              <span className="bg-white/20 dark:bg-slate-900/10 px-2 py-0.5 rounded-full text-[10px] leading-none">
                {cart.length}
              </span>
            )}
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
