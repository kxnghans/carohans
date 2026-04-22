"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useAppStore } from '../../context/AppContext';
import { Blackout, fetchBlackoutsFromSupabase, addBlackoutToSupabase, deleteBlackoutFromSupabase } from '../../services/calendarService';

export const CalendarModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { X, ChevronLeft, ChevronRight, Calendar: CalendarIcon, Trash2, Info, Loader2 } = Icons;
  const { showNotification } = useAppStore();
  
  const [viewDate, setViewDate] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState<'individual' | 'range'>('individual');
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  useScrollLock(isOpen);

  const loadBlackouts = useCallback(async () => {
    if (!isOpen) return;
    try {
      setLoading(true);
      const data = await fetchBlackoutsFromSupabase();
      setBlackouts(data);
    } catch (error) {
      console.error("Failed to load blackouts:", error);
      showNotification("Failed to load blackout dates.", "error");
    } finally {
      setLoading(false);
    }
  }, [isOpen, showNotification]);

  useEffect(() => {
    loadBlackouts();
  }, [loadBlackouts]);

  const blockedDates = useMemo(() => {
    const dates: string[] = [];
    blackouts.forEach(b => {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0] ?? '');
        current.setDate(current.getDate() + 1);
      }
    });
    return Array.from(new Set(dates));
  }, [blackouts]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDate = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return d.toISOString().split('T')[0] ?? '';
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  const handleDeleteBlackout = async (id: number) => {
    try {
      await deleteBlackoutFromSupabase(id);
      showNotification("Blackout period removed.", "success");
      loadBlackouts();
    } catch (error) {
      console.error("Failed to delete blackout:", error);
      showNotification("Failed to remove blackout period.", "error");
    }
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
        const start = rangeAnchor < dateStr ? rangeAnchor : dateStr;
        const end = rangeAnchor < dateStr ? dateStr : rangeAnchor;
        
        const newRange: string[] = [];
        const current = new Date(start);
        const endDateObj = new Date(end);
        
        while (current <= endDateObj) {
          const s = current.toISOString().split('T')[0] ?? '';
          if (!blockedDates.includes(s)) newRange.push(s);
          current.setDate(current.getDate() + 1);
        }
        setPendingDates(prev => Array.from(new Set([...prev, ...newRange])));
        setRangeAnchor(null);
      }
    }
  };

  const handleBlockSelected = async () => {
    if (pendingDates.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const sorted = [...pendingDates].sort();
      const ranges: { start: string, end: string }[] = [];
      
      if (sorted.length > 0) {
        let currentStart = sorted[0] ?? '';
        let currentEnd = sorted[0] ?? '';
        
        for (let i = 1; i < sorted.length; i++) {
          const prevDate = new Date(currentEnd);
          const currDateStr = sorted[i] ?? '';
          const currDate = new Date(currDateStr);
          const diff = Math.ceil((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diff === 1) {
            currentEnd = currDateStr;
          } else {
            ranges.push({ start: currentStart, end: currentEnd });
            currentStart = currDateStr;
            currentEnd = currDateStr;
          }
        }
        ranges.push({ start: currentStart, end: currentEnd });
      }

      await Promise.all(ranges.map(r => addBlackoutToSupabase(r.start, r.end, "Manual Blackout")));
      
      showNotification(`${pendingDates.length} days blocked successfully.`, "success");
      setPendingDates([]);
      setRangeAnchor(null);
      loadBlackouts();
    } catch (error) {
      console.error("Failed to add blackouts:", error);
      showNotification("Failed to add blackout dates.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDayClass = (dateStr: string) => {
    const isBlocked = blockedDates.includes(dateStr);
    const isPending = pendingDates.includes(dateStr);
    const isAnchor = rangeAnchor === dateStr;

    if (isBlocked) return "bg-error/5 text-muted/40 cursor-not-allowed line-through";
    if (isAnchor) return "bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 z-10 scale-105";
    if (isPending) return "bg-primary text-primary-text shadow-md shadow-primary/20 scale-105";
    return "hover:bg-primary/5 text-foreground";
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg lg:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="p-5 bg-primary dark:bg-primary-text text-primary-text dark:text-primary flex justify-between items-center shrink-0 border-b border-transparent dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg"><CalendarIcon className="w-5 h-5" /></div>
            <div>
              <h2 className="text-theme-header">Availability Calendar</h2>
              <p className="opacity-70 text-theme-caption">Manage blackout dates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-surface">
          
          {/* LEFT: CALENDAR */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto border-r border-border">
             {/* MODE TOGGLES */}
            <div className="p-4 bg-background/50 border-b border-border flex gap-2 shrink-0">
                <button
                    onClick={() => { setSelectionMode('individual'); setRangeAnchor(null); }}
                    className={`flex-1 py-3 text-theme-label rounded-xl transition-all border-2 ${selectionMode === 'individual' ? 'bg-primary text-primary-text border-primary/20 shadow-lg shadow-primary/10' : 'bg-surface text-muted border-border hover:bg-background'}`}
                >
                    Individual
                </button>
                <button
                    onClick={() => { setSelectionMode('range'); setRangeAnchor(null); }}
                    className={`flex-1 py-3 text-theme-label rounded-xl transition-all border-2 ${selectionMode === 'range' ? 'bg-primary text-primary-text border-primary/20 shadow-lg shadow-primary/10' : 'bg-surface text-muted border-border hover:bg-background'}`}
                >
                    Range Select
                </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4" /></Button>
                <div className="flex items-center gap-3">
                    <h3 className="text-theme-title text-foreground w-40 text-center">{monthYear}</h3>
                    <button 
                      onClick={handleToday} 
                      className="flex items-center gap-1.5 text-theme-body bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-all active:scale-95 border border-primary/10 shadow-sm font-bold"
                    >
                      Today
                    </button>
                </div>
                <Button variant="secondary" size="sm" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>

              <div className="grid grid-cols-7 gap-3 md:gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-theme-caption text-muted text-center font-black uppercase tracking-widest">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3 md:gap-2">
                {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDate(day);
                  const isBlocked = blockedDates.includes(dateStr);
                  const isPending = pendingDates.includes(dateStr);

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(dateStr)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-theme-label font-bold transition-all relative border border-transparent ${getDayClass(dateStr)}`}
                    >
                      <span className="text-lg">{day}</span>
                      {isBlocked && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-error shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                      )}
                      {isPending && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                  <p className="text-theme-caption text-muted bg-background/50 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border">
                      <Info className="w-3.5 h-3.5 text-primary" />
                      {selectionMode === 'individual' ? "Tap dates to select" : rangeAnchor ? "Select end date" : "Select start date"}
                  </p>
              </div>
            </div>
          </div>

          {/* RIGHT: BLOCKED DATES LIST */}
          <div className="w-full lg:w-80 bg-background/30 flex flex-col min-h-[300px] lg:min-h-0">
             <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
                <h4 className="text-theme-subtitle text-foreground font-black uppercase tracking-tight flex items-center gap-2">
                    Active Blackouts
                </h4>
                <span className="bg-muted/10 text-muted text-[10px] font-black px-2 py-0.5 rounded-full">{blackouts.length}</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted gap-2 opacity-40">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-theme-caption font-bold uppercase tracking-widest">Loading...</p>
                    </div>
                ) : blackouts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted gap-2 opacity-40">
                        <CalendarIcon className="w-8 h-8" />
                        <p className="text-theme-caption font-bold uppercase tracking-widest">No active blackouts</p>
                    </div>
                ) : (
                    blackouts.map((b) => (
                        <div key={b.id} className="group flex items-center justify-between bg-surface p-3 rounded-xl border border-border hover:border-error/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 rounded-full bg-error/40 group-hover:bg-error transition-colors"></div>
                                <div>
                                    <p className="text-theme-body-bold text-foreground text-xs leading-tight">
                                        {b.start_date === b.end_date 
                                            ? formatDateDisplay(b.start_date)
                                            : `${formatDateDisplay(b.start_date)} - ${formatDateDisplay(b.end_date)}`}
                                    </p>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">{b.reason || 'Global Blackout'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteBlackout(b.id)}
                                className="p-2 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                title="Remove blackout"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
             </div>

             {/* FOOTER ACTIONS */}
             <div className="p-4 bg-surface border-t border-border space-y-3">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] text-muted font-black uppercase tracking-widest">Selected Days</span>
                    <span className="text-primary font-black">{pendingDates.length}</span>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        className="flex-1 rounded-xl h-12 font-black uppercase tracking-widest text-[10px]" 
                        onClick={() => { setPendingDates([]); setRangeAnchor(null); }} 
                        disabled={pendingDates.length === 0 || isSubmitting}
                    >
                        Clear
                    </Button>
                    <Button 
                        variant="primary" 
                        className="flex-[2] rounded-xl h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" 
                        onClick={handleBlockSelected} 
                        disabled={pendingDates.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Block Selection'}
                    </Button>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
