"use client";

import { useState } from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { ClientsTable } from '../../components/clients/ClientsTable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AddClientModal } from '../../components/modals/AddClientModal';

export default function AdminClientsPage() {
  const { Search, Loader2, UserPlus } = Icons;
  const { clients, loading, fetchData } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredClients = clients.filter(c => 
    (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-theme-header text-foreground tracking-tight">Client Database</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-80">
            <Search className="w-4 h-4 text-muted absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-secondary transition-colors" />
            <input 
              className="w-full pl-12 pr-12 py-2.5 h-[44px] bg-surface border border-border rounded-xl text-theme-body font-medium outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/5 transition-all shadow-sm text-center placeholder:text-muted/60" 
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 h-[44px] shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Client</span>
          </Button>
        </div>
      </div>

      <AddClientModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
            fetchData();
        }}
      />

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
