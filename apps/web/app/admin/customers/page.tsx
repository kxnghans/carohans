"use client";

import React, { useState } from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { CustomersTable } from '../../components/customers/CustomersTable';
import { Card } from '../../components/ui/Card';

export default function AdminCustomersPage() {
  const { Search } = Icons;
  const { customers } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Customer Database</h2>
        <div className="relative">
          <input 
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:border-slate-400 transition-colors" 
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>
      <Card noPadding>
        <CustomersTable data={filteredCustomers} />
      </Card>
    </div>
  );
}
