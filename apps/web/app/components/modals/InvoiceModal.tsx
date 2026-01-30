"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate, getDurationDays } from '../../utils/helpers';
import { useData } from '../../context/DataContext';
import { InventoryItem, Client } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: (InventoryItem & { qty: number, lostQty?: number, damagedQty?: number })[];
  client: Partial<Client> | null;
  onConfirm?: () => void;
  startDate: string;
  endDate: string;
  penaltyAmount?: number;
  latePenaltyPerDay?: number;
  status?: string;
  closedAt?: string;
  amountPaid?: number;
  totalAmount?: number;
  discountName?: string;
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
}

export const InvoiceModal = ({
  isOpen,
  onClose,
  cart,
  client,
  onConfirm,
  startDate,
  endDate,
  penaltyAmount = 0,
  latePenaltyPerDay = 50,
  status,
  closedAt,
  amountPaid = 0,
  totalAmount: totalAmountProp,
  discountName,
  discountType,
  discountValue
}: InvoiceModalProps) => {
  const { Printer, X, Check, AlertCircle, Sparkles } = Icons;
  const { businessSettings } = useData();
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
        setMounted(true);
        if (isOpen) {
            setInvoiceId(Math.floor(Math.random() * 10000));
        }
    }, 0);
    return () => {
        clearTimeout(timer);
    };
  }, [isOpen]);

  const duration = getDurationDays(startDate, endDate);
  const calculatedSubtotal = cart.reduce((sum: number, item: InventoryItem & { qty: number }) => sum + (item.price * item.qty * duration), 0);
  
  // Discount Calculation
  let discountAmount = 0;
  if (discountType && discountValue) {
    if (discountType === 'fixed') {
        discountAmount = discountValue;
    } else {
        discountAmount = (calculatedSubtotal * discountValue) / 100;
    }
  }

  // Calculate specific Loss & Damage total from items
  const lossDamageTotal = cart.reduce((sum: number, item: InventoryItem & { lostQty?: number, damagedQty?: number }) => {
    return sum + (((item.lostQty ?? 0) + (item.damagedQty ?? 0)) * (item.replacementCost ?? 0));
  }, 0);

  // Late fees are the remainder of the penaltyAmount
  const lateFees = Math.max(0, penaltyAmount - lossDamageTotal);
  const calculatedTotal = calculatedSubtotal - discountAmount + lateFees + lossDamageTotal;
  const finalTotal = totalAmountProp !== undefined ? totalAmountProp : Math.max(0, calculatedTotal);
  const isFullyPaid = amountPaid >= finalTotal;

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 50);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="invoice-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="invoice-modal-content bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary dark:bg-primary-text text-primary-text dark:text-primary p-6 flex justify-between items-center flex-shrink-0 border-b border-transparent dark:border-white/10 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg text-primary-text dark:text-primary"><Printer className="w-5 h-5" /></div>
            <div>
              <h2 className="text-theme-title font-bold tracking-tight">Review Invoice</h2>
              <p className="opacity-70 text-theme-caption font-medium">Draft Order for {client?.firstName && client?.lastName ? `${client.firstName} ${client.lastName}` : (client as unknown as { name?: string })?.name || ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-primary-text dark:text-primary"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar print:p-0 print:m-0 print:overflow-visible print:h-auto print:block bg-surface">
          <div id="printable-invoice" className="bg-surface print:m-0 print:p-0">
            <div className="print:m-0 print:p-0">
              <div className="hidden print:flex justify-between items-start border-b-2 border-foreground pb-6 mb-8">
                <div>
                  <h1 className="text-theme-header font-bold tracking-tight text-foreground uppercase">{businessSettings.business_name}</h1>
                  <p className="text-theme-caption font-semibold text-muted uppercase tracking-widest mt-1">Event Rental Management System</p>
                </div>
                <div className="text-right text-theme-caption text-muted font-medium max-w-[200px]">
                  <p>{businessSettings.business_location}</p>
                  <p>{businessSettings.business_phone}</p>
                  <p>{businessSettings.business_email}</p>
                </div>
              </div>

              <div className="flex justify-between mb-8 border-b border-border pb-8">
                <div>
                  <h3 className="font-semibold text-muted text-theme-caption uppercase tracking-wider mb-2">Bill To</h3>
                  <p className="text-theme-title text-foreground">{client?.firstName && client?.lastName ? `${client.firstName} ${client.lastName}` : (client as unknown as { name?: string })?.name || ''}</p>
                  <p className="text-muted text-theme-body">{client?.email}</p>
                  <p className="text-muted text-theme-body">{client?.phone}</p>
                </div>                <div className="text-right">
                  <h3 className="font-semibold text-muted text-theme-caption uppercase tracking-wider mb-2">Invoice Details</h3>
                  <p className="text-theme-body-bold text-foreground">INV-#{invoiceId}</p>
                  <p className="text-muted text-theme-caption font-bold mt-1 uppercase tracking-tighter">Date: {formatDate(new Date().toISOString())}</p>
                  
                  <div className="mt-6 flex flex-wrap justify-end gap-6 text-[10px] uppercase font-bold text-muted tracking-widest">
                    <div className="flex flex-col">
                      <span>Pickup</span>
                      <span className="text-theme-body text-foreground font-semibold">{formatDate(startDate)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span>Planned Return</span>
                      <span className="text-theme-body text-foreground font-semibold">{formatDate(endDate)}</span>
                    </div>
                                      {closedAt && (
                                        <div className="flex flex-col">
                                          <span>Actual Return</span>
                                          <span className="text-theme-body text-secondary dark:text-status-active font-semibold">{formatDate(closedAt)}</span>
                                        </div>
                                      )}                  </div>

                  {(status === 'Completed' || (status === 'Settlement' && isFullyPaid)) ? (
                    <p className="text-white dark:text-success font-semibold text-theme-body bg-success dark:bg-success/10 px-3 py-1 rounded-full inline-block mt-4 print:border print:border-emerald-200 uppercase tracking-wide">Final Paid Receipt</p>
                  ) : (
                    <p className="text-white dark:text-success font-semibold text-theme-body bg-success dark:bg-success/10 px-3 py-1 rounded-full inline-block mt-4 print:border print:border-emerald-200 uppercase tracking-wide">Draft Invoice</p>
                  )}
                </div>
              </div>

              <table className="w-full text-left mb-8">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest">Description</th>
                    <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-center">Quantity</th>
                    <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-right">Unit Price</th>
                    <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cart.map((item: InventoryItem & { qty: number, lostQty?: number, damagedQty?: number }) => (
                    <tr key={item.id} className="break-inside-avoid">
                      <td className="py-4">
                        <p className="text-theme-body-bold text-foreground">{item.name}</p>
                        <p className="text-theme-caption text-muted uppercase font-bold tracking-tight">{item.category}</p>
                      </td>
                      <td className="py-4 text-center font-bold text-muted text-theme-body">{item.qty}</td>
                      <td className="py-4 text-right text-muted text-theme-body">{formatCurrency(item.price)}</td>
                      <td className="py-4 text-right text-theme-body-bold text-foreground">
                        <span className="text-theme-caption text-muted font-bold block">{duration} {duration === 1 ? 'day' : 'days'} @ {formatCurrency(item.price)}</span>
                        {formatCurrency(item.price * item.qty * duration)}
                      </td>
                    </tr>
                  ))}
                  {discountAmount > 0 && (
                    <tr className="bg-secondary/10 dark:bg-indigo-900/10 break-inside-avoid">
                      <td className="py-4" colSpan={3}>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-secondary" />
                            <p className="font-bold text-secondary dark:text-indigo-400 text-theme-body">Discount: {discountName}</p>
                        </div>
                        <p className="text-theme-caption text-secondary/60 uppercase font-bold tracking-tight">
                          {discountType === 'percentage' ? `${discountValue}% off subtotal` : 'Fixed monetary reduction'}
                        </p>
                      </td>
                      <td className="py-4 text-right font-black text-secondary dark:text-indigo-400 text-theme-body">-{formatCurrency(discountAmount)}</td>
                    </tr>
                  )}
                  {lateFees > 0 && (
                    <tr className="bg-error/10/30 dark:bg-rose-900/20 break-inside-avoid">
                      <td className="py-4" colSpan={3}>
                        <p className="font-bold text-rose-700 dark:text-rose-400 text-theme-body">Total Late Fees</p>
                        <p className="text-theme-caption text-rose-400 uppercase font-bold tracking-tight">
                          Overdue by {Math.round(lateFees / latePenaltyPerDay)} {Math.round(lateFees / latePenaltyPerDay) === 1 ? 'day' : 'days'}
                        </p>
                      </td>
                      <td className="py-4 text-right font-black text-rose-700 dark:text-rose-400 text-theme-body">{formatCurrency(lateFees)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Loss & Damage Section */}
              {lossDamageTotal > 0 && (
                <div className="break-inside-avoid mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                    <h3 className="font-bold text-error text-theme-caption uppercase tracking-[0.2em]">
                      Loss & Damage Audit
                    </h3>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-rose-100">
                        <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest">Description</th>
                        <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-center">Quantity</th>
                        <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-right">Replacement Costs</th>
                        <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50 dark:divide-rose-900/30">
                      {cart.map((item: InventoryItem & { qty: number, lostQty?: number, damagedQty?: number }) => {
                        const items: { type: string, qty: number }[] = [];
                        if ((item.lostQty ?? 0) > 0) items.push({ type: 'Lost', qty: item.lostQty ?? 0 });
                        if ((item.damagedQty ?? 0) > 0) items.push({ type: 'Damaged', qty: item.damagedQty ?? 0 });
                        
                        return items.map((audit, idx) => (
                          <tr key={`audit-${item.id}-${idx}`}>
                            <td className="py-3">
                              <p className="text-theme-body-bold text-foreground">{item.name}</p>
                              <p className="text-theme-caption font-black text-error uppercase tracking-tighter">{audit.type}</p>
                            </td>
                            <td className="py-3 text-center font-bold text-muted text-theme-body">{audit.qty}</td>
                            <td className="py-3 text-right text-muted text-theme-body">{formatCurrency(item.replacementCost)}</td>
                            <td className="py-3 text-right font-black text-rose-700 dark:text-rose-400 text-theme-body">{formatCurrency(audit.qty * (item.replacementCost || 0))}</td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PRINT ONLY FOOTER - Only shows on last page */}
            <div className="invoice-footer break-inside-avoid">
              <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                {/* Rental Terms Clarity */}
                <div className="flex-1 bg-background rounded-2xl p-4 border border-border space-y-3 print:bg-white print:border-border">
                  <div className="flex items-center gap-2 text-foreground">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <h4 className="text-theme-caption font-bold uppercase tracking-tight">Rental Terms & Conditions</h4>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted mt-1.5"></div>
                      <p className="text-theme-caption font-medium text-muted leading-relaxed">
                        <span className="font-bold text-foreground">Late Penalty Per Day:</span> A daily fee of <span className="text-error font-bold">{formatCurrency(latePenaltyPerDay)}</span> applies for every day items are kept after the <span className="font-bold">Planned Return Date</span>.
                      </p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted mt-1.5"></div>
                      <p className="text-theme-caption font-medium text-muted leading-relaxed">
                        <span className="font-bold text-foreground">Damage & Loss:</span> Any damaged or lost items will be charged at <span className="font-bold text-foreground">100% of the replacement cost</span> specified in the catalog.
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="w-full md:w-1/2 space-y-3">
                  <div className="flex justify-between text-muted text-theme-body font-medium">
                    <span>Rental Subtotal</span>
                    <span>{formatCurrency(calculatedSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-secondary dark:text-indigo-400 text-theme-body font-medium">
                      <span>Discount ({discountName})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted text-theme-body font-medium">
                    <span>Tax (0%)</span>
                    <span>¢0.00</span>
                  </div>
                  {lateFees > 0 && (
                    <div className="flex justify-between text-error dark:text-rose-400 text-theme-body font-medium">
                      <span>Total Late Fees</span>
                      <span>+{formatCurrency(lateFees)}</span>
                    </div>
                  )}
                  {lossDamageTotal > 0 && (
                    <div className="flex justify-between text-error dark:text-rose-400 text-theme-body font-medium">
                      <span>Loss & Damage Penalty</span>
                      <span>+{formatCurrency(lossDamageTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-theme-title font-bold text-foreground pt-4 border-t-2 border-foreground">
                    <span>Grand Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Thank you note */}
              <div className="hidden print:block border-t border-border pt-8 text-center">
                <p className="text-theme-body-bold text-foreground mb-1">Thank you for choosing CaroHans Ventures.</p>
                <p className="text-theme-caption text-muted font-medium">This is a system generated document. No signature required.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-background border-t border-border flex justify-end gap-3 flex-shrink-0 print:hidden">
          <Button variant="secondary" onClick={onClose}>Continue Editing</Button>
          <Button onClick={handlePrint} variant="secondary">
            <Printer className="w-4 h-4 mr-2" /> Print to PDF
          </Button>
          {onConfirm && (
            <Button onClick={onConfirm} variant="success">
              {status === 'Pending' || !status ? (
                <><Check className="w-4 h-4 mr-2" /> Confirm & Place Order</>
              ) : ['Completed', 'Settlement', 'Rejected', 'Canceled'].includes(status) ? (
                'Close Invoice'
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Save & Close</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
