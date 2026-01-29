"use client";

import React, { useState } from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { ClientsTable } from '../../components/clients/ClientsTable';
import { Card } from '../../components/ui/Card';

export default function AdminClientsPage() {
  const { Search, Loader2 } = Icons;
  const { clients, loading } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Client Database</h2>
        <div className="relative">
          <input 
            className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm w-64 outline-none focus:ring-4 focus:ring-secondary/20 focus:border-secondary transition-all" 
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
        </div>
      </div>
      <Card noPadding>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Loading client database...</p>
          </div>
        ) : (
          <ClientsTable data={filteredClients} />
        )}
      </Card>
    </div>
  );
}
