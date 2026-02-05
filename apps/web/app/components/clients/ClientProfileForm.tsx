"use client";

import { useState, useEffect } from 'react';
import { Icons } from '../../lib/icons';
import { Button } from '../../components/ui/Button';
import { IconColorPicker } from '../../components/inventory/IconColorPicker';
import { PortalFormData } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { getIconStyle } from '../../utils/helpers';

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
            const timer = setTimeout(() => setFormData(initialData), 0);
            return () => clearTimeout(timer);
        }
        return undefined;
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

    return (
        <div className={compact ? "space-y-6" : "space-y-8"}>
            <div className={`flex items-center gap-6 ${compact ? "mb-6" : "mb-10"}`}>
                <div className="relative group">
                    <button 
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className={`rounded-full flex items-center justify-center border-2 transition-all shadow-md overflow-hidden relative ${getIconStyle(formData.color).container}`}
                    >
                        <DynamicIcon 
                            iconString={formData.image} 
                            color={formData.color} 
                            variant="form"
                            forceUpdate={formData}
                            fallback={<User className={`${compact ? "w-8 h-8" : "w-10 h-10"} ${formData.color || 'text-muted'}`} />} 
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className={compact ? "w-4 h-4 text-primary-text" : "w-6 h-6 text-primary-text"} />
                        </div>
                    </button>
                    <div className={`absolute -bottom-1 -right-1 bg-surface ${compact ? "p-1" : "p-1.5"} rounded-full shadow-lg border border-border cursor-pointer`} onClick={() => setShowIconPicker(!showIconPicker)}>
                        <Pencil className={`${compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} text-primary`} />
                    </div>
                    {showIconPicker && (
                        <div className={`absolute top-0 ${compact ? "left-full ml-2" : "left-full ml-4"} z-50`}>
                            <IconColorPicker 
                                currentIcon={formData.image || ''}
                                currentColor={formData.color || ''}
                                type="account"
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
                    <h2 className={`${compact ? "text-theme-subtitle" : "text-theme-title"} font-bold text-foreground`}>{formData.firstName || 'New'} {formData.lastName || 'Client'}</h2>
                    <p className="text-theme-caption font-bold text-muted uppercase tracking-widest mt-0.5">Client Profile</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-theme-caption font-semibold text-muted uppercase tracking-wider">First Name <span className="text-error">*</span></label>
                    <div className="relative">
                        <User className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-7 text-muted`} />
                        <input 
                            className={`w-full pl-20 ${compact ? "p-2 text-theme-label" : "p-3"} border-2 ${errors.firstName ? 'border-error' : 'border-border'} bg-surface text-foreground rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm transition-all font-medium placeholder:font-normal`} 
                            value={formData.firstName}
                            placeholder="John"
                            onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-theme-caption font-semibold text-muted uppercase tracking-wider">Last Name <span className="text-error">*</span></label>
                    <div className="relative">
                        <User className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-7 text-muted`} />
                        <input 
                            className={`w-full pl-20 ${compact ? "p-2 text-theme-label" : "p-3"} border-2 ${errors.lastName ? 'border-error' : 'border-border'} bg-surface text-foreground rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm transition-all font-medium placeholder:font-normal`} 
                            value={formData.lastName}
                            placeholder="Doe"
                            onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-theme-caption font-semibold text-muted uppercase tracking-wider">Contact Number <span className="text-error">*</span></label>
                <div className="relative">
                    <Phone className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-7 text-muted`} />
                                            <input 
                                                className={`w-full pl-20 ${compact ? "p-2 text-theme-label" : "p-3"} border-2 ${errors.phone ? 'border-error' : 'border-border'} bg-surface text-foreground rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm transition-all font-medium placeholder:font-normal`} 
                                                value={formData.phone}
                                                placeholder="024 123 4567"
                                                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            />                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-theme-caption font-semibold text-muted uppercase tracking-wider">Email Address <span className="text-error">*</span></label>
                <div className="relative">
                    <Mail className={`${compact ? "w-3.5 h-3.5 top-3" : "w-4 h-4 top-4"} absolute left-7 text-muted`} />
                                            <input 
                                                className={`w-full pl-20 ${compact ? "p-2 text-theme-label" : "p-3"} border-2 ${errors.email ? 'border-error' : 'border-border'} bg-surface text-foreground rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm transition-all font-medium placeholder:font-normal`} 
                                                value={formData.email}
                                                placeholder="john@example.com"
                                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            />                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-theme-caption font-semibold text-muted uppercase tracking-wider">Default Delivery Address</label>
                <div className="relative">
                    <MapPin className={`${compact ? "w-3.5 h-3.5 top-4" : "w-4 h-4 top-5"} absolute left-7 text-muted`} />
                                            <textarea 
                                                className={`w-full pl-20 ${compact ? "p-3 text-theme-label h-24" : "p-4 h-32"} border-2 border-border bg-surface text-foreground rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm transition-all resize-none font-medium placeholder:font-normal`} 
                                                value={formData.address || ''}
                                                placeholder="Enter your street address..."
                                                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            />                </div>
                {!compact && <p className="text-theme-caption text-muted font-semibold uppercase tracking-tight ml-1 mt-1">Optional - used for automatic delivery calculations</p>}
            </div>
            
            <div className={`flex flex-col sm:flex-row gap-4 ${compact ? "pt-4" : "pt-6"}`}>
                {onCancel && <Button variant="secondary" className="flex-1 h-12 sm:h-14" size={compact ? "sm" : "md"} onClick={onCancel}>Cancel</Button>}
                <Button className={`flex-[2] bg-primary dark:bg-primary hover:opacity-90 dark:hover:bg-primary/90 shadow-lg shadow-primary/10 dark:shadow-none h-12 sm:h-14`} size={compact ? "sm" : "md"} onClick={handleSubmit}>{submitLabel}</Button>
            </div>
        </div>
    );
};
