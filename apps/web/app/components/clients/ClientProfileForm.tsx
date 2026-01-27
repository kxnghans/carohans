"use client";

import React, { useState, useEffect } from 'react';
import { Icons, InventoryIcons } from '../../lib/icons';
import { Button } from '../../components/ui/Button';
import { IconColorPicker } from '../../components/inventory/IconColorPicker';
import { PortalFormData } from '../../types';

interface ClientProfileFormProps {
    initialData: PortalFormData;
    onSubmit: (data: PortalFormData) => void;
    onCancel?: () => void;
    submitLabel?: string;
    compact?: boolean;
}

export const ClientProfileForm = ({ initialData, onSubmit, onCancel, submitLabel = "Update Profile", compact = false }: ClientProfileFormProps) => {
    const { User, Phone, Mail, MapPin, Pencil } = Icons;
    const [formData, setFormData] = useState<PortalFormData>(initialData);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sync state when initialData changes (e.g. after fetch)
    useEffect(() => {
        if (initialData.email || initialData.firstName) { 
            setFormData(initialData);
        }
    }, [initialData]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName) newErrors.firstName = "Required";
        if (!formData.lastName) newErrors.lastName = "Required";
        if (!formData.phone) newErrors.phone = "Required";
        if (!formData.email) newErrors.email = "Required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(formData);
        }
    };

    const RenderProfileIcon = () => {
        if (formData.image?.startsWith('icon:')) {
            const iconKey = formData.image.replace('icon:', '');
            const IconComp = InventoryIcons[iconKey];
            const sizeClass = compact ? "w-8 h-8" : "w-10 h-10";
            return IconComp ? <IconComp className={`${sizeClass} ${formData.color || 'text-slate-400'}`} /> : <span className={compact ? "text-xl" : "text-3xl"}>📦</span>;
        }
        if (formData.image) {
             return <span className={compact ? "text-xl" : "text-3xl"}>{formData.image}</span>;
        }
        return <User className={`${compact ? "w-8 h-8" : "w-10 h-10"} ${formData.color || 'text-slate-400'}`} />;
    };

    return (
        <div className={compact ? "space-y-4" : "space-y-6"}>
            <div className={`flex items-center gap-6 ${compact ? "mb-4" : "mb-8"}`}>
                <div className="relative group">
                    <button 
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className={`${compact ? "h-16 w-16" : "h-24 w-24"} rounded-full flex items-center justify-center border-2 transition-all shadow-md overflow-hidden relative ${formData.color ? formData.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' border-' + (formData.color.split('-')[1] || 'slate') + '-200' : 'bg-slate-100 border-slate-200'}`}
                    >
                        <RenderProfileIcon />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className={compact ? "w-4 h-4 text-white" : "w-6 h-6 text-white"} />
                        </div>
                    </button>
                    <div className={`absolute -bottom-1 -right-1 bg-white ${compact ? "p-1" : "p-1.5"} rounded-full shadow-lg border border-slate-100 cursor-pointer`} onClick={() => setShowIconPicker(!showIconPicker)}>
                        <Pencil className={`${compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} text-indigo-600`} />
                    </div>
                    {showIconPicker && (
                        <div className={`absolute top-0 ${compact ? "left-full ml-2" : "left-full ml-4"} z-50`}>
                            <IconColorPicker 
                                currentIcon={formData.image || ''}
                                currentColor={formData.color || ''}
                                onChange={(val) => {
                                    setFormData(prev => ({ ...prev, ...val }));
                                    setShowIconPicker(false);
                                }}
                                onClose={() => setShowIconPicker(false)}
                            />
                        </div>
                    )}
                </div>
                <div>
                    <h2 className={`${compact ? "text-xl" : "text-2xl"} font-bold text-slate-900`}>{formData.firstName || 'New'} {formData.lastName || 'Client'}</h2>
                    <p className={`${compact ? "text-[10px]" : "text-xs"} font-bold text-slate-400 uppercase tracking-widest mt-0.5`}>Client Profile</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className={`${compact ? "text-[10px]" : "text-xs"} font-black text-slate-500 uppercase tracking-wider`}>First Name <span className="text-rose-500">*</span></label>
                    <div className="relative">
                        <User className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-3 text-slate-400`} />
                        <input 
                            className={`w-full pl-10 ${compact ? "p-2 text-sm" : "p-3"} border-2 ${errors.firstName ? 'border-rose-400' : 'border-slate-200'} bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all`} 
                            value={formData.firstName}
                            placeholder="John"
                            onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className={`${compact ? "text-[10px]" : "text-xs"} font-black text-slate-500 uppercase tracking-wider`}>Last Name <span className="text-rose-500">*</span></label>
                    <div className="relative">
                        <User className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-3 text-slate-400`} />
                        <input 
                            className={`w-full pl-10 ${compact ? "p-2 text-sm" : "p-3"} border-2 ${errors.lastName ? 'border-rose-400' : 'border-slate-200'} bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all`} 
                            value={formData.lastName}
                            placeholder="Doe"
                            onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className={`${compact ? "text-[10px]" : "text-xs"} font-black text-slate-500 uppercase tracking-wider`}>Username</label>
                <div className="relative">
                    <User className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-3 text-slate-400`} />
                    <input 
                        className={`w-full pl-10 ${compact ? "p-2 text-sm" : "p-3"} border-2 border-slate-200 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all`} 
                        value={formData.username}
                        placeholder="johndoe123"
                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    />
                </div>
            </div>
            
            <div className="space-y-1.5">
                <label className={`${compact ? "text-[10px]" : "text-xs"} font-black text-slate-500 uppercase tracking-wider`}>Contact Number <span className="text-rose-500">*</span></label>
                <div className="relative">
                    <Phone className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-3 text-slate-400`} />
                    <input 
                        className={`w-full pl-10 ${compact ? "p-2 text-sm" : "p-3"} border-2 ${errors.phone ? 'border-rose-400' : 'border-slate-200'} bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all`} 
                        value={formData.phone}
                        placeholder="024 123 4567"
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                </div>
            </div>
            
            <div className="space-y-1.5">
                <label className={`${compact ? "text-[10px]" : "text-xs"} font-black text-slate-500 uppercase tracking-wider`}>Email Address <span className="text-rose-500">*</span></label>
                <div className="relative">
                    <Mail className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-3 text-slate-400`} />
                    <input 
                        className={`w-full pl-10 ${compact ? "p-2 text-sm" : "p-3"} border-2 ${errors.email ? 'border-rose-400' : 'border-slate-200'} bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all`} 
                        value={formData.email}
                        placeholder="john@example.com"
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                </div>
            </div>
            
            <div className="space-y-1.5">
                <label className={`${compact ? "text-[10px]" : "text-xs"} font-black text-slate-500 uppercase tracking-wider`}>Default Delivery Address</label>
                <div className="relative">
                    <MapPin className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-3 text-slate-400`} />
                    <textarea 
                        className={`w-full pl-10 ${compact ? "p-2 text-sm h-16" : "p-3 h-24"} border-2 border-slate-200 bg-white text-slate-900 font-bold rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all resize-none`} 
                        value={formData.address || ''}
                        placeholder="Enter your street address..."
                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                </div>
                {!compact && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight ml-1">Optional - used for automatic delivery calculations</p>}
            </div>
            
            <div className={`flex gap-3 ${compact ? "pt-2" : "pt-4"}`}>
                {onCancel && <Button variant="secondary" className="flex-1" size={compact ? "sm" : "md"} onClick={onCancel}>Cancel</Button>}
                <Button className={`flex-1 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 ${compact ? "h-10 text-sm" : "h-14 text-lg"}`} size={compact ? "sm" : "md"} onClick={handleSubmit}>{submitLabel}</Button>
            </div>
        </div>
    );
};