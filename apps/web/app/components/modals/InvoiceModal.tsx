"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate, getDurationDays } from '../../utils/helpers';
import { useAppStore } from '../../context/AppContext';

export const InvoiceModal = ({ isOpen, onClose, cart, client, onConfirm, total, startDate, endDate, penaltyAmount = 0, latePenaltyPerDay = 50, status }: any) => {
  const { Printer, X, Check, FileText, AlertCircle } = Icons;
  const { businessSettings } = useAppStore();
  const [invoiceId, setInvoiceId] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setInvoiceId(Math.floor(Math.random() * 10000));
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const duration = getDurationDays(startDate, endDate);
  /* ... rest of logic ... */
  const calculatedSubtotal = cart.reduce((sum: number, item: any) => sum + (item.price * item.qty * duration), 0);
  
  // Calculate specific Loss & Damage total from items
  const lossDamageTotal = cart.reduce((sum: number, item: any) => {
    return sum + (((item.lostQty ?? 0) + (item.damagedQty ?? 0)) * (item.replacementCost ?? 0));
  }, 0);

  // Late fees are the remainder of the penaltyAmount
  const lateFees = Math.max(0, penaltyAmount - lossDamageTotal);
  const calculatedTotal = calculatedSubtotal + lateFees + lossDamageTotal;

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
        className="invoice-modal-content bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ... existing content ... */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-center flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg"><Printer className="w-5 h-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Review Invoice</h2>
              <p className="text-slate-400 text-sm">Draft Order for {client?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar print:p-0 print:m-0 print:overflow-visible print:h-auto print:block">
          <div id="printable-invoice" className="bg-white print:m-0 print:p-0">
            <div className="print:m-0 print:p-0">
              <div className="hidden print:flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div>
                  <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">{businessSettings.business_name}</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Event Rental Management System</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-medium max-w-[200px]">
                  <p>{businessSettings.business_location}</p>
                  <p>{businessSettings.business_phone}</p>
                  <p>{businessSettings.business_email}</p>
                </div>
              </div>

              <div className="flex justify-between mb-8 border-b border-slate-100 pb-8">
                <div>
                  <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2">Bill To</h3>
                  <p className="font-bold text-lg text-slate-900">{client?.name}</p>
                  <p className="text-slate-500 text-sm">{client?.email}</p>
                  <p className="text-slate-500 text-sm">{client?.phone}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2">Invoice Details</h3>
                  <p className="font-bold text-slate-900">INV-#{invoiceId}</p>
                  <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-tighter">Date: {formatDate(new Date().toISOString())}</p>
                  <p className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded inline-block mt-2 print:border print:border-emerald-200">Draft Invoice</p>
                </div>
              </div>

              <table className="w-full text-left mb-8">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest">Description</th>
                    <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Quantity</th>
                    <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Unit Price</th>
                    <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((item: any) => (
                    <tr key={item.id} className="break-inside-avoid">
                      <td className="py-4">
                        <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{item.category}</p>
                      </td>
                      <td className="py-4 text-center font-bold text-slate-700 text-sm">{item.qty}</td>
                      <td className="py-4 text-right text-slate-600 text-sm">{formatCurrency(item.price)}</td>
                      <td className="py-4 text-right font-black text-slate-900 text-sm">
                        <span className="text-[9px] text-slate-400 font-bold block">{duration} {duration === 1 ? 'day' : 'days'} @ {formatCurrency(item.price)}</span>
                        {formatCurrency(item.price * item.qty * duration)}
                      </td>
                    </tr>
                  ))}
                  {lateFees > 0 && (
                    <tr className="bg-rose-50/30 break-inside-avoid">
                      <td className="py-4" colSpan={3}>
                        <p className="font-bold text-rose-700 text-sm">Late Fees</p>
                        <p className="text-[10px] text-rose-400 uppercase font-bold tracking-tight">Daily penalty for overdue return</p>
                      </td>
                      <td className="py-4 text-right font-black text-rose-700 text-sm">{formatCurrency(lateFees)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Loss & Damage Section */}
              {lossDamageTotal > 0 && (
                <div className="break-inside-avoid mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <h3 className="font-black text-rose-600 text-[10px] uppercase tracking-[0.2em]">
                      Loss & Damage Audit
                    </h3>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-rose-100">
                        <th className="py-3 text-[10px] font-black text-rose-900 uppercase tracking-widest">Description</th>
                        <th className="py-3 text-[10px] font-black text-rose-900 uppercase tracking-widest text-center">Quantity</th>
                        <th className="py-3 text-[10px] font-black text-rose-900 uppercase tracking-widest text-right">Replacement Costs</th>
                        <th className="py-3 text-[10px] font-black text-rose-900 uppercase tracking-widest text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50">
                      {cart.map((item: any) => {
                        const items = [];
                        if ((item.lostQty ?? 0) > 0) items.push({ type: 'Lost', qty: item.lostQty });
                        if ((item.damagedQty ?? 0) > 0) items.push({ type: 'Damaged', qty: item.damagedQty });
                        
                        return items.map((audit, idx) => (
                          <tr key={`audit-${item.id}-${idx}`}>
                            <td className="py-3">
                              <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                              <p className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">{audit.type}</p>
                            </td>
                            <td className="py-3 text-center font-bold text-slate-700 text-xs">{audit.qty}</td>
                            <td className="py-3 text-right text-slate-600 text-xs">{formatCurrency(item.replacementCost)}</td>
                            <td className="py-3 text-right font-black text-rose-700 text-xs">{formatCurrency(audit.qty * (item.replacementCost || 0))}</td>
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
                <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 print:bg-white print:border-slate-200">
                  <div className="flex items-center gap-2 text-slate-900">
                    <AlertCircle className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase tracking-tight">Rental Terms & Conditions</h4>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5"></div>
                      <p className="text-[10px] font-medium text-slate-600 leading-relaxed">
                        <span className="font-black text-slate-900">Late Penalty:</span> A daily fee of <span className="text-rose-600 font-black">{formatCurrency(latePenaltyPerDay)}</span> applies for every day items are returned after the scheduled date.
                      </p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5"></div>
                      <p className="text-[10px] font-medium text-slate-600 leading-relaxed">
                        <span className="font-black text-slate-900">Damage & Loss:</span> Any damaged or lost items will be charged at <span className="font-black text-slate-900">100% of the replacement cost</span> specified in the catalog.
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="w-full md:w-1/2 space-y-3">
                  <div className="flex justify-between text-slate-500 text-xs font-medium">
                    <span>Rental Subtotal</span>
                    <span>{formatCurrency(calculatedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs font-medium">
                    <span>Tax (0%)</span>
                    <span>¢0.00</span>
                  </div>
                  {lateFees > 0 && (
                    <div className="flex justify-between text-rose-600 text-xs font-medium">
                      <span>Late Fees</span>
                      <span>+{formatCurrency(lateFees)}</span>
                    </div>
                  )}
                  {lossDamageTotal > 0 && (
                    <div className="flex justify-between text-rose-600 text-xs font-medium">
                      <span>Loss & Damage Penalty</span>
                      <span>+{formatCurrency(lossDamageTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-4 border-t-2 border-slate-900">
                    <span>Grand Total</span>
                    <span>{formatCurrency(calculatedTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Thank you note */}
              <div className="hidden print:block border-t border-slate-100 pt-8 text-center">
                <p className="text-sm font-bold text-slate-900 mb-1">Thank you for choosing CaroHans Ventures.</p>
                <p className="text-[10px] text-slate-400 font-medium">This is a system generated document. No signature required.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0 print:hidden">
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
