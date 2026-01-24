"use client";

import React, { useState } from 'react';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';

export const CustomerSelector = ({ customers, onSelect, onClose }: any) => {
  const { X, Search, ChevronRight } = Icons;
  const [search, setSearch] = useState('');
  const filtered = customers.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Select Customer</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-900" /></button>
        </div>
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-indigo-500 transition-all font-medium"
              placeholder="Search by name or phone..."
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {filtered.map((c: any) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full text-left p-3 hover:bg-indigo-50 hover:border-indigo-100 border border-transparent rounded-xl transition-all group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-indigo-700">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone} • {c.email}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p>No customers found.</p>
              <Button variant="secondary" size="sm" className="mt-2">Create New Customer</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
