"use client";

import React from 'react';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/helpers';

export const InvoiceModal = ({ isOpen, onClose, cart, customer, onConfirm, total }: any) => {
  const { Printer, X, Check } = Icons;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg"><Printer className="w-5 h-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Review Invoice</h2>
              <p className="text-slate-400 text-sm">Draft Order for {customer?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-between mb-8 border-b border-slate-100 pb-8">
            <div>
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Bill To</h3>
              <p className="font-bold text-lg text-slate-900">{customer?.name}</p>
              <p className="text-slate-500 text-sm">{customer?.email}</p>
              <p className="text-slate-500 text-sm">{customer?.phone}</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Invoice Details</h3>
              <p className="font-bold text-slate-900">#{Math.floor(Math.random() * 10000)}</p>
              <p className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">Draft</p>
            </div>
          </div>

          <table className="w-full text-left mb-8">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-xs font-bold text-slate-500 uppercase">Item</th>
                <th className="py-2 text-xs font-bold text-slate-500 uppercase text-center">Qty</th>
                <th className="py-2 text-xs font-bold text-slate-500 uppercase text-right">Price/Day</th>
                <th className="py-2 text-xs font-bold text-slate-500 uppercase text-right">Total (2 Days)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cart.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-4">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.category}</p>
                  </td>
                  <td className="py-4 text-center font-bold text-slate-700">{item.qty}</td>
                  <td className="py-4 text-right text-slate-600">{formatCurrency(item.price)}</td>
                  <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(item.price * item.qty * 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-1/2 space-y-3">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (0%)</span>
                <span>¢0.00</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-900 pt-4 border-t border-slate-200">
                <span>Total Due</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Continue Editing</Button>
          <Button onClick={onConfirm} variant="success"><Check className="w-4 h-4 mr-2" /> Confirm & Place Order</Button>
        </div>
      </div>
    </div>
  );
};
