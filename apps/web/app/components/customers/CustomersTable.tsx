"use client";

import React from 'react';
import { Icons } from '../../lib/icons';
import { formatCurrency } from '../../utils/helpers';
import { CUSTOMERS } from '../../lib/mockData';

export const CustomersTable = ({ data }: { data: typeof CUSTOMERS }) => {
  const { FileText } = Icons;
  return (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/50 border-b border-slate-200">
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">Customer</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Orders</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Lifetime Spent</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Last Order</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {data.map(customer => (
          <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
            <td className="p-4 pl-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                  {customer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">{customer.name}</span>
                  <span className="text-xs text-slate-400">ID: #{customer.id}</span>
                </div>
              </div>
            </td>
            <td className="p-4">
              <div className="text-sm text-slate-600">{customer.email}</div>
              <div className="text-xs text-slate-400">{customer.phone}</div>
            </td>
            <td className="p-4 text-center">
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                {customer.totalOrders}
              </span>
            </td>
            <td className="p-4 text-right font-medium text-slate-900">
              {formatCurrency(customer.totalSpent)}
            </td>
            <td className="p-4 text-right text-sm text-slate-500">
              {customer.lastOrder}
            </td>
            <td className="p-4 text-center">
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                <FileText className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
};
