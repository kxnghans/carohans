export interface InventoryItem {
    id: number;
    name: string;
    category: string;
    stock: number;
    availableStock?: number;
    price: number;
    replacementCost: number;
    maintenance: number;
    image: string;
    color: string;
    sortOrder: number;
}

export interface CartItem {
    id: number;
    qty: number;
    price: number;
}

export interface OrderItem {
    inventoryId: number;
    qty: number;
    price: number;
    returnedQty?: number;
    lostQty?: number;
    damagedQty?: number;
}

export interface Order {
    id: number;
    publicId?: string;
    clientName: string;
    phone: string;
    email: string;
    status: string;
    items: {
        inventoryId: number;
        qty: number;
        price: number;
        returnedQty?: number;
        lostQty?: number;
        damagedQty?: number;
    }[];
    startDate: string;
    endDate: string;
    totalAmount: number;
    amountPaid: number;
    penaltyAmount?: number;
    depositPaid?: boolean;
    closedAt?: string;
    returnStatus?: string | null;
    itemIntegrity?: string | null;
    discountName?: string | null;
    discountType?: string | null;
    discountValue?: number | null;
    itemCount?: number;
}

export interface Discount {
    id: number;
    name: string;
    code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    duration_type: 'period' | 'unlimited' | 'one_time';
    start_date?: string;
    end_date?: string;
    status: 'active' | 'expired' | 'upcoming';
    approval_strategy: 'auto' | 'manual';
    usageCount?: number;
    totalImpact?: number;
}

export interface DiscountRedemption {
    id: number;
    discount_id: number;
    order_id: number;
    client_id: number;
    applied_at: string;
    discount_amount_applied: number;
    approval_status: 'approved' | 'pending' | 'rejected';
}

export interface Client {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    phone: string;
    email: string;
    address?: string;
    image?: string;
    color?: string;
    totalOrders: number;
    totalSpent: number;
    lastOrder: string;
}

export interface PortalFormData {
    firstName: string;
    lastName: string;
    username: string;
    phone: string;
    email: string;
    address?: string;
    image?: string;
    color?: string;
    start: string;
    end: string;
    discountCode?: string;
    discountName?: string;
    discountType?: 'fixed' | 'percentage';
    discountValue?: number;
}

export interface Metrics {
    totalRevenue: number;
    activeRentals: number;
    pendingRequests: number;
    approvedOrders: number;
    lateRentals: number;
    completedRentals: number;
    settlementOrders: number;
    revenueGrowth: number;
    avgOrderValue: number;
    pickupsToday: number;
    returnsToday: number;
    onTimeReturnRate: number;
    avgDuration: number;
}