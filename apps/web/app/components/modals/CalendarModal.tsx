"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';

export const CalendarModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { X, ChevronLeft, ChevronRight, Calendar: CalendarIcon, Trash2 } = Icons;
  const [viewDate, setViewDate] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [selectionMode, setSelectionMode] = useState<'individual' | 'range'>('individual');
  const [blockedDates, setBlockedDates] = useState<string[]>(['2026-02-05', '2026-02-12', '2026-02-19', '2026-02-26', '2026-02-27', '2026-02-28']);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);

  const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  // --- Smart Grouping Logic ---
  const groupedBlockedDates = useMemo(() => {
    if (blockedDates.length === 0) return [];
    
    const sorted = [...blockedDates].sort();
    const groups: string[][] = [];
    let currentGroup: string[] = [];

    sorted.forEach((dateStr, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(dateStr);
      } else {
        const prevDate = new Date(currentGroup[currentGroup.length - 1]);
        const currDate = new Date(dateStr);
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentGroup.push(dateStr);
        } else {
          groups.push(currentGroup);
          currentGroup = [dateStr];
        }
      }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }, [blockedDates]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDate = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return d.toISOString().split('T')[0];
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  const unblockGroup = (group: string[]) => {
    setBlockedDates(prev => prev.filter(d => !group.includes(d)));
  };

  const handleDateClick = (dateStr: string) => {
    if (blockedDates.includes(dateStr)) return;

    if (selectionMode === 'individual') {
      setPendingDates(prev => 
        prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
      );
    } else {
      if (rangeAnchor === null) {
        setRangeAnchor(dateStr);
      } else {
        const start = new Date(rangeAnchor < dateStr ? rangeAnchor : dateStr);
        const end = new Date(rangeAnchor < dateStr ? dateStr : rangeAnchor);
        const newRange: string[] = [];
        let current = new Date(start);
        while (current <= end) {
          const s = current.toISOString().split('T')[0];
          if (!blockedDates.includes(s)) newRange.push(s);
          current.setDate(current.getDate() + 1);
        }
        setPendingDates(prev => Array.from(new Set([...prev, ...newRange])));
        setRangeAnchor(null);
      }
    }
  };

  const getDayClass = (dateStr: string) => {
    if (blockedDates.includes(dateStr)) return "bg-error/5 text-muted/40 cursor-not-allowed line-through";
    if (rangeAnchor === dateStr) return "bg-indigo-800 text-primary-text ring-2 ring-indigo-300 ring-offset-2 z-10 scale-105";
    if (pendingDates.includes(dateStr)) return "bg-primary text-primary-text shadow-sm";
    return "hover:bg-surface text-slate-700 hover:text-foreground";
  };

  const handleBlockSelected = () => {
    setBlockedDates(prev => [...prev, ...pendingDates]);
    setPendingDates([]);
    setRangeAnchor(null);
  };

  return (
    <div 
      className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Increased max-width for side-by-side layout */}
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg lg:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="p-5 bg-primary text-primary-text flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold">Availability Calendar</h2>
            <p className="text-muted text-sm">Manage blackout dates</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          
          {/* LEFT: CALENDAR */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto border-r border-border">
             {/* MODE TOGGLES */}
            <div className="p-4 bg-surface border-b border-border flex gap-2 shrink-0">
                <button
                    onClick={() => { setSelectionMode('individual'); setRangeAnchor(null); }}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-tighter rounded-xl transition-all border-2 ${selectionMode === 'individual' ? 'bg-primary text-primary-text border-indigo-600 shadow-lg shadow-primary/10' : 'bg-white text-muted border-border hover:bg-background'}`}
                >
                    Individual
                </button>
                <button
                    onClick={() => { setSelectionMode('range'); setRangeAnchor(null); }}
                    className={`flex-1 py-3 text-sm font-black uppercase tracking-tighter rounded-xl transition-all border-2 ${selectionMode === 'range' ? 'bg-primary text-primary-text border-indigo-600 shadow-lg shadow-primary/10' : 'bg-white text-muted border-border hover:bg-background'}`}
                >
                    Range Select
                </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4" /></Button>
                <div className="flex items-center gap-3">
                    <h3 className="font-black text-xl text-foreground w-40 text-center tracking-tight">{monthYear}</h3>
                    <button 
                      onClick={handleToday} 
                      className="flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-100 px-4 py-2 rounded-full hover:bg-indigo-200 transition-all active:scale-95 uppercase tracking-widest border border-indigo-200 shadow-sm"
                    >
                      Today
                    </button>
                </div>
                <Button variant="secondary" size="sm" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-xs font-bold text-muted text-center uppercase tracking-wider">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDate(day);
                  const hasEvent = ['2026-02-15', '2026-02-16', '2026-02-20'].includes(dateStr);
                  const isBlocked = blockedDates.includes(dateStr);
                  const isPending = pendingDates.includes(dateStr);

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(dateStr)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all relative ${getDayClass(dateStr)}`}
                    >
                      <span>{day}</span>
                      {hasEvent && !isPending && !isBlocked && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1"></div>}
                      {isBlocked && <div className="w-1.5 h-1.5 rounded-full bg-error mt-1 shadow-[0_0_4px_rgba(239,68,68,0.4)]"></div>}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                  <p className="text-xs text-muted bg-background inline-block px-3 py-1 rounded-full border border-border">
                      {selectionMode === 'individual' ? "Tap dates to select" : rangeAnchor ? "Select end date" : "Select start date"}
                  </p>
              </div>
            </div>
          </div>

          {/* RIGHT: BLOCKED DATES LIST (Sidebar on Desktop, Bottom on Mobile) */}
          <div className="w-full lg:w-80 bg-background/50 flex flex-col min-h-[200px] lg:min-h-0">
             <div className="p-4 border-b border-border bg-background">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Blocked Periods
                    <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{groupedBlockedDates.length}</span>
                </h4>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {groupedBlockedDates.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted gap-2">
                        <CalendarIcon className="w-8 h-8 opacity-20" />
                        <p className="text-xs italic">No dates blocked yet.</p>
                    </div>
                ) : (
                    groupedBlockedDates.map((group, idx) => {
                        const isRange = group.length > 1;
                        const label = isRange 
                            ? `${formatDateDisplay(group[0])} - ${formatDateDisplay(group[group.length - 1])}`
                            : formatDateDisplay(group[0]);
                        
                        return (
                            <div key={idx} className="group flex items-center justify-between bg-white p-3 rounded-xl border border-border hover:border-indigo-300 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-8 rounded-full ${isRange ? 'bg-primary' : 'bg-slate-400'}`}></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{label}</p>
                                        {isRange && <p className="text-[10px] text-muted font-medium">{group.length} days</p>}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => unblockGroup(group)}
                                    className="p-2 text-slate-300 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                    title="Remove block"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    })
                )}
             </div>

             {/* FOOTER ACTIONS */}
             <div className="p-4 bg-white border-t border-border flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => { setPendingDates([]); setRangeAnchor(null); }} disabled={pendingDates.length === 0}>Clear</Button>
                <Button variant="primary" className="flex-[2]" onClick={handleBlockSelected} disabled={pendingDates.length === 0}>
                    {pendingDates.length > 0 ? `Block ${pendingDates.length} Days` : 'Block Selected'}
                </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
