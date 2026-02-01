import { User } from '@supabase/supabase-js';
import { InventoryItem, Order, Client, CartItem, PortalFormData, Metrics, Discount } from './index';

export interface BusinessSettings {
  business_name: string;
  business_phone: string;
  business_email: string;
  business_location: string;
  maps_link: string;
  late_penalty?: string;
  tax_rate?: string;
}

export interface AppContextType {
  user: User | null;
  userRole: 'admin' | 'client' | null;
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
  showNotification: (msg: string, type?: string) => void;
  notification: { msg: string; type: string } | null;
  portalFormData: PortalFormData;
  setPortalFormData: React.Dispatch<React.SetStateAction<PortalFormData>>;
  submitOrder: (details: PortalFormData, discountCode?: string) => Promise<void>;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (details: PortalFormData) => Promise<void>;
  latePenaltyPerDay: number;
  setLatePenaltyPerDay: React.Dispatch<React.SetStateAction<number>>;
  taxRate: number;
  setTaxRate: React.Dispatch<React.SetStateAction<number>>;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (settings: BusinessSettings) => Promise<void>;
  checkAvailability: (start: string, end: string) => Promise<void>;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  modifyingOrderId: number | null;
  setModifyingOrderId: (id: number | null) => void;
  cancelModification: () => void;
  createOrderStep: 'none' | 'select-client' | 'shop' | 'review';
  setCreateOrderStep: React.Dispatch<React.SetStateAction<'none' | 'select-client' | 'shop' | 'review'>>;
}
