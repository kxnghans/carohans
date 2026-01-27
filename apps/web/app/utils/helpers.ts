import { Order, Metrics } from '../types';

export const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '¢0';
  return `¢${amount.toLocaleString()}`;
};

export const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Active': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Late': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Settlement': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Rejected': return 'bg-slate-100 text-slate-500 border-slate-200';
    case 'Canceled': return 'bg-rose-100 text-rose-800 border-rose-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const getStatusDescription = (status: string) => {
  switch (status) {
    case 'Pending': return 'Waiting for admin approval and inventory confirmation.';
    case 'Approved': return 'Order confirmed and items reserved for pickup.';
    case 'Active': return 'Items are currently with the client.';
    case 'Late': return 'Return date has passed but items are still in the field.';
    case 'Settlement': return 'Items returned but financial balance or audit is outstanding.';
    case 'Completed': return 'Order finalized, all items returned and balance paid.';
    case 'Rejected': return 'Order was declined by administration.';
    case 'Canceled': return 'Order was withdrawn before processing.';
    default: return 'Current status of the order.';
  }
};

export const getReturnStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Early': return 'bg-blue-500 text-white border-blue-600';
    case 'On Time': return 'bg-emerald-500 text-white border-emerald-600';
    case 'Late': return 'bg-rose-500 text-white border-rose-600';
    default: return 'bg-slate-50 text-slate-400 border-slate-100';
  }
};

export const getItemIntegrityColor = (status: string | undefined) => {
  if (!status) return 'bg-slate-50 text-slate-400 border-slate-100';
  
  if (status.includes('Lost')) return 'bg-rose-500 text-white border-rose-600';
  if (status.includes('Damaged')) return 'bg-amber-400 text-white border-amber-500';
  if (status === 'Good') return 'bg-emerald-500 text-white border-emerald-600';
  
  return 'bg-slate-50 text-slate-400 border-slate-100';
};

export const getDurationDays = (start: string | undefined, end: string | undefined) => {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  
  const diffTime = Math.abs(e.getTime() - s.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  return diffDays;
};

export const calculateOrderTotal = (items: { price: number, qty: number }[], startDate: string, endDate: string) => {
  const days = getDurationDays(startDate, endDate);
  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  return total * days;
};

export const calculateMetrics = (orders: Order[]): Metrics => {
  const today = new Date().toISOString().split('T')[0];
  
  // Use the stored totalAmount which already includes duration logic and penalties
  const totalRevenue = orders.reduce((sum, o) => {
    return sum + (o.totalAmount || 0);
  }, 0);
  
  const pendingRequests = orders.filter(o => o.status === 'Pending').length;
  const approvedOrders = orders.filter(o => o.status === 'Approved').length;
  const completedRentals = orders.filter(o => o.status === 'Completed').length;
  
  // Real late: Status is 'Late' OR status is 'Active' but end date is before today
  const lateRentals = orders.filter(o => 
    o.status === 'Late' || 
    (o.status === 'Active' && o.endDate < today)
  ).length;

  // Active rentals: Status is 'Active' and NOT late
  const activeRentals = orders.filter(o => o.status === 'Active' && o.endDate >= today).length;

  const avgOrderValue = totalRevenue / (orders.length || 1);
  const revenueGrowth = 12.5;

  // Calculate Average Duration
  const totalDuration = orders.reduce((sum, o) => {
    return sum + getDurationDays(o.startDate, o.endDate);
  }, 0);
  const avgDuration = totalDuration / (orders.length || 1);

  // Pickups: Approved orders starting today
  const pickupsToday = orders.filter(o => o.status === 'Approved' && o.startDate === today).length;
  
  // Returns: Active or Late orders ending today
  const returnsToday = orders.filter(o => 
    (o.status === 'Active' || o.status === 'Late') && 
    o.endDate === today
  ).length;

  const completed = orders.filter(o => o.status === 'Completed');
  const onTimeCount = completed.filter(o => o.returnStatus === 'On Time').length;
  const onTimeReturnRate = (onTimeCount / (completed.length || 1)) * 100;

  return { 
    totalRevenue, 
    activeRentals, 
    pendingRequests, 
    approvedOrders,
    lateRentals, 
    completedRentals, 
    revenueGrowth, 
    avgOrderValue,
    pickupsToday,
    returnsToday,
    onTimeReturnRate,
    avgDuration
  };
};
