"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { INVENTORY, ORDERS, CUSTOMERS } from '../lib/mockData';
import { calculateMetrics } from '../utils/helpers';
import { InventoryItem, Order, Customer, CartItem, PortalFormData, Metrics } from '../types';
import { createOrder } from '../services/orderService';

interface AppContextType {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  metrics: Metrics;
  showNotification: (msg: string, type?: string) => void;
  notification: { msg: string; type: string } | null;
  portalFormData: PortalFormData;
  setPortalFormData: React.Dispatch<React.SetStateAction<PortalFormData>>;
  submitOrder: (details: PortalFormData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(INVENTORY);
  const [orders, setOrders] = useState<Order[]>(ORDERS as Order[]);
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);
  const [portalFormData, setPortalFormData] = useState<PortalFormData>({ 
    name: 'Kwame Mensah', 
    phone: '024-455-1234', 
    email: 'kwame@example.com', 
    start: '', 
    end: '' 
  });

  const metrics = useMemo(() => calculateMetrics(orders) as Metrics, [orders]);

  const showNotification = (msg: string, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const submitOrder = (details: PortalFormData) => {
    const newOrder = createOrder(details, cart, inventory);
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