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
        if (sortConfig?.key !== column) return <SortUp className="w-3 h-3 opacity-20" />;
        return sortConfig.direction === 'asc' ? <SortUp className="w-3 h-3 text-indigo-600" /> : <SortDown className="w-3 h-3 text-indigo-600" />;
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
        <Card noPadding className="overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th 
                            className="p-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100/50 transition-colors"
                            onClick={() => requestSort('firstName')}
                        >
                            <div className="flex items-center gap-2">Client <SortIcon column="firstName" /></div>
                        </th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email & Phone</th>
                        <th 
                            className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer group hover:bg-slate-100/50 transition-colors"
                            onClick={() => requestSort('totalOrders')}
                        >
                            <div className="flex items-center justify-center gap-2">Orders <SortIcon column="totalOrders" /></div>
                        </th>
                        <th 
                            className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer group hover:bg-slate-100/50 transition-colors"
                            onClick={() => requestSort('totalSpent')}
                        >
                            <div className="flex items-center justify-center gap-2">Spent <SortIcon column="totalSpent" /></div>
                        </th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Last Order</th>
                        <th className="p-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedData.map(client => (
                        <React.Fragment key={client.id}>
                            <tr className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => toggleExpand(client.id)}>
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${client.color ? client.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' border-' + client.color.split('-')[1] + '-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                            <RenderClientIcon client={client} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 block">{client.firstName} {client.lastName}</span>
                                            <span className="text-xs text-slate-400">ID: #{client.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-slate-600">{client.email}</div>
                                    <div className="text-xs text-slate-400">{client.phone}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-sm font-medium text-slate-700">
                                        {client.totalOrders}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-sm font-bold text-slate-900">
                                        {formatCurrency(client.totalSpent)}
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <span className="text-xs text-slate-500">
                                        {client.lastOrder}
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <div className={`transition-transform duration-200 ${expandedClientId === client.id ? 'rotate-90' : ''}`}>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                </td>
                            </tr>
                            {expandedClientId === client.id && (
                                <tr className="bg-slate-50/30">
                                    <td colSpan={6} className="p-0">
                                        <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                                            <Card className="bg-white border-slate-200 shadow-sm p-6 w-full max-w-[60%] mx-auto">
                                                <h3 className="text-lg font-bold mb-4">Edit Client Profile</h3>
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
        </Card>
    );
};
