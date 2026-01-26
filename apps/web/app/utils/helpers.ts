import { Order, Metrics } from '../types';

export const formatCurrency = (amount: number) => `¢${amount.toLocaleString()}`;

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Active': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Overdue': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const calculateMetrics = (orders: Order[]): Metrics => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const activeRentals = orders.filter(o => o.status === 'Active').length;
  const pendingRequests = orders.filter(o => o.status === 'Pending').length;
  const overdueRentals = orders.filter(o => o.status === 'Overdue').length;
  const completedRentals = orders.filter(o => o.status === 'Completed').length;
  const avgOrderValue = totalRevenue / (orders.length || 1);
  const revenueGrowth = 12.5;
  return { totalRevenue, activeRentals, pendingRequests, overdueRentals, completedRentals, revenueGrowth, avgOrderValue };
};
