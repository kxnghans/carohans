"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../../lib/icons';
import { ClientProfileForm } from '../clients/ClientProfileForm';
import { createClientAction } from '../../actions/clients';
import { useScrollLock } from '../../hooks/useScrollLock';
import { PortalFormData, Client } from '../../types';
import { useAppStore } from '../../context/AppContext';
import { getUserFriendlyErrorMessage } from '../../utils/errorMapping';

export const AddClientModal = ({ isOpen, onClose, onSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: Client) => void;
}) => {
    const { X, Users } = Icons;
    const { showNotification } = useAppStore();
    const [mounted, setMounted] = useState(false);

    useScrollLock(isOpen);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const handleCreateClient = async (data: PortalFormData) => {
        try {
            const result = await createClientAction(data as Partial<Client>);
            if (result.success && result.data) {
                const newClient: Client = {
                    id: result.data.id,
                    firstName: result.data.first_name,
                    lastName: result.data.last_name,
                    phone: result.data.phone,
                    email: result.data.email,
                    address: result.data.address,
                    username: result.data.username || '',
                    image: result.data.image,
                    color: result.data.color,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastOrder: new Date().toISOString()
                };
                showNotification("Client record added!", "success");
                onSuccess(newClient);
                onClose();
            } else {
                showNotification(getUserFriendlyErrorMessage(result.error || "Failed to create client", "Client"), "error");
            }
        } catch (err) {
            console.error(err);
            showNotification(getUserFriendlyErrorMessage(err, "Client"), "error");
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-primary text-primary-text p-6 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Add New Client</h2>
                            <p className="opacity-70 text-sm">Create a new client record</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <ClientProfileForm 
                        initialData={{
                            firstName: '',
                            lastName: '',
                            username: '',
                            phone: '',
                            email: '',
                            address: '',
                            image: 'User',
                            color: 'text-slate-600',
                            start: '',
                            end: ''
                        }}
                        onSubmit={handleCreateClient}
                        onCancel={onClose}
                        submitLabel="Create Client"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};
