"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { InventoryItem, Order, Client, CartItem, PortalFormData, Metrics, Discount } from '../types';
import { BusinessSettings } from '../types/context';
import { calculateMetrics } from '../utils/helpers';
import { submitOrderToSupabase } from '../services/orderService';
import { fetchInventoryFromSupabase } from '../services/inventoryService';
import { fetchSettingsFromSupabase, updateSettingsInSupabase } from '../services/settingsService';
import { fetchDiscountsWithStats } from '../services/discountService';
import { getInventoryCached } from '../actions/inventory';
import { getClients, getClientProfileAction, updateClientProfileAction, getClientOrdersAction, OrderRecord } from '../actions/clients';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { encodeOrderId } from '../utils/idHandler';
import { getUserFriendlyErrorMessage } from '../utils/errorMapping';

export interface DataContextType {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  discounts: Discount[];
  setDiscounts: React.Dispatch<React.SetStateAction<Discount[]>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  metrics: Metrics;
  portalFormData: PortalFormData;
  setPortalFormData: React.Dispatch<React.SetStateAction<PortalFormData>>;
  submitOrder: (details: PortalFormData, discountCode?: string) => Promise<void>;
  loading: boolean;
  updateProfile: (details: PortalFormData) => Promise<void>;
  fetchData: (silent?: boolean) => Promise<void>;
  latePenaltyPerDay: number;
  setLatePenaltyPerDay: React.Dispatch<React.SetStateAction<number>>;
  taxRate: number;
  setTaxRate: React.Dispatch<React.SetStateAction<number>>;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (settings: BusinessSettings) => Promise<void>;
  checkAvailability: (start: string, end: string) => Promise<void>;
  modifyingOrderId: number | null;
  setModifyingOrderId: React.Dispatch<React.SetStateAction<number | null>>;
  cancelModification: () => void;
  createOrderStep: 'none' | 'select-client' | 'shop' | 'review';
  setCreateOrderStep: React.Dispatch<React.SetStateAction<'none' | 'select-client' | 'shop' | 'review'>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CART_VERSION = '1.1';
const CART_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, setUserRole } = useAuth();
  const { showNotification } = useUI();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [latePenaltyPerDay, setLatePenaltyPerDay] = useState(50);
  const [taxRate, setTaxRate] = useState(0);
  const [modifyingOrderId, setModifyingOrderId] = useState<number | null>(null);
  const [createOrderStep, setCreateOrderStep] = useState<'none' | 'select-client' | 'shop' | 'review'>('none');
  
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    business_name: '',
    business_phone: '',
    business_email: '',
    business_location: '',
    maps_link: ''
  });

  const [portalFormData, setPortalFormData] = useState<PortalFormData>({
      firstName: '', 
      lastName: '',
      username: '',
      phone: '', 
      email: '', 
      start: '', 
      end: '',
      discountCode: ''
  });

  // Load cart from local storage with versioning and expiry
  useEffect(() => {
      const savedCartStr = localStorage.getItem('carohans_cart');
      if (savedCartStr) {
          try {
              const savedCart = JSON.parse(savedCartStr);
              const now = Date.now();
              
              // Validate version and expiration
              if (
                savedCart.version === CART_VERSION && 
                savedCart.timestamp && 
                (now - savedCart.timestamp) < CART_EXPIRY_MS
              ) {
                  setCart(savedCart.items || []);
              } else {
                  console.log("Stale or old version cart invalidated");
                  localStorage.removeItem('carohans_cart');
              }
          } catch (e) {
              console.error("Failed to load cart", e);
              localStorage.removeItem('carohans_cart');
          }
      }
  }, []);

  // Save cart to local storage with metadata
  useEffect(() => {
      const cartToSave = {
          version: CART_VERSION,
          timestamp: Date.now(),
          items: cart
      };
      localStorage.setItem('carohans_cart', JSON.stringify(cartToSave));
  }, [cart]);

  const fetchOrders = useCallback(async (role?: 'admin' | 'client', email?: string, clientId?: number) => {
    let ordersData: OrderRecord[] = [];

    if (role === 'client' && clientId) {
      // Securely fetch via server action for custom sessions (bypasses RLS)
      const result = await getClientOrdersAction(clientId);
      if (result.success) {
        ordersData = result.data || [];
      }
    } else {
      // Admin or standard Supabase user
      let query = supabase
        .from('orders')
        .select(`
          id, client_id, client_name, phone, email, status, start_date, end_date, total_amount, amount_paid, 
          penalty_amount, deposit_paid, closed_at, return_status, item_integrity, 
          discount_name, discount_type, discount_value,
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

      if (role === 'client' && email) {
        query = query.eq('email', email);
      }

      const { data, error } = await query;
      if (!error) {
        ordersData = (data as unknown) as OrderRecord[] || [];
      }
    }

    if (ordersData.length >= 0) {
      const today = new Date().toISOString().split('T')[0] ?? '';
      const mapped: Order[] = ordersData.map(o => {
        let status = o.status;
        
        // Auto-transition: If Approved and pickup date is reached, treat as Active
        if (status === 'Approved' && o.start_date <= today) {
          status = 'Active';
        }

        return {
          id: o.id,
          publicId: encodeOrderId(o.id),
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
          discountName: o.discount_name,
          discountType: o.discount_type,
          discountValue: Number(o.discount_value || 0),
          items: o.order_items.map((oi: { inventory_id: number; quantity: number; unit_price: number; returned_qty?: number; lost_qty?: number; damaged_qty?: number }) => ({
            inventoryId: oi.inventory_id,
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
        if (settings && Object.keys(settings).length > 0) {
            setBusinessSettings(prev => ({ 
              ...prev, 
              business_name: settings.business_name || '',
              business_phone: settings.business_phone || '',
              business_email: settings.business_email || '',
              business_location: settings.business_location || '',
              maps_link: settings.maps_link || '',
              late_penalty: settings.late_penalty || '',
              tax_rate: settings.tax_rate || ''
            }));
            
            if (settings.late_penalty) {
                setLatePenaltyPerDay(Number(settings.late_penalty));
            }
            if (settings.tax_rate) {
                setTaxRate(Number(settings.tax_rate));
            }
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }

      let currentRole: 'admin' | 'client' | undefined = undefined;

      let emailForOrders = user?.email;
      let clientIdForOrders: number | undefined = undefined;

      if (user) {
          // Fetch Role
          const role = user.user_metadata?.role || 'client'; // Default to client if metadata present
          currentRole = role as 'admin' | 'client';
          
          if (!currentRole && user.id) {
               // Fallback to Supabase Profile check if not in metadata
               const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
               currentRole = profile?.role as 'admin' | 'client';
          }
          
          setUserRole(currentRole);

          // If client, pre-fill portal form data
          if (currentRole === 'client') {
              const clientId = user.user_metadata?.clientId;
              
              let client;
              
              if (clientId) {
                  // Custom session - Use server action for bypass RLS
                  const result = await getClientProfileAction(clientId);
                  if (result.success) client = result.data;
              } else {
                  // Standard Supabase Auth
                  const { data, error } = await supabase
                    .from('clients')
                    .select('id, first_name, last_name, username, phone, email, address, image, color')
                    .eq('user_id', user.id)
                    .single();
                  if (!error) client = data;
              }
              
              if (client) {
                  emailForOrders = client.email || emailForOrders; // PRIORITIZE client record email
                  clientIdForOrders = client.id;
                  setPortalFormData(prev => ({
                      ...prev,
                      firstName: client.first_name || '',
                      lastName: client.last_name || '',
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
      const [invData, clientData, discountData] = await Promise.all([
          getInventoryCached(),
          getClients(),
          fetchDiscountsWithStats(),
          fetchOrders(currentRole, emailForOrders, clientIdForOrders) // Updates internal state directly
      ]);
      
      setInventory(invData);
      setClients(clientData);
      setDiscounts(discountData);

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
          setDiscounts([]);
          setCart([]);
          setModifyingOrderId(null);
          setPortalFormData({
              firstName: '', 
              lastName: '',
              username: '',
              phone: '', 
              email: '', 
              start: '', 
              end: '',
              discountCode: ''
          });
          localStorage.removeItem('carohans_cart');
      }
  }, [user, fetchData]);

  const metrics = useMemo(() => calculateMetrics(orders) as Metrics, [orders]);

  const submitOrder = async (details: PortalFormData, discountCode?: string) => {
    try {
      await submitOrderToSupabase(details, cart, inventory, modifyingOrderId, discountCode);
      const wasModifying = !!modifyingOrderId;
      setCart([]);
      setModifyingOrderId(null);
      showNotification(wasModifying ? "Order Updated Successfully!" : "Order Request Sent!", "success");
      await fetchData();
    } catch (error) {
      console.error('Error submitting order:', error);
      showNotification(getUserFriendlyErrorMessage(error, "Order"), "error");
    }
  };

  const updateProfile = async (details: PortalFormData) => {
      try {
          if (!user) return;
          
          const clientId = user.user_metadata?.clientId;
          const result = await updateClientProfileAction({ clientId, userId: user.id }, details);
          
          if (!result.success) throw new Error(result.error);
          
          showNotification("Profile updated successfully!");
          await fetchData();
      } catch (error) {
          console.error('Error updating profile:', error);
          showNotification(getUserFriendlyErrorMessage(error, "Profile update"), "error");
      }
  };

  const updateBusinessSettings = async (settings: BusinessSettings) => {
      try {
          await updateSettingsInSupabase(settings);
          setBusinessSettings(settings);
          if (settings.late_penalty) {
            setLatePenaltyPerDay(Number(settings.late_penalty));
          }
          if (settings.tax_rate) {
            setTaxRate(Number(settings.tax_rate));
          }
          showNotification("Business settings updated!");
      } catch (error) {
          console.error('Error updating business settings:', error);
          showNotification("Failed to update settings", "error");
      }
  };

  const checkAvailability = async (start: string, end: string) => {
      try {
          setLoading(true);
          const data = await fetchInventoryFromSupabase(start, end);
          setInventory(data);
      } catch (error) {
          console.error('Error checking availability:', error);
          showNotification("Failed to check availability", "error");
      } finally {
          setLoading(false);
      }
  };

  const cancelModification = () => {
      setModifyingOrderId(null);
      setCart([]);
      setPortalFormData(prev => ({ ...prev, start: '', end: '', discountCode: '' }));
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
        discounts,
        setDiscounts,
        cart,
        setCart,
        metrics,
        portalFormData,
        setPortalFormData,
        submitOrder,
        loading,
        updateProfile,
        fetchData,
        latePenaltyPerDay,
        setLatePenaltyPerDay,
        taxRate,
        setTaxRate,
        businessSettings,
        updateBusinessSettings,
        checkAvailability,
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