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
    itemId: number;
    qty: number;
}

export interface Order {
    id: number;
    customerName: string;
    phone: string;
    email: string;
    status: string; // "Pending" | "Active" | "Overdue" | "Completed" | "Approved"
    items: OrderItem[];
    startDate: string;
    endDate: string;
    totalAmount: number;
    depositPaid: boolean;
}

export interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    lastOrder: string;
}

export interface PortalFormData {
    name: string;
    phone: string;
    email: string;
    start: string;
    end: string;
}

export interface Metrics {
    totalRevenue: number;
    activeRentals: number;
    pendingRequests: number;
    overdueRentals: number;
    completedRentals: number;
    revenueGrowth: number;
    avgOrderValue: number;
}
