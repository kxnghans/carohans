import { supabase } from '../lib/supabase';
import { Discount } from '../types';

export const validateDiscount = async (code: string, clientId?: number): Promise<{ isValid: boolean; message?: string; discount?: Discount }> => {
  if (!code) return { isValid: false, message: 'Discount code is required.' };

  const { data: discount, error } = await supabase
    .from('discounts')
    .select('id, name, code, discount_type, discount_value, duration_type, start_date, end_date, status, approval_strategy, created_at')
    .eq('code', code)
    .single();

  if (error || !discount) {
    return { isValid: false, message: 'Invalid discount code.' };
  }

  if (discount.status !== 'active') {
    return { isValid: false, message: `Discount is ${discount.status}.` };
  }

  const today = new Date().toISOString().split('T')[0] || '';
  if (discount.duration_type === 'period') {
    if (discount.start_date && today < discount.start_date) {
      return { isValid: false, message: 'Discount is not yet active.' };
    }
    if (discount.end_date && today > discount.end_date) {
      return { isValid: false, message: 'Discount has expired.' };
    }
  }

  // Check one-time use if client is known
  if (discount.duration_type === 'one_time' && clientId) {
    const { count, error: redemptionError } = await supabase
      .from('discount_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('discount_id', discount.id)
      .eq('client_id', clientId);

    if (!redemptionError && count && count > 0) {
        return { isValid: false, message: 'You have already used this discount.' };
    }
  }

  return { isValid: true, discount: discount as unknown as Discount };
};

export const getActiveDiscounts = async (): Promise<Discount[]> => {
  const { data, error } = await supabase
    .from('discounts')
    .select('id, name, code, discount_type, discount_value, duration_type, start_date, end_date, status, approval_strategy, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active discounts:', error);
    return [];
  }
  return data as unknown as Discount[] || [];
};

export const fetchAllDiscounts = async (): Promise<Discount[]> => {
    const { data, error } = await supabase
        .from('discounts')
        .select('id, name, code, discount_type, discount_value, duration_type, start_date, end_date, status, approval_strategy, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all discounts:', error);
        return [];
    }
    return data as unknown as Discount[] || [];
};

export const fetchDiscountsWithStats = async (): Promise<Discount[]> => {
    // 1. Fetch base discounts
    const discounts = await fetchAllDiscounts();
    
    // 2. Fetch redemption stats
    const { data: stats, error: statsError } = await supabase
        .from('discount_redemptions')
        .select('discount_id, discount_amount_applied');

    if (statsError) {
        console.error('Error fetching redemption stats:', statsError);
        return discounts;
    }

    // 3. Aggregate
    return discounts.map(d => {
        const discountStats = stats.filter(s => s.discount_id === d.id);
        return {
            ...d,
            usageCount: discountStats.length,
            totalImpact: discountStats.reduce((sum, s) => sum + (Number(s.discount_amount_applied) || 0), 0)
        };
    });
};

export const createDiscount = async (discount: Omit<Discount, 'id'>): Promise<Discount | null> => {
    const { data, error } = await supabase
        .from('discounts')
        .insert(discount)
        .select()
        .single();

    if (error) {
        console.error('Error creating discount:', error);
        throw error;
    }
    return data as unknown as Discount;
};

export const deleteDiscount = async (id: number): Promise<void> => {
    const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting discount:', error);
        throw error;
    }
};

export const createAdHocDiscount = async (
    name: string, 
    type: 'fixed' | 'percentage', 
    value: number,
    durationType: 'one_time' | 'unlimited' | 'period' = 'one_time'
): Promise<Discount | null> => {
    const code = `ADHOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const { data, error } = await supabase
        .from('discounts')
        .insert({
            name,
            code,
            discount_type: type,
            discount_value: value,
            duration_type: durationType,
            status: 'expired', // One-time ad-hoc is immediately used
            approval_strategy: 'auto'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating ad-hoc discount:', error);
        return null;
    }
    return data as unknown as Discount;
};

export const recordRedemption = async (
    orderId: number, 
    discountId: number, 
    clientId: number, 
    amountApplied: number
): Promise<void> => {
    const { error } = await supabase
        .from('discount_redemptions')
        .insert({
            order_id: orderId,
            discount_id: discountId,
            client_id: clientId,
            discount_amount_applied: amountApplied,
            approval_status: 'approved'
        });

    if (error) {
        console.error('Error recording discount redemption:', error);
    }
};

export const fetchRedemptionsByDiscount = async (discountId: number) => {
    const { data, error } = await supabase
        .from('discount_redemptions')
        .select(`
            id,
            applied_at,
            discount_amount_applied,
            order_id,
            client_id,
            clients (first_name, last_name),
            orders (start_date, end_date)
        `)
        .eq('discount_id', discountId)
        .order('applied_at', { ascending: false });

    if (error) {
        console.error('Error fetching redemptions:', error);
        return [];
    }

    interface RedemptionQueryResult {
        id: number;
        applied_at: string;
        discount_amount_applied: number;
        order_id: number;
        client_id: number;
        clients: { first_name: string; last_name: string } | null;
        orders: { start_date: string; end_date: string } | null;
    }

    return (data as unknown as RedemptionQueryResult[]).map(r => ({
        id: r.id,
        appliedAt: r.applied_at,
        amount: Number(r.discount_amount_applied),
        orderId: r.order_id,
        clientId: r.client_id,
        clientName: r.clients ? `${r.clients.first_name} ${r.clients.last_name}` : 'Unknown Client',
        orderDates: r.orders ? `${formatDate(r.orders.start_date)} - ${formatDate(r.orders.end_date)}` : 'Unknown Order'
    }));
};

const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};
