import { Order, Metrics } from '../types';

export const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '¢0';
  if (amount >= 1000000) {
    return `¢${(amount / 1000000).toFixed(2)}M`;
  }
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
    case 'Pending': return 'bg-status-pending text-white border-status-pending dark:bg-status-pending-bg dark:text-status-pending dark:border-status-pending/50';
    case 'Approved': return 'bg-status-approved text-white border-status-approved dark:bg-status-approved-bg dark:text-status-approved dark:border-status-approved/50';
    case 'Active': return 'bg-status-active text-white border-status-active dark:bg-status-active-bg dark:text-status-active dark:border-status-active/50';
    case 'Late': return 'bg-status-late text-white border-status-late dark:bg-status-late-bg dark:text-status-late dark:border-status-late/50';
    case 'Completed': return 'bg-status-completed text-white border-status-completed dark:bg-status-completed-bg dark:text-status-completed dark:border-status-completed/50';
    case 'Settlement': return 'bg-secondary text-white border-secondary dark:bg-status-settlement-bg dark:text-status-settlement dark:border-status-settlement/50';
    case 'Rejected': return 'bg-status-rejected text-white border-status-rejected dark:bg-status-rejected-bg dark:text-status-rejected dark:border-status-rejected/80';
    case 'Canceled': return 'bg-status-canceled text-white border-status-canceled dark:bg-status-canceled-bg dark:text-status-canceled dark:border-status-canceled/80';
    default: return 'bg-background text-muted border-border';
  }
};

export const getStatusDescription = (status: string) => {
  switch (status) {
    case 'Pending': return 'Waiting for admin approval and inventory confirmation.';
    case 'Approved': return 'Order confirmed and items reserved for pickup.';
    case 'Active': return 'Items are currently with the client.';
    case 'Late': return 'Planned return date has passed but items are still in the field.';
    case 'Settlement': return 'Items returned but financial balance or audit is outstanding.';
    case 'Completed': return 'Order finalized, all items returned and balance paid.';
    case 'Rejected': return 'Order was declined by administration.';
    case 'Canceled': return 'Order was withdrawn by the client.';
    default: return 'Current status of the order.';
  }
};

export const getReturnStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Early': return 'bg-accent-primary text-white border-accent-primary dark:bg-accent-primary/10 dark:text-accent-primary dark:border-accent-primary/20';
    case 'On Time': return 'bg-success text-white border-success dark:bg-success/10 dark:text-success dark:border-success/20';
    case 'Late': return 'bg-error text-white border-error dark:bg-error/10 dark:text-error dark:border-error/20';
    default: return 'bg-surface text-muted border-border';
  }
};

export const getItemIntegrityColor = (status: string | undefined) => {
  if (!status) return 'bg-surface text-muted border-border';
  
  if (status.includes('Lost')) return 'bg-error text-white border-error dark:bg-error/10 dark:text-error dark:border-error/20';
  if (status.includes('Damaged')) return 'bg-warning text-white border-warning dark:bg-warning/10 dark:text-warning dark:border-warning/20';
  if (status === 'Good') return 'bg-success text-white border-success dark:bg-success/10 dark:text-success dark:border-success/20';
  
  return 'bg-surface text-muted border-border';
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
  const today = new Date().toISOString().split('T')[0] ?? '';
  
  // Use the stored totalAmount which already includes duration logic and penalties
  const totalRevenue = orders.reduce((sum, o) => {
    return sum + (o.totalAmount || 0);
  }, 0);
  
  const pendingRequests = orders.filter(o => o.status === 'Pending').length;
  const approvedOrders = orders.filter(o => o.status === 'Approved').length;
  const settlementOrders = orders.filter(o => o.status === 'Settlement').length;
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
    settlementOrders,
    revenueGrowth, 
    avgOrderValue,
    pickupsToday,
    returnsToday,
    onTimeReturnRate,
    avgDuration
  };
};
