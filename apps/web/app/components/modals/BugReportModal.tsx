"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { useScrollLock } from '../../hooks/useScrollLock';
import { supabaseBugs } from '../../lib/supabase-bugs';
import { useAppStore } from '../../context/AppContext';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
type Category = 'UI' | 'Functional' | 'Performance' | 'Security' | 'Other';

export const BugReportModal = ({ isOpen, onClose }: BugReportModalProps) => {
  const { user, userRole, showNotification } = useAppStore();
  const { X, Bug, Send, Info } = Icons;
  
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'Medium' as Severity,
    category: 'UI' as Category,
    repro_steps: '',
    url: typeof window !== 'undefined' ? window.location.href : ''
  });

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        severity: 'Medium',
        category: 'UI',
        repro_steps: '',
        url: window.location.href
      }));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showNotification("Please provide a title and description.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabaseBugs
        .from('bug_reports')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            severity: formData.severity,
            category: formData.category,
            repro_steps: formData.repro_steps,
            url: formData.url,
            user_id: user?.id,
            user_email: user?.email,
            user_role: userRole,
            status: 'New'
          }
        ]);

      if (error) throw error;

      showNotification("Bug report submitted successfully. Thank you!", "success");
      onClose();
    } catch (error: any) {
      console.error("Error submitting bug report:", error);
      showNotification("Failed to submit bug report. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-error text-white p-6 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg text-white">
                <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-theme-title tracking-tight font-black">Report a Bug</h2>
              <p className="opacity-80 text-theme-caption font-medium uppercase tracking-wider">Help us improve the system</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto custom-scrollbar max-h-[70dvh]">
          
          <div className="space-y-1">
            <label className="text-theme-caption text-muted ml-1 font-bold uppercase tracking-wider">Bug Title</label>
            <input 
              required
              className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:ring-4 focus:ring-error/20 focus:border-error transition-all"
              placeholder="Short, descriptive title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-theme-caption text-muted ml-1 font-bold uppercase tracking-wider">Severity</label>
              <select 
                className="w-full p-3 bg-background border border-border rounded-xl text-theme-body text-foreground outline-none focus:ring-4 focus:ring-error/20 focus:border-error transition-all appearance-none cursor-pointer"
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value as Severity })}
              >
                <option value="Low">Low (Visual/Minor)</option>
                <option value="Medium">Medium (Annoyance)</option>
                <option value="High">High (Breaking feature)</option>
                <option value="Critical">Critical (System Down)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-theme-caption text-muted ml-1 font-bold uppercase tracking-wider">Category</label>
              <select 
                className="w-full p-3 bg-background border border-border rounded-xl text-theme-body text-foreground outline-none focus:ring-4 focus:ring-error/20 focus:border-error transition-all appearance-none cursor-pointer"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
              >
                <option value="UI">User Interface</option>
                <option value="Functional">Functional Bug</option>
                <option value="Performance">Performance</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-theme-caption text-muted ml-1 font-bold uppercase tracking-wider">Description</label>
            <textarea 
              required
              className="w-full p-3 bg-background border border-border rounded-xl text-theme-body text-foreground outline-none focus:ring-4 focus:ring-error/20 focus:border-error transition-all min-h-[100px] resize-none"
              placeholder="What happened? What did you expect to happen?"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-theme-caption text-muted ml-1 font-bold uppercase tracking-wider">Reproduction Steps (Optional)</label>
            <textarea 
              className="w-full p-3 bg-background border border-border rounded-xl text-theme-body text-foreground outline-none focus:ring-4 focus:ring-error/20 focus:border-error transition-all min-h-[80px] resize-none"
              placeholder="1. Clicked X&#10;2. Selected Y&#10;3. Observed Z"
              value={formData.repro_steps}
              onChange={e => setFormData({ ...formData, repro_steps: e.target.value })}
            />
          </div>

          <div className="p-4 bg-primary/5 rounded-2xl flex items-start gap-3 border border-primary/10">
             <div className="text-primary pt-0.5"><Info className="w-4 h-4" /></div>
             <p className="text-[11px] text-muted leading-relaxed">
                System info (URL, User Email, Role) will be automatically included to help our engineers diagnose the issue faster.
             </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 bg-background border-t border-border flex gap-3">
          <Button 
            variant="secondary" 
            className="flex-1 rounded-2xl h-12 font-bold" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-error/20" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Icons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Report
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
