export interface InventoryItem {
    id: number;
    name: string;
    category: string;
    stock: number;
    price: number;
    replacementCost: number;
    maintenance: number;
    image: string;
    color: string;
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
    clientName: string;
    phone: string;
    email: string;
    status: string; // "Pending" | "Approved" | "Active" | "Late" | "Completed" | "Settlement" | "Rejected" | "Canceled"
    items: OrderItem[];
    startDate: string;
    endDate: string;
    totalAmount: number;
    amountPaid: number;
    penaltyAmount: number;
    depositPaid: boolean;
    closedAt?: string;
    returnStatus?: 'On Time' | 'Early' | 'Late';
    itemIntegrity?: 'Good' | 'Lost' | 'Damaged';
    discountName?: string;
    discountType?: 'fixed' | 'percentage';
    discountValue?: number;
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