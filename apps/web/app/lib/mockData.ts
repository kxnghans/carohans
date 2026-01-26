import { InventoryItem } from '../types';

export const INVENTORY: InventoryItem[] = [
    { id: 1, name: 'Gold Chiavari Chair', category: 'Chairs', stock: 120, price: 15, replacementCost: 150, maintenance: 0, image: '🪑', color: 'text-amber-500' },
    { id: 2, name: 'Round Table (10-seater)', category: 'Tables', stock: 20, price: 50, replacementCost: 400, maintenance: 0, image: '⚪', color: 'text-slate-400' },
    { id: 3, name: 'Premium Silverware Set', category: 'Cutlery', stock: 150, price: 5, replacementCost: 80, maintenance: 5, image: '🍴', color: 'text-slate-300' },
    { id: 4, name: 'Crystal Wine Glass', category: 'Glassware', stock: 200, price: 3, replacementCost: 45, maintenance: 0, image: '🍷', color: 'text-blue-400' },
    { id: 5, name: 'Decorative Flower Wall', category: 'Decor', stock: 2, price: 500, replacementCost: 1200, maintenance: 0, image: '🌸', color: 'text-pink-400' },
    { id: 6, name: 'Marquee Tent (Large)', category: 'Tents', stock: 5, price: 1000, replacementCost: 15000, maintenance: 1, image: '🎪', color: 'text-indigo-500' },
    { id: 7, name: 'LED Dance Floor', category: 'Flooring', stock: 4, price: 2500, replacementCost: 20000, maintenance: 1, image: '💃', color: 'text-purple-500' },
    { id: 8, name: 'Projector 4K', category: 'Electronics', stock: 3, price: 300, replacementCost: 3500, maintenance: 0, image: '📽️', color: 'text-slate-700' },
    { id: 9, name: 'Sound System (PA)', category: 'Electronics', stock: 2, price: 800, replacementCost: 5000, maintenance: 0, image: '🔊', color: 'text-slate-800' },
    { id: 10, name: 'Fairy Lights (100m)', category: 'Lighting', stock: 10, price: 150, replacementCost: 800, maintenance: 2, image: '✨', color: 'text-yellow-400' },
    { id: 11, name: 'Cocktail Table (High)', category: 'Tables', stock: 15, price: 40, replacementCost: 300, maintenance: 0, image: '🍸', color: 'text-slate-500' },
    { id: 12, name: 'Red Carpet (20m)', category: 'Decor', stock: 3, price: 200, replacementCost: 1000, maintenance: 5, image: '🟥', color: 'text-rose-600' },
    { id: 13, name: 'Chafing Dish Set', category: 'Catering', stock: 12, price: 60, replacementCost: 400, maintenance: 0, image: '🥘', color: 'text-orange-500' },
    { id: 14, name: 'Generator (Silent)', category: 'Power', stock: 2, price: 1200, replacementCost: 15000, maintenance: 1, image: '⚡', color: 'text-yellow-600' },
    { id: 15, name: 'V.I.P Sofa (White)', category: 'Furniture', stock: 6, price: 400, replacementCost: 2500, maintenance: 2, image: '🛋️', color: 'text-slate-400' },
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
    },
    {
        id: 106, customerName: 'Golden Tulip Hotel', phone: '030-222-3344', email: 'events@goldentulip.com',
        status: 'Pending', items: [{ itemId: 10, qty: 5 }, { itemId: 12, qty: 1 }, { itemId: 15, qty: 4 }],
        startDate: '2026-03-01', endDate: '2026-03-03', totalAmount: 4500, depositPaid: false
    },
    {
        id: 107, customerName: 'Kojo Antwi', phone: '027-555-4433', email: 'kojo@music.gh',
        status: 'Active', items: [{ itemId: 9, qty: 2 }, { itemId: 14, qty: 1 }],
        startDate: '2026-02-21', endDate: '2026-02-22', totalAmount: 2800, depositPaid: true
    },
    {
        id: 108, customerName: 'Accra City Council', phone: '030-111-0000', email: 'support@accracity.gov.gh',
        status: 'Approved', items: [{ itemId: 6, qty: 2 }, { itemId: 1, qty: 200 }],
        startDate: '2026-02-28', endDate: '2026-03-01', totalAmount: 5000, depositPaid: true
    },
    {
        id: 109, customerName: 'Wedding Planner Co.', phone: '054-321-9876', email: 'lisa@weddings.com',
        status: 'Overdue', items: [{ itemId: 5, qty: 1 }, { itemId: 4, qty: 100 }],
        startDate: '2026-02-10', endDate: '2026-02-12', totalAmount: 800, depositPaid: true
    },
    {
        id: 110, customerName: 'Church of Pentecost', phone: '023-444-5555', email: 'admin@cop.org',
        status: 'Completed', items: [{ itemId: 1, qty: 500 }, { itemId: 9, qty: 2 }],
        startDate: '2026-01-05', endDate: '2026-01-07', totalAmount: 9100, depositPaid: true
    }
];

export const FINANCIAL_TRENDS = [
    { month: 'Sep', revenue: 12000, orders: 18 },
    { month: 'Oct', revenue: 15500, orders: 25 },
    { month: 'Nov', revenue: 18000, orders: 30 },
    { month: 'Dec', revenue: 35000, orders: 55 },
    { month: 'Jan', revenue: 22000, orders: 40 },
    { month: 'Feb', revenue: 28500, orders: 48 },
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
