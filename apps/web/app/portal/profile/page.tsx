"use client";

import React from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function PortalProfilePage() {
  const { portalFormData, setPortalFormData, showNotification } = useAppStore();
  const { User, Phone, Mail, MapPin } = Icons;

  const handleUpdate = () => {
    showNotification("Profile updated successfully!");
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in duration-500">
      <Card className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{portalFormData.name}</h2>
            <p className="text-slate-500">Client Account</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg" 
                value={portalFormData.name}
                onChange={e => setPortalFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Contact Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg" 
                value={portalFormData.phone}
                onChange={e => setPortalFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg" 
                value={portalFormData.email}
                onChange={e => setPortalFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Default Delivery Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <textarea 
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-24" 
                defaultValue="12 Independence Avenue, Accra, Ghana" 
              />
            </div>
          </div>
          
          <Button className="w-full" onClick={handleUpdate}>Update Profile</Button>
        </div>
      </Card>
    </div>
  );
}
