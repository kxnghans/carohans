"use client";

import React from 'react';
import { Icons } from '../../lib/icons';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useAppStore } from '../../context/AppContext';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/helpers';
import { FINANCIAL_TRENDS, CUSTOMER_SEGMENTS } from '../../lib/mockData';

export default function AdminBIPage() {
  const { customers, metrics } = useAppStore();
  const { DollarSign, CreditCard, Users } = Icons;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(metrics.totalRevenue)} 
          subtext="Last 30 Days" 
          trend={metrics.revenueGrowth} 
          color="bg-emerald-500" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Avg. Order" 
          value={formatCurrency(Math.floor(metrics.avgOrderValue))} 
          subtext="Per rental" 
          color="bg-blue-500" 
          icon={CreditCard} 
        />
        <StatCard 
          title="Total Customers" 
          value={customers.length.toString()} 
          subtext="Lifetime" 
          color="bg-slate-500" 
          icon={Users} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Revenue Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FINANCIAL_TRENDS}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `¢${value / 1000}k`} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Customer Segments</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CUSTOMER_SEGMENTS} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {CUSTOMER_SEGMENTS.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
