"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { InventoryItem, Order, Client, CartItem, PortalFormData, Metrics } from '../types';
import { BusinessSettings } from '../types/context';
import { calculateMetrics } from '../utils/helpers';
import { submitOrderToSupabase } from '../services/orderService';
import { fetchInventoryFromSupabase } from '../services/inventoryService';
import { fetchClientsFromSupabase, updateClientProfile as updateClientProfileService } from '../services/clientService';
import { fetchSettingsFromSupabase, updateSettingsInSupabase } from '../services/settingsService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';

export interface DataContextType {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  metrics: Metrics;
  portalFormData: PortalFormData;
  setPortalFormData: React.Dispatch<React.SetStateAction<PortalFormData>>;
  submitOrder: (details: PortalFormData) => Promise<void>;
  loading: boolean;
  updateProfile: (details: PortalFormData) => Promise<void>;
  latePenaltyPerDay: number;
  setLatePenaltyPerDay: React.Dispatch<React.SetStateAction<number>>;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (settings: BusinessSettings) => Promise<void>;
  modifyingOrderId: number | null;
  setModifyingOrderId: React.Dispatch<React.SetStateAction<number | null>>;
  cancelModification: () => void;
  createOrderStep: 'none' | 'select-client' | 'shop' | 'review';
  setCreateOrderStep: React.Dispatch<React.SetStateAction<'none' | 'select-client' | 'shop' | 'review'>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, setUserRole } = useAuth();
  const { showNotification } = useUI();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [latePenaltyPerDay, setLatePenaltyPerDay] = useState(50);
  const [modifyingOrderId, setModifyingOrderId] = useState<number | null>(null);
  const [createOrderStep, setCreateOrderStep] = useState<'none' | 'select-client' | 'shop' | 'review'>('none');
  
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    business_name: 'CaroHans Ventures',
    business_phone: '+233248298336',
    business_email: 'carohansv@gmail.com',
    business_location: 'Boundary Road, East Legon, on the opposite side across the street from Melcom',
    maps_link: 'https://maps.app.goo.gl/QVnRFvQJGUAKg4aWA?g_st=ic'
  });

  const [portalFormData, setPortalFormData] = useState<PortalFormData>({
      firstName: '', 
      lastName: '',
      username: '',
      phone: '', 
      email: '', 
      start: '', 
      end: '' 
  });

  // Load cart from local storage
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

  // Save cart to local storage
  useEffect(() => {
      localStorage.setItem('carohans_cart', JSON.stringify(cart));
  }, [cart]);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          inventory_id,
          quantity,
          unit_price,
          returned_qty,
          lost_qty,
          damaged_qty
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      const today = new Date().toISOString().split('T')[0] ?? '';
      const mapped: Order[] = (data || []).map(o => {
        let status = o.status;
        
        // Auto-transition: If Approved and pickup date is reached, treat as Active
        if (status === 'Approved' && o.start_date <= today) {
          status = 'Active';
        }

        return {
          id: o.id,
          clientName: o.client_name,
          phone: o.phone,
          email: o.email,
          status: status,
          startDate: o.start_date,
          endDate: o.end_date,
          totalAmount: Number(o.total_amount),
          amountPaid: Number(o.amount_paid || 0),
          penaltyAmount: Number(o.penalty_amount || 0),
          depositPaid: o.deposit_paid,
          closedAt: o.closed_at,
          returnStatus: o.return_status,
          itemIntegrity: o.item_integrity,
          items: o.order_items.map((oi: { inventory_id: number; quantity: number; unit_price: number; returned_qty?: number; lost_qty?: number; damaged_qty?: number }) => ({
            itemId: oi.inventory_id,
            qty: oi.quantity,
            price: Number(oi.unit_price),
            returnedQty: oi.returned_qty,
            lostQty: oi.lost_qty,
            damagedQty: oi.damaged_qty
          }))
        };
      });
      setOrders(mapped);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch Settings
      try {
        const settings = await fetchSettingsFromSupabase();
        if (Object.keys(settings).length > 0) {
            setBusinessSettings(prev => ({ ...prev, ...settings }));
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }

      if (user) {
          // Fetch Role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(profile?.role as 'admin' | 'client');

          // If client, pre-fill portal form data
          if (profile?.role === 'client') {
              const { data: client } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
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

      // Parallel fetch
      const [invData, clientData] = await Promise.all([
          fetchInventoryFromSupabase(),
          fetchClientsFromSupabase(),
          fetchOrders() // Updates internal state directly
      ]);
      
      setInventory(invData);
      setClients(clientData);

    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [user, setUserRole, showNotification, fetchOrders]);

  // Re-fetch when user changes (login/logout)
  useEffect(() => {
      fetchData();
      if (!user) {
          setOrders([]);
          setClients([]);
          setCart([]);
          setModifyingOrderId(null);
          setPortalFormData({
              firstName: '', 
              lastName: '',
              username: '',
              phone: '', 
              email: '', 
              start: '', 
              end: '' 
          });
          localStorage.removeItem('carohans_cart');
      }
  }, [user, fetchData]);

  const metrics = useMemo(() => calculateMetrics(orders) as Metrics, [orders]);

  const submitOrder = async (details: PortalFormData) => {
    try {
      await submitOrderToSupabase(details, cart, inventory, modifyingOrderId);
      const wasModifying = !!modifyingOrderId;
      setCart([]);
      setModifyingOrderId(null);
      showNotification(wasModifying ? "Order Updated Successfully!" : "Order Request Sent!", "success");
      await fetchData();
    } catch (error) {
      console.error('Error submitting order:', error);
      showNotification("Failed to submit order", "error");
    }
  };

  const updateProfile = async (details: PortalFormData) => {
      try {
          if (!user) return;
          await updateClientProfileService(user.id, details);
          showNotification("Profile updated successfully!");
          await fetchData();
      } catch (error) {
          console.error('Error updating profile:', error);
          showNotification("Failed to update profile", "error");
      }
  };

  const updateBusinessSettings = async (settings: BusinessSettings) => {
      try {
          await updateSettingsInSupabase(settings);
          setBusinessSettings(settings);
          showNotification("Business settings updated!");
      } catch (error) {
          console.error('Error updating business settings:', error);
          showNotification("Failed to update settings", "error");
      }
  };

  const cancelModification = () => {
      setModifyingOrderId(null);
      setCart([]);
      setPortalFormData(prev => ({ ...prev, start: '', end: '' }));
      showNotification("Changes discarded", "info");
  };

  return (
    <DataContext.Provider
      value={{
        inventory,
        setInventory,
        orders,
        setOrders,
        clients,
        setClients,
        cart,
        setCart,
        metrics,
        portalFormData,
        setPortalFormData,
        submitOrder,
        loading,
        updateProfile,
        latePenaltyPerDay,
        setLatePenaltyPerDay,
        businessSettings,
        updateBusinessSettings,
        modifyingOrderId,
        setModifyingOrderId,
        cancelModification,
        createOrderStep,
        setCreateOrderStep
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
