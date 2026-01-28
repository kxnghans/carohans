"use client";

import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/helpers';
import { Client, PortalFormData } from '../../types';
import { Icons, InventoryIcons } from '../../lib/icons';
import { ClientProfileForm } from './ClientProfileForm';

export const ClientsTable = ({ data }: { data: Client[] }) => {
    const { SortUp, SortDown, ChevronRight, User } = Icons;
    const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Client; direction: 'asc' | 'desc' } | null>({
        key: 'firstName',
        direction: 'asc'
    });

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === undefined) return 1;
                if (bVal === undefined) return -1;

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const requestSort = (key: keyof Client) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: keyof Client }) => {
        if (sortConfig?.key !== column) return <SortUp className="w-3.5 h-3.5 text-muted opacity-30" />;
        return sortConfig.direction === 'asc' 
            ? <SortUp className="w-3.5 h-3.5 text-primary dark:text-amber-500" /> 
            : <SortDown className="w-3.5 h-3.5 text-primary dark:text-amber-500" />;
    };

    const toggleExpand = (clientId: number) => {
        setExpandedClientId(expandedClientId === clientId ? null : clientId);
    };

    const handleUpdateClient = (clientId: number, data: PortalFormData) => {
        // In a real app, this would call an API or Context method to update the specific client.
        // For now we just log it as the store doesn't have a generic "updateClient" method yet.
        console.log("Update client", clientId, data);
        setExpandedClientId(null);
    };

    const RenderClientIcon = ({ client }: { client: Client }) => {
        if (client.image?.startsWith('icon:')) {
            const iconKey = client.image.replace('icon:', '');
            const IconComp = InventoryIcons[iconKey];
            return IconComp ? <IconComp className={`w-4 h-4 ${client.color || 'text-indigo-600'}`} /> : <span>📦</span>;
        }
        if (client.image) {
             return <span>{client.image}</span>;
        }
        return <div className="font-bold text-xs">{client.firstName.substring(0, 1).toUpperCase()}{client.lastName.substring(0, 1).toUpperCase()}</div>;
    };

    return (
        <Card noPadding className="overflow-hidden border-border shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-border bg-background/50 text-theme-caption">
                        <th 
                            className="p-4 pl-6 font-bold text-muted uppercase tracking-wider cursor-pointer group hover:bg-surface transition-colors"
                            onClick={() => requestSort('firstName')}
                        >
                            <div className="flex items-center gap-2">Client <SortIcon column="firstName" /></div>
                        </th>
                        <th className="p-4 font-bold text-muted uppercase tracking-wider">Email & Phone</th>
                        <th 
                            className="p-4 font-bold text-muted uppercase tracking-wider text-center cursor-pointer group hover:bg-surface transition-colors"
                            onClick={() => requestSort('totalOrders')}
                        >
                            <div className="flex items-center justify-center gap-2">Orders <SortIcon column="totalOrders" /></div>
                        </th>
                        <th 
                            className="p-4 font-bold text-muted uppercase tracking-wider text-center cursor-pointer group hover:bg-surface transition-colors"
                            onClick={() => requestSort('totalSpent')}
                        >
                            <div className="flex items-center justify-center gap-2">Spent <SortIcon column="totalSpent" /></div>
                        </th>
                        <th className="p-4 font-bold text-muted uppercase tracking-wider text-right pr-6">Last Order</th>
                        <th className="p-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {sortedData.map(client => (
                        <React.Fragment key={client.id}>
                            <tr className="hover:bg-background/50 transition-colors group cursor-pointer" onClick={() => toggleExpand(client.id)}>
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${client.color ? client.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' border-' + client.color.split('-')[1] + '-200 dark:bg-primary/10 dark:border-primary/20' : 'bg-indigo-50 dark:bg-primary/10 text-primary border-indigo-100 dark:border-primary/20'}`}>
                                            <RenderClientIcon client={client} />
                                        </div>
                                        <div>
                                            <span className="text-theme-body-bold text-foreground block">{client.firstName} {client.lastName}</span>
                                            <span className="text-theme-caption text-muted">ID: #{client.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-theme-label text-muted">{client.email}</div>
                                    <div className="text-theme-caption text-muted">{client.phone}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-theme-body-bold text-foreground">
                                        {client.totalOrders}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-theme-body-bold text-foreground">
                                        {formatCurrency(client.totalSpent)}
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <span className="text-theme-caption text-muted">
                                        {client.lastOrder}
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <div className={`transition-transform duration-200 ${expandedClientId === client.id ? 'rotate-90' : ''}`}>
                                        <ChevronRight className={`w-5 h-5 ${expandedClientId === client.id ? 'text-primary dark:text-amber-500' : 'text-muted'}`} />
                                    </div>
                                </td>
                            </tr>
                            {expandedClientId === client.id && (
                                <tr className="bg-background/30">
                                    <td colSpan={6} className="p-0">
                                        <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                                            <Card className="bg-surface border-border shadow-sm p-6 w-full max-w-[60%] mx-auto">
                                                <h3 className="text-theme-title text-foreground mb-4">Edit Client Profile</h3>
                                                <ClientProfileForm 
                                                    compact={true}
                                                    initialData={{
                                                        firstName: client.firstName,
                                                        lastName: client.lastName,
                                                        username: client.username || '',
                                                        email: client.email,
                                                        phone: client.phone,
                                                        address: client.address,
                                                        image: client.image,
                                                        color: client.color,
                                                        start: '',
                                                        end: ''
                                                    }}
                                                    onSubmit={(data) => handleUpdateClient(client.id, data)}
                                                    onCancel={() => setExpandedClientId(null)}
                                                    submitLabel="Save Changes"
                                                />
                                            </Card>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            </div>
        </Card>
    );
};
