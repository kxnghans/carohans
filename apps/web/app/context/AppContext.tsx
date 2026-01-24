"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { INVENTORY, ORDERS, CUSTOMERS } from '../lib/mockData';
import { calculateMetrics } from '../utils/helpers';

interface PortalFormData {
  name: string;
  phone: string;
  email: string;
  start: string;
  end: string;
}

interface AppContextType {
  inventory: typeof INVENTORY;
  setInventory: React.Dispatch<React.SetStateAction<typeof INVENTORY>>;
  orders: typeof ORDERS;
  setOrders: React.Dispatch<React.SetStateAction<typeof ORDERS>>;
  customers: typeof CUSTOMERS;
  setCustomers: React.Dispatch<React.SetStateAction<typeof CUSTOMERS>>;
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  metrics: any;
  showNotification: (msg: string, type?: string) => void;
  notification: { msg: string; type: string } | null;
  portalFormData: PortalFormData;
  setPortalFormData: React.Dispatch<React.SetStateAction<PortalFormData>>;
  submitOrder: (details: PortalFormData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState(INVENTORY);
  const [orders, setOrders] = useState(ORDERS);
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [cart, setCart] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);
  const [portalFormData, setPortalFormData] = useState<PortalFormData>({ 
    name: 'Kwame Mensah', 
    phone: '024-455-1234', 
    email: 'kwame@example.com', 
    start: '', 
    end: '' 
  });

  const metrics = useMemo(() => calculateMetrics(orders), [orders]);

  const showNotification = (msg: string, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const submitOrder = (details: PortalFormData) => {
    const newOrder = {
      id: Math.floor(Math.random() * 10000),
      customerName: details.name,
      phone: details.phone,
      email: details.email || 'no-email@provided.com',
      status: 'Pending',
      items: cart.map(i => ({ itemId: i.id, qty: i.qty })),
      startDate: details.start,
      endDate: details.end,
      totalAmount: cart.reduce((sum, i) => sum + (i.price * i.qty * 2), 0),
      depositPaid: false
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    showNotification("Order Request Sent!");
  };

  return (
    <AppContext.Provider
      value={{
        inventory,
        setInventory,
        orders,
        setOrders,
        customers,
        setCustomers,
        cart,
        setCart,
        metrics,
        showNotification,
        notification,
        portalFormData,
        setPortalFormData,
        submitOrder
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}