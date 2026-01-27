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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg"><Phone className="w-5 h-5" /></div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Contact Us</h2>
              <p className="text-slate-400 text-sm font-medium">{isEditing ? 'Update Business Info' : 'Business Information'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-500"
                  value={formData.business_name}
                  onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-500"
                  value={formData.business_phone}
                  onChange={e => setFormData({ ...formData, business_phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-500"
                  value={formData.business_email}
                  onChange={e => setFormData({ ...formData, business_email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Description</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-500 min-h-[80px]"
                  value={formData.business_location}
                  onChange={e => setFormData({ ...formData, business_location: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google Maps Link</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-500"
                  value={formData.maps_link}
                  onChange={e => setFormData({ ...formData, maps_link: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Globe className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Business Name</p>
                  <p className="font-bold text-slate-900">{businessSettings.business_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                  <div className="flex flex-wrap gap-2.5">
                    <a href={`tel:${businessSettings.business_phone}`} className="font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                      {formatPhoneNumber(businessSettings.business_phone)}
                    </a>
                    <div className="flex gap-1.5">
                      <a 
                        href={`tel:${businessSettings.business_phone}`} 
                        className="text-[9px] font-black text-emerald-600 uppercase border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-lg hover:bg-emerald-100 transition-all active:scale-95"
                      >
                        Call Now
                      </a>
                      <a 
                        href={`sms:${businessSettings.business_phone}`} 
                        className="text-[9px] font-black text-indigo-600 uppercase border border-indigo-100 bg-indigo-50 px-2 py-0.5 rounded-lg hover:bg-indigo-100 transition-all active:scale-95"
                      >
                        Send Text
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                  <a href={`mailto:${businessSettings.business_email}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                    {businessSettings.business_email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><MapPin className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                  <p className="font-bold text-slate-900 leading-relaxed">{businessSettings.business_location}</p>
                  <Button 
                    variant="primary" 
                    size="md"
                    className="mt-3 w-full md:w-auto rounded-full px-8 shadow-indigo-200"
                    onClick={() => window.open(businessSettings.maps_link, '_blank')}
                  >
                    <MapPin className="w-4 h-4 mr-2 text-white" />
                    View on Google Maps
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          {isEditing ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => setIsEditMode(false)}>Cancel</Button>
              <Button variant="success" className="flex-1" onClick={handleSave}><Check className="w-4 h-4 mr-2" /> Save Changes</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
              {isAdmin && (
                <Button variant="primary" className="flex-1" onClick={() => setIsEditMode(true)}>
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
