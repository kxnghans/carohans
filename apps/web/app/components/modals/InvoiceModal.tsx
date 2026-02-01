"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate, getDurationDays, calculateOrderTotal } from '../../utils/helpers';
import { useData } from '../../context/DataContext';
import { InventoryItem, Client } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';
import { validateDiscount } from '../../services/discountService';
import { useAppStore } from '../../context/AppContext';
import { encodeOrderId } from '../../utils/idHandler';

export interface DiscountInfo {
  code: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: (InventoryItem & { qty: number, lostQty?: number, damagedQty?: number })[];
  client: Partial<Client> | null;
  onConfirm?: (discount?: DiscountInfo) => void;
  startDate: string;
  endDate: string;
  penaltyAmount?: number;
  latePenaltyPerDay?: number;
  status?: string;
  closedAt?: string;
  amountPaid?: number;
  totalAmount?: number;
  discountName?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  orderId?: number;
  publicId?: string;
  isEditable?: boolean;
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
  discountValue,
  orderId,
  publicId,
  isEditable
}: InvoiceModalProps) => {
  const { Printer, X, Check, AlertCircle, Sparkles } = Icons;
  const { businessSettings } = useData();
  const { user, portalFormData, setPortalFormData, showNotification } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [localDiscountCode, setLocalDiscountCode] = useState(portalFormData?.discountCode || '');
  const [localDiscountData, setLocalDiscountData] = useState<{ name: string, type: 'fixed' | 'percentage', value: number } | null>(null);
  const [discountMessage, setDiscountMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useScrollLock(isOpen);

  // Sync local code with portal form data
  useEffect(() => {
    if (portalFormData?.discountCode !== localDiscountCode) {
       setLocalDiscountCode(portalFormData?.discountCode || '');
    }
  }, [portalFormData?.discountCode]);

  // Discount Validation Logic
  useEffect(() => {
      const code = localDiscountCode;
      if (!code || code.length < 3) {
          setDiscountMessage(null);
          return;
      }
      
      // Only validate if editable (no status or pending)
      // If isEditable is explicitly true, we skip the status check here or assume it's valid to validate
      if (!isEditable && status && status !== 'Pending') return;

      setIsValidating(true);
      const timer = setTimeout(async () => {
          try {
              const clientId = (user as { clientId?: number } | null)?.clientId;
              const { isValid, message, discount } = await validateDiscount(code, clientId);
              
              if (!isValid) {
                  setDiscountMessage({ text: message || "Invalid code", type: 'error' });
                  setLocalDiscountData(null);
              } else {
                  setDiscountMessage({ text: "Discount applied!", type: 'success' });
                  // Store in local state, DO NOT update portalFormData yet
                  if (discount) {
                    setLocalDiscountData({ 
                        name: discount.name,
                        type: discount.discount_type as 'fixed' | 'percentage',
                        value: discount.discount_value
                    });
                  }
              }
          } catch (error) {
              console.error("Discount validation failed", error);
              setDiscountMessage({ text: "Validation error", type: 'error' });
              setLocalDiscountData(null);
          } finally {
              setIsValidating(false);
          }
      }, 800);

      return () => clearTimeout(timer);
  }, [localDiscountCode, user, status, isEditable]);

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
    }, 0);
    return () => {
        clearTimeout(timer);
    };
  }, [isOpen]);

  const duration = getDurationDays(startDate, endDate);
  const rentalItems = cart.map(i => ({ price: i.price, qty: i.qty }));
  const calculatedSubtotal = calculateOrderTotal(rentalItems, startDate, endDate);
  
  // Calculate specific Loss & Damage total from items
  const lossDamageTotal = cart.reduce((sum: number, item: InventoryItem & { lostQty?: number, damagedQty?: number }) => {
    return sum + (((item.lostQty ?? 0) + (item.damagedQty ?? 0)) * (item.replacementCost ?? 0));
  }, 0);

  // Late fees are the remainder of the penaltyAmount
  const lateFees = Math.max(0, penaltyAmount - lossDamageTotal);
  
  // Use standardized helper for Grand Total
  const isDraft = isEditable ?? !orderId; // If explicitly editable OR no ID, treat as draft (use local state)
  
  // Priority for live preview: Local Modal State -> Portal Form Data -> Props
  const isLocalActive = isDraft && localDiscountData && localDiscountCode.length >= 3;
  
  const activeDiscountType = isLocalActive ? localDiscountData?.type : 
                             (isDraft && portalFormData?.discountType ? portalFormData.discountType : discountType);
  const activeDiscountValue = isLocalActive ? localDiscountData?.value : 
                              (isDraft && portalFormData?.discountValue !== undefined ? portalFormData.discountValue : discountValue);
  const activeDiscountName = isLocalActive ? localDiscountData?.name : 
                             (isDraft && portalFormData?.discountName ? portalFormData.discountName : discountName);

  const calculatedTotal = calculateOrderTotal(
    rentalItems, 
    startDate, 
    endDate, 
    (activeDiscountType as 'fixed' | 'percentage') || undefined, 
    activeDiscountValue || undefined, 
    penaltyAmount
  );

  const finalTotal = totalAmountProp !== undefined && !isDraft ? totalAmountProp : calculatedTotal;
  const isFullyPaid = amountPaid >= finalTotal;

  // Actual discount amount for display - CAPPED at subtotal
  let discountDisplayAmount = 0;
  if (activeDiscountType && activeDiscountValue) {
    if (activeDiscountType === 'fixed') {
        discountDisplayAmount = Math.min(calculatedSubtotal, activeDiscountValue);
    } else {
        discountDisplayAmount = (calculatedSubtotal * activeDiscountValue) / 100;
    }
  }

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleConfirmClick = () => {
    if (isDraft && localDiscountData && localDiscountCode) {
        onConfirm?.({
            code: localDiscountCode,
            ...localDiscountData
        });
    } else {
        onConfirm?.();
    }
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
                  
                  {/* DISCOUNT INPUT - Editable for Drafts ONLY */}
                  {isDraft && (
                      <div className="mt-4 print:hidden">
                          <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1">Discount Code</label>
                          <div className="relative max-w-[200px]">
                              <input 
                                  type="text" 
                                  value={localDiscountCode}
                                  onChange={(e) => setLocalDiscountCode(e.target.value)}
                                  placeholder="ENTER CODE"
                                  className={`w-full bg-background border rounded-lg px-3 py-1.5 text-xs font-mono uppercase outline-none focus:ring-2 transition-all ${
                                      discountMessage?.type === 'error' ? 'border-error focus:ring-error/20 text-error' : 
                                      discountMessage?.type === 'success' ? 'border-success focus:ring-success/20 text-success' : 'border-border focus:ring-primary/20'
                                  }`}
                              />
                              {isValidating && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                      <Icons.Loader2 className="w-3 h-3 text-primary animate-spin" />
                                  </div>
                              )}
                              {discountMessage && !isValidating && (
                                  <div className={`absolute left-0 -bottom-5 text-[9px] font-bold uppercase tracking-tight ${discountMessage.type === 'error' ? 'text-error' : 'text-success'}`}>
                                      {discountMessage.text}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
                </div>                <div className="text-right">
                  <h3 className="font-semibold text-muted text-theme-caption uppercase tracking-wider mb-2">Order Details</h3>
                  <p className="text-theme-body-bold text-foreground">{publicId || (orderId ? encodeOrderId(orderId) : 'New Order')}</p>
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
                  {cart.map((item: InventoryItem & { qty: number, lostQty?: number, damagedQty?: number, _fallback?: Partial<InventoryItem> }) => (
                    <tr key={item.id} className="break-inside-avoid">
                      <td className="py-4">
                        <p className="text-theme-body-bold text-foreground">{item.name || item._fallback?.name || 'Unknown Item'}</p>
                        <p className="text-theme-caption text-muted uppercase font-bold tracking-tight">{item.category || item._fallback?.category || 'General'}</p>
                      </td>
                      <td className="py-4 text-center font-bold text-muted text-theme-body">{item.qty}</td>
                      <td className="py-4 text-right text-muted text-theme-body">{formatCurrency(item.price)}</td>
                      <td className="py-4 text-right text-theme-body-bold text-foreground">
                        <span className="text-theme-caption text-muted font-bold block">{duration} {duration === 1 ? 'day' : 'days'} @ {formatCurrency(item.price)}</span>
                        {formatCurrency(item.price * item.qty * duration)}
                      </td>
                    </tr>
                  ))}
                  {discountDisplayAmount > 0 && (
                    <tr className="break-inside-avoid">
                      <td className="py-4" colSpan={3}>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-secondary" />
                            <p className="font-bold text-secondary dark:text-indigo-400 text-theme-body">Discount: {activeDiscountName}</p>
                        </div>
                        <p className="text-theme-caption text-secondary/60 uppercase font-bold tracking-tight">
                          {activeDiscountType === 'percentage' ? `${activeDiscountValue}% off subtotal` : 
                           (activeDiscountValue || 0) > calculatedSubtotal ? `Fixed reduction (Capped at subtotal)` : 'Fixed monetary reduction'}
                        </p>
                      </td>
                      <td className="py-4 text-right font-black text-secondary dark:text-indigo-400 text-theme-body">-{formatCurrency(discountDisplayAmount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Late Fees Section */}
              {lateFees > 0 && (
                <div className="break-inside-avoid mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                    <h3 className="font-bold text-error text-theme-caption uppercase tracking-[0.2em]">
                      Late Fees Audit
                    </h3>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-rose-100">
                        <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest">Description</th>
                        <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-center">Days Overdue</th>
                        <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-right">Daily Rate</th>
                        <th className="py-3 text-theme-caption font-bold text-foreground uppercase tracking-widest text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50 dark:divide-rose-900/30">
                      <tr>
                        <td className="py-4">
                          <p className="text-theme-body-bold text-foreground">Late Return Fees</p>
                          <p className="text-theme-caption text-muted uppercase font-bold tracking-tight">Schedule Variance Penalty</p>
                        </td>
                        <td className="py-4 text-center font-bold text-muted text-theme-body">
                          {Math.round(lateFees / latePenaltyPerDay)}
                        </td>
                        <td className="py-4 text-right text-muted text-theme-body">
                          {formatCurrency(latePenaltyPerDay)}
                        </td>
                        <td className="py-4 text-right font-black text-rose-700 dark:text-rose-400 text-theme-body">
                          {formatCurrency(lateFees)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

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
                  {discountDisplayAmount > 0 && (
                    <div className="flex justify-between text-secondary dark:text-indigo-400 text-theme-body font-medium">
                      <span>Discount ({activeDiscountName})</span>
                      <span>-{formatCurrency(discountDisplayAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted text-theme-body font-medium">
                    <span>Tax (0%)</span>
                    <span>{formatCurrency(0)}</span>
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
                    <span>Total Order Amount</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                  {amountPaid > 0 && (
                     <div className="flex justify-between text-success text-theme-body font-medium">
                        <span>Amount Paid to Date</span>
                        <span>-{formatCurrency(amountPaid)}</span>
                     </div>
                  )}
                   <div className="flex justify-between text-theme-subtitle font-black pt-2 border-t border-border mt-2">
                      <span className="uppercase tracking-tight text-foreground">Balance Remaining</span>
                      <span className={`${Math.max(0, finalTotal - amountPaid) > 0 ? 'text-error' : 'text-success'}`}>
                         {formatCurrency(Math.max(0, finalTotal - amountPaid))}
                      </span>
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
            <Button onClick={handleConfirmClick} variant="success">
              {orderId && isEditable ? (
                <><Check className="w-4 h-4 mr-2" /> Confirm & Update Order</>
              ) : (status === 'Pending' || !status) ? (
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