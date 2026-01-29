"use client";

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../lib/icons';
import { useAppStore } from '../context/AppContext';
import { InventoryItem } from '../types';
import { InvoiceModal } from '../components/modals/InvoiceModal';
import { ContactModal } from '../components/modals/ContactModal';
import { NotificationToast } from '../components/common/NotificationToast';
import { ScrollableContainer } from '../components/common/ScrollableContainer';

const ThemeIcon = ({ theme }: { theme: 'light' | 'dark' | 'system' }) => {
  const { Sun, Moon, Laptop } = Icons;
  if (theme === 'light') return <Sun className="w-4 h-4" />;
  if (theme === 'dark') return <Moon className="w-4 h-4" />;
  return <Laptop className="w-4 h-4" />;
};

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, portalFormData, submitOrder, showNotification, logout, user, userRole, theme, setTheme } = useAppStore();
  const [showInvoice, setShowInvoice] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { Package, ClipboardList, User, ShoppingCart, LogOut, Phone, LayoutDashboard } = Icons;

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

    return (

      <div className="h-[100dvh] flex flex-col bg-background font-sans text-foreground selection:bg-indigo-100 overflow-hidden">

        <NotificationToast />

        

        {/* STICKY HEADER */}

        <header className="bg-surface/80 backdrop-blur-md border-b border-border z-40 shrink-0">

          <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 md:h-22 flex items-center justify-between">

            <Link href="/portal/inventory" className="flex items-center gap-4 group">

               <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 rounded-xl flex items-center justify-center text-primary-text dark:text-primary-text font-black shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform dark:shadow-none">

                CH

              </div>

              <div className="block max-w-[140px] xs:max-w-[160px] sm:max-w-none overflow-hidden">

                <span className="text-theme-title tracking-tight block leading-none truncate font-bold">CaroHans</span>

                <span className="text-[10px] text-muted font-semibold uppercase tracking-[0.2em] block truncate mt-1.5">Client Portal</span>

              </div>

            </Link>

            

            <div className="flex items-center gap-3">

               {userRole === 'admin' && (

                  <button 

                    onClick={() => router.push('/admin/overview')}

                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary dark:bg-primary/10 text-primary-text dark:text-primary border border-transparent dark:border-primary/20 hover:opacity-90 transition-all font-semibold text-theme-caption uppercase tracking-wide"

                  >

                    <LayoutDashboard className="w-3.5 h-3.5" />

                    <span className="pt-px hidden sm:inline">Admin Dashboard</span>

                  </button>

               )}

  

               <button 

                onClick={() => setIsContactOpen(true)}

                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 text-primary border border-primary/10 hover:bg-primary/10 transition-all font-semibold text-theme-caption uppercase tracking-wide"

              >

                <Phone className="w-3.5 h-3.5" />

                <span className="pt-px">Contact</span>

              </button>

              <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

  

              <div className="h-6 w-px bg-border mx-1"></div>

  

              {user ? (

                  <button

                      onClick={logout}

                      className="text-theme-caption font-semibold text-muted hover:text-foreground h-[42px] px-4 rounded-xl bg-background border border-border hover:bg-surface transition-colors flex items-center gap-2"

                  >

                    <LogOut className="w-4 h-4"/>

                    <span className="hidden sm:inline">Sign Out</span>

                  </button>

              ) : (

                  <button

                      onClick={() => router.push('/login')}

                      className="text-sm font-semibold text-primary dark:text-indigo-400 hover:text-indigo-700 bg-primary/10 dark:bg-indigo-900/30 hover:bg-indigo-100 h-[42px] px-4 rounded-xl transition-colors"

                  >

                    Sign In

                  </button>

              )}

  

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

        {/* SUB-HEADER NAVIGATION & ACTIONS */}
        <div className="bg-surface/60 backdrop-blur-md border-b border-border z-30">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <ScrollableContainer className="w-full sm:w-auto" innerClassName="pb-0">
              <div className="flex items-center gap-2 min-w-max">
                {navItems.map((tab) => {
                  const isActive = pathname === tab.href;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap border-2 font-semibold
                        ${isActive
                          ? 'bg-primary text-primary-text border-primary shadow-lg shadow-primary/20'
                          : 'bg-background/50 text-muted hover:bg-surface border-transparent hover:border-border'}
                      `}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            </ScrollableContainer>

            <button
              onClick={handleAction}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg border border-transparent
                bg-primary text-primary-text hover:opacity-90 active:scale-[0.98]
                shadow-primary/20 dark:shadow-none font-bold uppercase tracking-widest
              `}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{buttonLabel}</span>
              {hasItems && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* INDEPENDENTLY SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-6">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                  {children}
              </div>
          </div>
        </main>

        {/* CHECKOUT MODAL */}
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          cart={cart as (InventoryItem & { qty: number, lostQty?: number, damagedQty?: number })[]}
          client={{ firstName: `${portalFormData.firstName} ${portalFormData.lastName}`.trim(), email: portalFormData.email, phone: portalFormData.phone }}
          onConfirm={handleConfirmOrder}
          startDate={portalFormData.start}
          endDate={portalFormData.end}
        />
      </div>
    );
}
