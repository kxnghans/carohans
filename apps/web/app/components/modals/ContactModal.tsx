"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { useAppStore } from '../../context/AppContext';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const { businessSettings, updateBusinessSettings, userRole } = useAppStore();
  const { X, Phone, Mail, MapPin, Pencil, Check, Globe } = Icons;
  
  const [isEditing, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(businessSettings);
  const [mounted, setMounted] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setFormData(businessSettings);
        setIsEditMode(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, businessSettings]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    await updateBusinessSettings(formData);
    setIsEditMode(false);
  };

  const formatPhoneNumber = (num: string) => {
    if (!num) return num;
    const cleaned = num.replace(/\s/g, '');
    if (cleaned.startsWith('+233') && cleaned.length === 13) {
      return `+233 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    return num;
  };

  if (!isOpen || !mounted) return null;

  const isAdmin = userRole === 'admin';

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary dark:bg-primary-text text-primary-text dark:text-primary p-6 flex justify-between items-center flex-shrink-0 border-b border-transparent dark:border-white/40">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg text-primary-text dark:text-primary"><Phone className="w-5 h-5" /></div>
            <div>
              <h2 className="text-theme-title tracking-tight">Contact Us</h2>
              <p className="opacity-70 text-theme-caption font-medium">{isEditing ? 'Update Business Info' : 'Business Information'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-primary-text dark:text-primary"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-theme-caption font-semibold text-muted uppercase tracking-widest ml-1">Business Name</label>
                <input 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all font-medium"
                  value={formData.business_name}
                  onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-theme-caption font-semibold text-muted uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all font-medium"
                  value={formData.business_phone}
                  onChange={e => setFormData({ ...formData, business_phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-theme-caption font-semibold text-muted uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all font-medium"
                  value={formData.business_email}
                  onChange={e => setFormData({ ...formData, business_email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-theme-caption font-semibold text-muted uppercase tracking-widest ml-1">Location Description</label>
                <textarea 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[80px] resize-none font-medium"
                  value={formData.business_location}
                  onChange={e => setFormData({ ...formData, business_location: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-theme-caption font-semibold text-muted uppercase tracking-widest ml-1">Google Maps Link</label>
                <input 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all font-medium"
                  value={formData.maps_link}
                  onChange={e => setFormData({ ...formData, maps_link: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 dark:bg-indigo-900/20 text-primary dark:text-indigo-400 rounded-xl"><Globe className="w-5 h-5" /></div>
                <div>
                  <p className="text-theme-subtitle text-muted mb-0.5">Business Name</p>
                  <p className="text-theme-body text-foreground">{businessSettings.business_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-success/10 dark:bg-emerald-900/20 text-success dark:text-emerald-400 rounded-xl"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="text-theme-subtitle text-muted mb-0.5">Phone Number</p>
                  <div className="flex flex-wrap gap-2.5">
                    <a href={`tel:${businessSettings.business_phone}`} className="text-theme-body text-foreground hover:text-primary transition-colors">
                      {formatPhoneNumber(businessSettings.business_phone)}
                    </a>
                    <div className="flex gap-1.5">
                      <a 
                        href={`tel:${businessSettings.business_phone}`} 
                        className="text-theme-caption font-medium text-success dark:text-emerald-400 uppercase border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all active:scale-95 shadow-sm"
                      >
                        Call Now
                      </a>
                      <a 
                        href={`sms:${businessSettings.business_phone}`} 
                        className="text-theme-caption font-medium text-primary dark:text-blue-400 uppercase border border-indigo-100 dark:border-blue-800/50 bg-primary/5 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-blue-900/60 transition-all active:scale-95 shadow-sm"
                      >
                        Send Text
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-accent-primary dark:text-blue-400 rounded-xl"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="text-theme-subtitle text-muted mb-0.5">Email Address</p>
                  <a href={`mailto:${businessSettings.business_email}`} className="text-theme-body text-foreground hover:text-primary transition-colors">
                    {businessSettings.business_email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-warning/10 dark:bg-amber-900/20 text-warning dark:text-amber-400 rounded-xl"><MapPin className="w-5 h-5" /></div>
                <div>
                  <p className="text-theme-subtitle text-muted mb-0.5">Location</p>
                  <p className="text-theme-body text-foreground leading-relaxed">{businessSettings.business_location}</p>
                  <Button 
                    variant="primary" 
                    size="md"
                    className="mt-3 w-full md:w-auto rounded-full px-8 dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-text font-bold"
                    onClick={() => window.open(businessSettings.maps_link, '_blank')}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View on Google Maps
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-background border-t border-border flex gap-3">
          {isEditing ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => setIsEditMode(false)}>Cancel</Button>
              <Button variant="success" className="flex-1" onClick={handleSave}><Check className="w-4 h-4 mr-2" /> Save Changes</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
              {isAdmin && (
                <Button variant="primary" className="flex-1 dark:bg-primary dark:hover:bg-primary/90" onClick={() => setIsEditMode(true)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit Info
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};