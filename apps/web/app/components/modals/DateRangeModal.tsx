"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { useScrollLock } from '../../hooks/useScrollLock';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (start: string, end: string) => void;
  initialStart?: string;
  initialEnd?: string;
}

export const DateRangeModal = ({ isOpen, onClose, onSelect, initialStart, initialEnd }: DateRangeModalProps) => {
  const { X, ChevronLeft, ChevronRight, Calendar: CalendarIcon } = Icons;
  const [viewDate, setViewDate] = useState(new Date());
  const [startDate, setStartDate] = useState<string | null>(initialStart || null);
  const [endDate, setEndDate] = useState<string | null>(initialEnd || null);
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Sync state when initial props change or modal opens
  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setStartDate(initialStart || null);
      setEndDate(initialEnd || null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen, initialStart, initialEnd]);

  const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  useScrollLock(isOpen);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || !mounted) return null;

  const formatDateStr = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return d.toISOString().split('T')[0] ?? '';
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleDateClick = (dateStr: string) => {
    if (!rangeAnchor) {
      setRangeAnchor(dateStr);
      setStartDate(dateStr);
      setEndDate(null);
    } else {
      const start = rangeAnchor < dateStr ? rangeAnchor : dateStr;
      const end = rangeAnchor < dateStr ? dateStr : rangeAnchor;
      setStartDate(start);
      setEndDate(end);
      setRangeAnchor(null);
    }
  };

  const getDayClass = (dateStr: string) => {
    const isStart = startDate === dateStr;
    const isEnd = endDate === dateStr;
    const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;

    if (isStart || isEnd) return "bg-primary text-primary-text shadow-lg z-10 scale-105";
    if (inRange) return "bg-primary/10 text-primary font-bold";
    if (rangeAnchor === dateStr) return "bg-indigo-800 text-primary-text ring-2 ring-indigo-300 ring-offset-2 z-10 scale-105";
    return "hover:bg-muted/10 text-foreground";
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onSelect(startDate, endDate);
      onClose();
    } else if (startDate && !endDate) {
        // Allow single date selection if needed, or force range
        onSelect(startDate, startDate);
        onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-primary dark:bg-primary-text text-primary-text dark:text-primary flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg"><CalendarIcon className="w-5 h-5" /></div>
            <div>
              <h2 className="text-theme-header">Select Date Range</h2>
              <p className="opacity-70 text-theme-caption">Click start and end dates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <h3 className="text-theme-title text-foreground w-40 text-center">{monthYear}</h3>
            <Button variant="secondary" size="sm" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-theme-caption text-muted text-center font-bold uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(day);
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(dateStr)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-theme-label font-semibold transition-all relative ${getDayClass(dateStr)}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setStartDate(null); setEndDate(null); setRangeAnchor(null); }}>Clear</Button>
            <Button variant="primary" className="flex-[2]" onClick={handleApply} disabled={!startDate}>Apply Range</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
