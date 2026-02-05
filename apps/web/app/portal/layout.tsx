"use client";

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '../lib/icons';
import { useAppStore } from '../context/AppContext';
import { InventoryItem } from '../types';
import { InvoiceModal, DiscountInfo } from '../components/modals/InvoiceModal';
import { ContactModal } from '../components/modals/ContactModal';
import { NotificationToast } from '../components/common/NotificationToast';
import { ScrollableContainer } from '../components/common/ScrollableContainer';
import { MobileNav } from '../components/layout/MobileNav';
import { getUserFriendlyErrorMessage } from '../utils/errorMapping';

const ThemeIcon = ({ theme }: { theme: 'light' | 'dark' | 'system' }) => {
  const { Sun, Moon, Laptop } = Icons;
  const iconClass = "w-2.5 h-2.5 lg:w-4 lg:h-4";
  if (theme === 'light') return <Sun className={iconClass} />;
  if (theme === 'dark') return <Moon className={iconClass} />;
  return <Laptop className={iconClass} />;
};

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, portalFormData, submitOrder, showNotification, logout, user, userRole, theme, setTheme, modifyingOrderId, cancelModification } = useAppStore();
  const [showInvoice, setShowInvoice] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { Package, ClipboardList, User, ShoppingCart, LogOut, Phone, LayoutDashboard, X, Menu, Info } = Icons;

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  // Determine if checkout is allowed (dates selected + items in cart + valid range)
  const isDateRangeValid = portalFormData.start && portalFormData.end && new Date(portalFormData.end) >= new Date(portalFormData.start);
  const canCheckout = isDateRangeValid && cart.length > 0;

  const isCatalogPage = pathname === '/portal/inventory';
  const hasItems = cart.length > 0;
  const buttonLabel = (isCatalogPage && hasItems) ? 'Review Order' : 'New Order';

  const handleAction = () => {
    if (buttonLabel === 'New Order') {
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
      else if (!portalFormData.end) missing.push("end date");
      else if (new Date(portalFormData.end) < new Date(portalFormData.start)) {
          showNotification("Planned return date cannot be earlier than the pickup date.", "error");
          return;
      }
      
      if (missing.length > 0) {
          showNotification(`Please provide: ${missing.join(', ')}`, 'error');
      } else if (cart.length === 0) {
          showNotification("Your cart is empty.", "error");
      }
    }
  };

  const handleConfirmOrder = async (discountInfo?: DiscountInfo) => {
    try {
        const finalData = discountInfo ? { 
            ...portalFormData, 
            discountCode: discountInfo.code,
            discountName: discountInfo.name,
            discountType: discountInfo.type,
            discountValue: discountInfo.value
        } : portalFormData;

        await submitOrder(finalData, finalData.discountCode);
        setShowInvoice(false);
        showNotification(modifyingOrderId ? "Order updated successfully!" : "Order placed successfully!", "success");
    } catch (error) {
        console.error("Order submission failed:", error);
        showNotification(getUserFriendlyErrorMessage(error, "Order"), "error");
    }
  };

  const navItems = [
    { href: '/portal/inventory', label: 'Catalog', icon: Package },
    ...(user ? [
        { href: '/portal/orders', label: 'My Orders', icon: ClipboardList },
        { href: '/portal/profile', label: 'Profile', icon: User },
    ] : []),
  ];

    return (
      <div className="h-[100dvh] flex flex-col bg-background font-sans text-foreground selection:bg-indigo-100 overflow-hidden">
        <NotificationToast />

        {/* STICKY HEADER */}
        <header className="bg-surface/80 backdrop-blur-md border-b border-border z-40 shrink-0 sticky top-0">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-24 md:h-22 flex items-center justify-between">
            <Link href="/portal/inventory" className="flex items-center gap-4 group">
               <div className="flex-shrink-0 w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-primary-text text-theme-label font-bold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                CH
              </div>
              <div className="block max-w-[140px] xs:max-w-[160px] sm:max-w-none overflow-hidden">
                <span className="text-theme-title tracking-tight block leading-none truncate font-bold">CaroHans</span>
                <span className="text-[10px] text-muted font-semibold uppercase tracking-[0.2em] block truncate mt-1.5">New Portal</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
               <div className="hidden lg:flex items-center gap-3">
                  {userRole === 'admin' && (
                      <button 
                        onClick={() => router.push('/admin/overview')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 text-primary border border-primary/10 hover:bg-primary/10 transition-all font-semibold text-theme-body uppercase tracking-wide"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span className="pt-px">Admin Dashboard</span>
                      </button>
                  )}

                  <button 
                    onClick={() => setIsContactOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 text-primary border border-primary/10 hover:bg-primary/10 transition-all font-semibold text-theme-body uppercase tracking-wide"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="pt-px">Contact</span>
                  </button>

                  <div className="h-6 w-px bg-border mx-1"></div>

                  {user ? (
                      <button
                          onClick={logout}
                          className="text-theme-body font-semibold text-muted hover:text-foreground h-[42px] px-4 rounded-xl bg-background border border-border hover:bg-surface transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4"/>
                        <span>Sign Out</span>
                      </button>
                  ) : (
                      <button
                          onClick={() => router.push('/login')}
                          className="text-sm font-semibold text-primary dark:text-indigo-400 hover:text-indigo-700 bg-primary/10 dark:bg-indigo-900/30 hover:bg-indigo-100 h-[42px] px-4 rounded-xl transition-colors"
                      >
                        Sign In
                      </button>
                  )}
               </div>

               {/* Mobile Menu Toggle */}
               <button 
                 onClick={() => setIsMenuOpen(true)}
                 className="lg:hidden h-[46px] px-5 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-text shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all border border-white/10"
               >
                 <Menu className="w-5 h-5" />
                 <span className="text-[10px] font-bold uppercase tracking-widest pt-0.5">Menu</span>
               </button>

               <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />

               {/* THEME TOGGLE (Always Visible) */}
               <button 
                 onClick={cycleTheme}
                 title={`Theme: ${theme}`}
                 className="h-[46px] w-[46px] lg:h-[42px] lg:w-[42px] text-muted hover:text-primary dark:hover:text-warning transition-colors flex items-center justify-center rounded-full bg-background border border-border hover:bg-surface"
               >
                 <ThemeIcon theme={theme} />
               </button>
            </div>
          </div>
        </header>

        {/* SUB-HEADER NAVIGATION & ACTIONS */}
        <div className="bg-surface/60 backdrop-blur-md border-b border-border z-30 shrink-0">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <ScrollableContainer className="w-full md:w-auto" innerClassName="pb-0">
              <div className="flex items-center gap-2 min-w-max">
                {/* Navigation Items Styled Like Admin */}
                {navItems.map((tab) => {
                  const isActive = pathname === tab.href;
                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={`
                          flex items-center gap-2 px-5 py-2.5 rounded-xl text-theme-body transition-all border-2 font-semibold
                          ${isActive
                            ? 'bg-primary text-primary-text border-primary shadow-md shadow-primary/20 hover:opacity-90'
                            : 'bg-surface text-muted hover:bg-primary/5 hover:text-primary hover:border-primary/10 border-border/50'}
                        `}
                      >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </Link>
                  );
                })}

                <Link 
                  href="/portal/help"
                  className={`
                    flex items-center justify-center w-[46px] h-[46px] rounded-xl transition-all border-2 ml-2
                    ${pathname === '/portal/help'
                      ? 'bg-primary text-primary-text border-primary shadow-md'
                      : 'bg-surface text-muted hover:bg-primary/5 hover:text-primary hover:border-primary/10 border-border/50'}
                  `}
                  title="Help & Documentation"
                >
                  <Info className="w-5 h-5" />
                </Link>
              </div>
            </ScrollableContainer>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {modifyingOrderId && (
                  <button
                      onClick={() => cancelModification()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-theme-body transition-all whitespace-nowrap border-2 bg-error text-primary-text border-error hover:bg-error/90 font-semibold shadow-lg shadow-error/10"
                  >
                      <X className="w-4 h-4" /> Discard Changes
                  </button>
              )}
              <button
                onClick={handleAction}
                className={`
                  w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl text-theme-body transition-all shadow-lg border border-transparent
                  bg-primary text-primary-text hover:opacity-90 active:scale-[0.98]
                  shadow-primary/20 dark:shadow-none font-bold uppercase tracking-widest
                  ${(hasItems && !canCheckout) ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : ''}
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
        </div>

        {/* INDEPENDENTLY SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-6">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                  {children}
              </div>
          </div>
        </main>

        {/* MOBILE NAVIGATION DRAWER */}
        <MobileNav 
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          navItems={[...navItems, { href: '/portal/help', label: 'Help', icon: Info }]}
          actions={[
              { label: 'Contact Business', icon: Phone, onClick: () => setIsContactOpen(true) },
              ...(userRole === 'admin' ? [{ label: 'Admin Dashboard', icon: LayoutDashboard, onClick: () => router.push('/admin/overview') }] : []),
          ]}
          footer={
              user ? (
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-error/10 text-error font-bold text-sm hover:bg-error/20 transition-all"
                >
                    <Icons.LogOut className="w-4 h-4" />
                    Sign Out
                </button>
              ) : (
                <button
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-text font-bold text-sm hover:opacity-90 transition-all"
                >
                    Sign In
                </button>
              )
          }
        />

        {/* CHECKOUT MODAL */}
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          cart={cart as (InventoryItem & { qty: number, lostQty?: number, damagedQty?: number })[]}
          client={{ firstName: `${portalFormData.firstName} ${portalFormData.lastName}`.trim(), email: portalFormData.email, phone: portalFormData.phone }}
          onConfirm={handleConfirmOrder}
          startDate={portalFormData.start}
          endDate={portalFormData.end}
          orderId={modifyingOrderId || undefined}
          isEditable={true}
        />
      </div>
    );
}