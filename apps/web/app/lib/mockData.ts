
export const INVENTORY = [
    { id: 1, name: 'Gold Chiavari Chair', category: 'Chairs', stock: 120, price: 15, replacementCost: 150, maintenance: 0, image: '🪑' },
    { id: 2, name: 'Round Table (10-seater)', category: 'Tables', stock: 20, price: 50, replacementCost: 400, maintenance: 0, image: '⚪' },
    { id: 3, name: 'Premium Silverware Set', category: 'Cutlery', stock: 150, price: 5, replacementCost: 80, maintenance: 5, image: '🍴' },
    { id: 4, name: 'Crystal Wine Glass', category: 'Glassware', stock: 200, price: 3, replacementCost: 45, maintenance: 0, image: '🍷' },
    { id: 5, name: 'Decorative Flower Wall', category: 'Decor', stock: 2, price: 500, replacementCost: 1200, maintenance: 0, image: '🌸' },
    { id: 6, name: 'Marquee Tent (Large)', category: 'Tents', stock: 5, price: 1000, replacementCost: 15000, maintenance: 1, image: '🎪' },
    { id: 7, name: 'LED Dance Floor', category: 'Flooring', stock: 4, price: 2500, replacementCost: 20000, maintenance: 1, image: '💃' },
    { id: 8, name: 'Projector 4K', category: 'Electronics', stock: 3, price: 300, replacementCost: 3500, maintenance: 0, image: '📽️' },
    { id: 9, name: 'Sound System (PA)', category: 'Electronics', stock: 2, price: 800, replacementCost: 5000, maintenance: 0, image: '🔊' },
];

export const ORDERS = [
    {
        id: 101, customerName: 'Kwame Mensah', phone: '024-455-1234', email: 'kwame@example.com',
        status: 'Pending', items: [{ itemId: 1, qty: 50 }, { itemId: 2, qty: 5 }],
        startDate: '2026-02-15', endDate: '2026-02-17', totalAmount: 2000, depositPaid: false
    },
    {
        id: 102, customerName: 'Ama Osei', phone: '050-999-8888', email: 'ama.o@example.com',
        status: 'Active', items: [{ itemId: 3, qty: 100 }],
        startDate: '2026-01-20', endDate: '2026-01-22', totalAmount: 1000, depositPaid: true
    },
    {
        id: 103, customerName: 'Legacy Events', phone: '020-777-6666', email: 'info@legacyevents.gh',
        status: 'Overdue', items: [{ itemId: 5, qty: 1 }],
        startDate: '2026-01-18', endDate: '2026-01-19', totalAmount: 500, depositPaid: true
    },
    {
        id: 104, customerName: 'John Doe', phone: '055-123-4567', email: 'johnd@example.com',
        status: 'Completed', items: [{ itemId: 1, qty: 100 }, { itemId: 6, qty: 1 }],
        startDate: '2026-01-10', endDate: '2026-01-12', totalAmount: 5000, depositPaid: true
    },
    {
        id: 105, customerName: 'Sarah Smith', phone: '024-555-9999', email: 'sarah@example.com',
        status: 'Completed', items: [{ itemId: 7, qty: 1 }, { itemId: 9, qty: 1 }],
        startDate: '2025-12-24', endDate: '2025-12-26', totalAmount: 3300, depositPaid: true
    }
];

export const FINANCIAL_TRENDS = [
    { month: 'Aug', revenue: 8500, orders: 12 },
    { month: 'Sep', revenue: 12000, orders: 18 },
    { month: 'Oct', revenue: 15500, orders: 25 },
    { month: 'Nov', revenue: 18000, orders: 30 },
    { month: 'Dec', revenue: 35000, orders: 55 },
    { month: 'Jan', revenue: 22000, orders: 40 },
];

export const CUSTOMER_SEGMENTS = [
    { name: 'Corporate', value: 35, color: '#0f172a' },
    { name: 'Weddings', value: 45, color: '#334155' },
    { name: 'Private Parties', value: 20, color: '#94a3b8' },
];

export const CUSTOMERS = [
    { id: 1, name: 'Kwame Mensah', phone: '024-455-1234', email: 'kwame@example.com', totalOrders: 5, totalSpent: 12500, lastOrder: '2026-02-15' },
    { id: 2, name: 'Ama Osei', phone: '050-999-8888', email: 'ama.o@example.com', totalOrders: 2, totalSpent: 2000, lastOrder: '2026-01-20' },
    { id: 3, name: 'Legacy Events', phone: '020-777-6666', email: 'info@legacyevents.gh', totalOrders: 15, totalSpent: 85000, lastOrder: '2026-01-18' },
    { id: 4, name: 'John Doe', phone: '055-123-4567', email: 'johnd@example.com', totalOrders: 1, totalSpent: 5000, lastOrder: '2026-01-10' },
    { id: 5, name: 'Sarah Smith', phone: '024-555-9999', email: 'sarah@example.com', totalOrders: 3, totalSpent: 7800, lastOrder: '2025-12-24' },
];
