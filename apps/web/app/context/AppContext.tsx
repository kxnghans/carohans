"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { calculateMetrics } from '../utils/helpers';
import { InventoryItem, Order, Client, CartItem, PortalFormData, Metrics } from '../types';
import { submitOrderToSupabase } from '../services/orderService';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AppContextType {
  user: User | null;
  userRole: 'admin' | 'client' | null;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  metrics: Metrics;
  showNotification: (msg: string, type?: string) => void;
  notification: { msg: string; type: string } | null;
  portalFormData: PortalFormData;
  setPortalFormData: React.Dispatch<React.SetStateAction<PortalFormData>>;
  submitOrder: (details: PortalFormData) => Promise<void>;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (details: PortalFormData) => Promise<void>;
  latePenaltyPerDay: number;
  setLatePenaltyPerDay: React.Dispatch<React.SetStateAction<number>>;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (settings: BusinessSettings) => Promise<void>;
}

export interface BusinessSettings {
  business_name: string;
  business_phone: string;
  business_email: string;
  business_location: string;
  maps_link: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);
  const [latePenaltyPerDay, setLatePenaltyPerDay] = useState(50); // Default penalty
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    business_name: 'CaroHans Ventures',
    business_phone: '+233248298336',
    business_email: 'carohansv@gmail.com',
    business_location: 'Boundary Road, East Legon, on the opposite side across the street from Melcom',
    maps_link: 'https://maps.app.goo.gl/QVnRFvQJGUAKg4aWA?g_st=ic'
  });

  // Load cart from local storage on mount
  useEffect(() => {
      const savedCart = localStorage.getItem('carohans_cart');
      if (savedCart) {
          try {
              setCart(JSON.parse(savedCart));
          } catch (e) {
              console.error("Failed to load cart", e);
          }
      }
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
      localStorage.setItem('carohans_cart', JSON.stringify(cart));
  }, [cart]);

    const [portalFormData, setPortalFormData] = useState<PortalFormData>({
      firstName: '', 
      lastName: '',
      username: '',
      phone: '', 
      email: '', 
      start: '', 
      end: '' 
    });
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Fetch Business Settings
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData) {
          const settings: any = {};
          settingsData.forEach(s => settings[s.key] = s.value);
          if (Object.keys(settings).length > 0) {
              setBusinessSettings(prev => ({ ...prev, ...settings }));
          }
      }

      if (session?.user) {
          // Fetch Role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setUserRole(profile?.role as 'admin' | 'client');

          // If client, pre-fill portal form data
          if (profile?.role === 'client') {
              const { data: client } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              if (client) {
                  setPortalFormData(prev => ({
                      ...prev,
                      firstName: client.first_name || client.name?.split(' ')[0] || '',
                      lastName: client.last_name || client.name?.split(' ').slice(1).join(' ') || '',
                      username: client.username || '',
                      phone: client.phone || '',
                      email: client.email || '',
                      address: client.address || '',
                      image: client.image || '',
                      color: client.color || ''
                  }));
              }
          }
      }

      // Fetch Inventory (Public Read)
      const { data: invData } = await supabase.from('inventory').select('*').order('name');
      const mappedInventory: InventoryItem[] = (invData || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        stock: item.stock,
        price: item.price,
        replacementCost: item.replacement_cost,
        maintenance: item.maintenance,
        image: item.image,
        color: item.color
      }));
      setInventory(mappedInventory);

      // Fetch Clients (RBAC handled by RLS)
      const { data: clientData, error: clientError } = await supabase.from('clients').select('*').order('name');
      if (!clientError) {
          const mappedClients: Client[] = (clientData || []).map(c => ({
            id: c.id,
            firstName: c.first_name || c.name?.split(' ')[0] || '',
            lastName: c.last_name || c.name?.split(' ').slice(1).join(' ') || '',
            username: c.username || '',
            phone: c.phone || '',
            email: c.email || '',
            totalOrders: c.total_orders,
            totalSpent: Number(c.total_spent),
            lastOrder: c.last_order,
            image: c.image,
            color: c.color,
            address: c.address
          }));
          setClients(mappedClients);
      }

      // Fetch Orders (RBAC handled by RLS)
      const { data: ordData, error: ordError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            inventory_id,
            quantity,
            returned_qty,
            lost_qty,
            damaged_qty
          )
        `)
        .order('created_at', { ascending: false });

      if (!ordError) {
          const mappedOrders: Order[] = (ordData || []).map(o => ({
            id: o.id,
            clientName: o.client_name,
            phone: o.phone,
            email: o.email,
            status: o.status,
            startDate: o.start_date,
            endDate: o.end_date,
            totalAmount: Number(o.total_amount),
            amountPaid: Number(o.amount_paid || 0),
            penaltyAmount: Number(o.penalty_amount || 0),
            depositPaid: o.deposit_paid,
            closedAt: o.closed_at,
            returnStatus: o.return_status,
            itemIntegrity: o.item_integrity,
            items: o.order_items.map((oi: any) => ({
              itemId: oi.inventory_id,
              qty: oi.quantity,
              price: Number(oi.unit_price),
              returnedQty: oi.returned_qty,
              lostQty: oi.lost_qty,
              damagedQty: oi.damaged_qty
            }))
          }));
          setOrders(mappedOrders);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        if (!session) {
             // Clear state on logout
             setOrders([]);
             setClients([]);
             setUserRole(null);
        } else {
             fetchData(); // Refetch on login
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const metrics = useMemo(() => calculateMetrics(orders) as Metrics, [orders]);

  const showNotification = (msg: string, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const submitOrder = async (details: PortalFormData) => {
    try {
      await submitOrderToSupabase(details, cart, inventory);
      setCart([]);
      showNotification("Order Request Sent!");
      await fetchData();
    } catch (error) {
      console.error('Error submitting order:', error);
      showNotification("Failed to submit order", "error");
    }
  };

  const logout = async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
  };

  const updateProfile = async (details: PortalFormData) => {
      try {
          if (!user) return;
          
          const fullName = `${details.firstName} ${details.lastName}`.trim();

          const { error } = await supabase
            .from('clients')
            .update({
                name: fullName,
                first_name: details.firstName,
                last_name: details.lastName,
                username: details.username,
                phone: details.phone,
                email: details.email,
                address: details.address,
                image: details.image,
                color: details.color
            })
            .eq('user_id', user.id);
            
          if (error) throw error;
          
          showNotification("Profile updated successfully!");
          await fetchData(); // Refresh data
      } catch (error) {
          console.error('Error updating profile:', error);
          showNotification("Failed to update profile", "error");
      }
  };

  const updateBusinessSettings = async (settings: BusinessSettings) => {
      try {
          const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
          const { error } = await supabase.from('settings').upsert(updates);
          if (error) throw error;
          setBusinessSettings(settings);
          showNotification("Business settings updated!");
      } catch (error) {
          console.error('Error updating business settings:', error);
          showNotification("Failed to update settings", "error");
      }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userRole,
        inventory,
        setInventory,
        orders,
        setOrders,
        clients,
        setClients,
        cart,
        setCart,
        metrics,
        showNotification,
        notification,
        portalFormData,
        setPortalFormData,
        submitOrder,
        loading,
        logout,
        updateProfile,
        latePenaltyPerDay,
        setLatePenaltyPerDay,
        businessSettings,
        updateBusinessSettings
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