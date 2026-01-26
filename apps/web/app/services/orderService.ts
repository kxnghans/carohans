import { Order, PortalFormData, CartItem, InventoryItem } from '../types';

export const createOrder = (
    details: PortalFormData, 
    cart: CartItem[], 
    inventory: InventoryItem[]
): Order => {
    return {
        id: Math.floor(Math.random() * 10000),
        customerName: details.name,
        phone: details.phone,
        email: details.email || 'no-email@provided.com',
        status: 'Pending',
        items: cart.map(i => ({ itemId: i.id, qty: i.qty })),
        startDate: details.start,
        endDate: details.end,
        totalAmount: cart.reduce((sum, i) => {
            const item = inventory.find(inv => inv.id === i.id);
            const price = item?.price || 0;
            // Assuming 2 days rental multiplier as per original logic
            return sum + (price * i.qty * 2);
        }, 0),
        depositPaid: false
    };
};
