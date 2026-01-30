"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { DynamicIcon } from '../common/DynamicIcon';
import { Client } from '../../types';
import { useScrollLock } from '../../hooks/useScrollLock';

export const ClientSelector = ({ clients, onSelect, onClose, isOpen = true }: {
  clients: Client[],
  onSelect: (client: Client) => void,
  onClose: () => void,
  isOpen?: boolean
}) => {
  const { X, Search, ChevronRight, User, Users } = Icons;
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = clients.filter((c: Client) => {
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const searchTerm = search.toLowerCase();
    return fullName.includes(searchTerm) || (c.phone && c.phone.includes(search));
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary dark:bg-primary-text text-primary-text dark:text-primary p-6 flex justify-between items-center flex-shrink-0 border-b border-transparent dark:border-white/40">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg text-primary-text dark:text-primary"><Users className="w-5 h-5" /></div>
            <div>
              <h2 className="text-theme-title tracking-tight">Select Client</h2>
              <p className="opacity-70 text-theme-caption">Search the client database</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-primary-text dark:text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-background/50 border-b border-border">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-secondary transition-colors" />
            <input
              className="w-full bg-surface border border-border rounded-2xl pl-14 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all text-theme-body text-foreground placeholder:text-muted/40"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto p-3 space-y-1 flex-1 custom-scrollbar">
          {filtered.map((c: Client) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full text-left p-3 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-2xl transition-all group border border-transparent hover:border-primary/10"
            >
              <div className="flex items-center gap-4">
                {/* Profile Pic / Icon */}
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border transition-all ${c.color ? c.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' border-' + (c.color.split('-')[1] || 'slate') + '-200 dark:bg-primary/20 dark:border-primary/30' : 'bg-background border-border'}`}>
                    <DynamicIcon 
                        iconString={c.image} 
                        color={c.color} 
                        className="w-6 h-6" 
                        fallback={<User className={`w-6 h-6 ${c.color || 'text-muted'}`} />} 
                    />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-theme-body-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-theme-caption text-muted truncate">
                    {c.phone} • {c.email}
                  </p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-secondary dark:text-warning group-hover:translate-x-0.5 transition-all opacity-50 group-hover:opacity-100" />
              </div>
            </button>
          ))}
          
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border">
                <Search className="w-8 h-8 text-muted/20" />
              </div>
              <p className="text-theme-body text-muted italic">No clients found.</p>
              <Button variant="secondary" size="sm" className="mt-4 rounded-xl">Create New Client</Button>
            </div>
          )}
        </div>

        <div className="p-6 bg-background border-t border-border flex justify-end flex-shrink-0">
          <Button variant="secondary" onClick={onClose} className="w-full md:w-auto rounded-xl px-8">Close</Button>
        </div>
      </div>
    </div>,
    document.body
  );
};