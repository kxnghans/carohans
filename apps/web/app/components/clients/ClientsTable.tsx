"use client";

import { useState, useMemo, Fragment } from 'react';
import { Card } from '../ui/Card';
import { formatCurrency, getIconStyle } from '../../utils/helpers';
import { Client, PortalFormData } from '../../types';
import { Icons } from '../../lib/icons';
import { ClientProfileForm } from './ClientProfileForm';
import { ScrollableContainer } from '../common/ScrollableContainer';
import { DynamicIcon } from '../common/DynamicIcon';

const SortIcon = ({ 
    column, 
    sortConfig 
}: { 
    column: keyof Client, 
    sortConfig: { key: keyof Client; direction: 'asc' | 'desc' } | null 
}) => {
    const { SortUp, SortDown } = Icons;
    if (sortConfig?.key !== column) return <SortUp className="w-3.5 h-3.5 text-muted opacity-30" />;
    return sortConfig.direction === 'asc' 
        ? <SortUp className="w-3.5 h-3.5 text-primary dark:text-warning" /> 
        : <SortDown className="w-3.5 h-3.5 text-primary dark:text-warning" />;
};

export const ClientsTable = ({ data }: { data: Client[] }) => {
    const { ChevronRight, Plus } = Icons;
    const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
    const [visibleCount, setVisibleCount] = useState(50);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Client; direction: 'asc' | 'desc' } | null>({
        key: 'firstName',
        direction: 'asc'
    });

    const sortedData = useMemo(() => {
        const sortableItems = [...data];
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

    const paginatedData = useMemo(() => {
        return sortedData.slice(0, visibleCount);
    }, [sortedData, visibleCount]);

    const handleViewMore = () => {
        setVisibleCount(prev => {
            if (prev < 200) return prev + 50;
            return prev + 20;
        });
    };

    const requestSort = (key: keyof Client) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleExpand = (clientId: number) => {
        setExpandedClientId(expandedClientId === clientId ? null : clientId);
    };

    const handleUpdateClient = (clientId: number, data: PortalFormData) => {
        console.log("Update client", clientId, data);
        setExpandedClientId(null);
    };

    const RenderClientIcon = ({ client }: { client: Client }) => {
        return (
            <DynamicIcon 
                iconString={client.image}
                color={client.color}
                variant="table"
                forceUpdate={client}
                fallback={<div className="font-bold text-xs">{client.firstName.substring(0, 1).toUpperCase()}{client.lastName.substring(0, 1).toUpperCase()}</div>}
            />
        );
    };

    return (
        <Card noPadding className="overflow-visible border-border shadow-sm">
            <ScrollableContainer>
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md shadow-sm">
                        <tr className="border-b border-border text-theme-caption">
                            <th 
                                className="p-4 pl-6 font-bold text-muted uppercase tracking-wider cursor-pointer group hover:bg-surface transition-colors"
                                onClick={() => requestSort('firstName')}
                            >
                                <div className="flex items-center gap-2">Client <SortIcon column="firstName" sortConfig={sortConfig} /></div>
                            </th>
                            <th className="p-4 font-bold text-muted uppercase tracking-wider">Email & Phone</th>
                            <th 
                                className="p-4 font-bold text-muted uppercase tracking-wider text-center cursor-pointer group hover:bg-surface transition-colors"
                                onClick={() => requestSort('totalOrders')}
                            >
                                <div className="flex items-center justify-center gap-2">Orders <SortIcon column="totalOrders" sortConfig={sortConfig} /></div>
                            </th>
                            <th 
                                className="p-4 font-bold text-muted uppercase tracking-wider text-center cursor-pointer group hover:bg-surface transition-colors"
                                onClick={() => requestSort('totalSpent')}
                            >
                                <div className="flex items-center justify-center gap-2">Spent <SortIcon column="totalSpent" sortConfig={sortConfig} /></div>
                            </th>
                            <th className="p-4 font-bold text-muted uppercase tracking-wider text-right pr-6">Last Order</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedData.map(client => (
                            <Fragment key={client.id}>
                                <tr className="hover:bg-background/50 transition-colors group cursor-pointer" onClick={() => toggleExpand(client.id)}>
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-lg flex items-center justify-center border transition-all ${getIconStyle(client.color).container}`}>
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
                                            <ChevronRight className={`w-5 h-5 ${expandedClientId === client.id ? 'text-primary dark:text-warning' : 'text-muted'}`} />
                                        </div>
                                    </td>
                                </tr>
                                {expandedClientId === client.id && (
                                    <tr className="bg-background/30 text-left">
                                        <td colSpan={6} className="p-0">
                                            <div className="p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
                                                <Card className="bg-surface border-border shadow-sm p-5 md:p-8 w-full lg:max-w-[60%] mx-auto">
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
                            </Fragment>
                        ))}
                    </tbody>
                </table>

                {sortedData.length > visibleCount && (
                    <div className="p-8 flex justify-center border-t border-border bg-background/20">
                        <button 
                            onClick={handleViewMore}
                            className="group flex items-center gap-3 px-8 py-3 bg-surface border-2 border-primary/20 rounded-2xl text-primary font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-primary-text hover:border-primary transition-all shadow-lg shadow-primary/5 active:scale-95"
                        >
                            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                            View More ({sortedData.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </ScrollableContainer>
        </Card>
    );
};
