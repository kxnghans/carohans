"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { useAppStore } from '../../context/AppContext';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(businessSettings);
      setIsEditMode(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
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
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg text-primary"><Phone className="w-5 h-5" /></div>
            <div>
              <h2 className="text-theme-title tracking-tight text-white">Contact Us</h2>
              <p className="text-slate-400 text-theme-caption font-medium">{isEditing ? 'Update Business Info' : 'Business Information'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Business Name</label>
                <input 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.business_name}
                  onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.business_phone}
                  onChange={e => setFormData({ ...formData, business_phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.business_email}
                  onChange={e => setFormData({ ...formData, business_email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Location Description</label>
                <textarea 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all min-h-[80px] resize-none"
                  value={formData.business_location}
                  onChange={e => setFormData({ ...formData, business_location: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-theme-caption font-black text-muted uppercase tracking-widest ml-1">Google Maps Link</label>
                <input 
                  className="w-full p-3 bg-background border border-border rounded-xl text-theme-body-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.maps_link}
                  onChange={e => setFormData({ ...formData, maps_link: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><Globe className="w-5 h-5" /></div>
                <div>
                  <p className="text-theme-caption font-black text-muted uppercase tracking-widest mb-0.5">Business Name</p>
                  <p className="text-theme-body-bold text-foreground">{businessSettings.business_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="text-theme-caption font-black text-muted uppercase tracking-widest mb-0.5">Phone Number</p>
                  <div className="flex flex-wrap gap-2.5">
                    <a href={`tel:${businessSettings.business_phone}`} className="text-theme-body-bold text-foreground hover:text-primary transition-colors">
                      {formatPhoneNumber(businessSettings.business_phone)}
                    </a>
                    <div className="flex gap-1.5">
                      <a 
                        href={`tel:${businessSettings.business_phone}`} 
                        className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all active:scale-95"
                      >
                        Call Now
                      </a>
                      <a 
                        href={`sms:${businessSettings.business_phone}`} 
                        className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
                      >
                        Send Text
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="text-theme-caption font-black text-muted uppercase tracking-widest mb-0.5">Email Address</p>
                  <a href={`mailto:${businessSettings.business_email}`} className="text-theme-body-bold text-foreground hover:text-primary transition-colors">
                    {businessSettings.business_email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl"><MapPin className="w-5 h-5" /></div>
                <div>
                  <p className="text-theme-caption font-black text-muted uppercase tracking-widest mb-0.5">Location</p>
                  <p className="text-theme-body text-foreground leading-relaxed font-medium">{businessSettings.business_location}</p>
                  <Button 
                    variant="primary" 
                    size="md"
                    className="mt-3 w-full md:w-auto rounded-full px-8 dark:bg-primary dark:hover:bg-primary/90 dark:text-white"
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
