"use client";

import React, { useState, useMemo } from 'react';
import {
  Users, Calendar as CalendarIcon, DollarSign,
  ShoppingCart, LogOut, Search,
  ClipboardList, Truck, AlertOctagon,
  ChevronRight, ChevronLeft, Trash2, Plus, Minus,
  FileText, TrendingUp, PieChart as PieChartIcon, BarChart2,
  AlertTriangle, Printer, X, LayoutDashboard,
  ArrowUpRight, ArrowDownRight, Package, CreditCard,
  Edit2, Check, User, Phone, Mail, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { INVENTORY, ORDERS, FINANCIAL_TRENDS, CUSTOMER_SEGMENTS, CUSTOMERS } from './lib/mockData';

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount: number) => `¢${amount.toLocaleString()}`;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Active': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Overdue': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

// --- CALCULATED METRICS ---
const calculateMetrics = (orders: typeof ORDERS) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const activeRentals = orders.filter(o => o.status === 'Active').length;
  const pendingRequests = orders.filter(o => o.status === 'Pending').length;
  const overdueRentals = orders.filter(o => o.status === 'Overdue').length;
  const completedRentals = orders.filter(o => o.status === 'Completed').length;
  const avgOrderValue = totalRevenue / (orders.length || 1);
  const revenueGrowth = 12.5;
  return { totalRevenue, activeRentals, pendingRequests, overdueRentals, completedRentals, revenueGrowth, avgOrderValue };
};

// --- COMPONENTS ---

const Card = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden ${className}`}>
    <div className={noPadding ? "" : "p-6"}>{children}</div>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }: any) => {
  const baseStyle = "font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
  };
  const sizes: any = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-4 text-base"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, subtext, trend, icon: Icon, color }: any) => (
  <Card className="relative overflow-hidden group hover:shadow-md transition-all">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon className="w-16 h-16" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-slate-700`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2 mt-4">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend && (
          <span className={`flex items-center font-bold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend)}%
          </span>
        )}
        <span className="text-slate-400">{subtext}</span>
      </div>
    </div>
  </Card>
);

const FilterCard = ({ title, count, status, active, onClick, color, icon: Icon }: any) => (
  <button
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 text-left w-full group ${active
      ? 'bg-slate-900 border-slate-900 shadow-xl scale-[1.02]'
      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
  >
    <div className="p-5 relative z-10 flex flex-col h-full justify-between min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {status}
        </div>
      </div>
      <div>
        <h3 className={`text-3xl font-bold mb-1 ${active ? 'text-white' : 'text-slate-900'}`}>{count}</h3>
        <p className={`text-sm font-medium ${active ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
      </div>
    </div>
    {/* Decorative gradient blob */}
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${color}`}></div>
  </button>
);

const CalendarModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Availability Calendar</h2>
            <p className="text-slate-400 text-sm">Manage blackout dates & view schedules</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">February 2026</h3>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="secondary" size="sm"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => {
              const day = i + 1;
              const hasEvent = [15, 16, 20].includes(day);
              const isBlocked = [5, 12, 19, 26].includes(day); // Maintenance sundays

              return (
                <button
                  key={i}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative group
                    ${isBlocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:bg-slate-50 hover:shadow-inner border border-transparent hover:border-slate-200'}
                    ${hasEvent ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : ''}
                  `}
                >
                  <span>{day}</span>
                  {hasEvent && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></div>}
                  {isBlocked && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1"></div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary">Block Selected Dates</Button>
        </div>
      </div>
    </div>
  );
};

const InvoiceModal = ({ isOpen, onClose, cart, customer, onConfirm, total }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg"><Printer className="w-5 h-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Review Invoice</h2>
              <p className="text-slate-400 text-sm">Draft Order for {customer?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-between mb-8 border-b border-slate-100 pb-8">
            <div>
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Bill To</h3>
              <p className="font-bold text-lg text-slate-900">{customer?.name}</p>
              <p className="text-slate-500 text-sm">{customer?.email}</p>
              <p className="text-slate-500 text-sm">{customer?.phone}</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Invoice Details</h3>
              <p className="font-bold text-slate-900">#{Math.floor(Math.random() * 10000)}</p>
              <p className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">Draft</p>
            </div>
          </div>

          <table className="w-full text-left mb-8">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-xs font-bold text-slate-500 uppercase">Item</th>
                <th className="py-2 text-xs font-bold text-slate-500 uppercase text-center">Qty</th>
                <th className="py-2 text-xs font-bold text-slate-500 uppercase text-right">Price/Day</th>
                <th className="py-2 text-xs font-bold text-slate-500 uppercase text-right">Total (2 Days)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cart.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-4">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.category}</p>
                  </td>
                  <td className="py-4 text-center font-bold text-slate-700">{item.qty}</td>
                  <td className="py-4 text-right text-slate-600">{formatCurrency(item.price)}</td>
                  <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(item.price * item.qty * 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-1/2 space-y-3">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (0%)</span>
                <span>¢0.00</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-900 pt-4 border-t border-slate-200">
                <span>Total Due</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Continue Editing</Button>
          <Button onClick={onConfirm} variant="success"><Check className="w-4 h-4 mr-2" /> Confirm & Place Order</Button>
        </div>
      </div>
    </div>
  );
};

const CustomerSelector = ({ customers, onSelect, onClose }: any) => {
  const [search, setSearch] = useState('');
  const filtered = customers.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Select Customer</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-900" /></button>
        </div>
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-indigo-500 transition-all font-medium"
              placeholder="Search by name or phone..."
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {filtered.map((c: any) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="w-full text-left p-3 hover:bg-indigo-50 hover:border-indigo-100 border border-transparent rounded-xl transition-all group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-indigo-700">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone} • {c.email}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p>No customers found.</p>
              <Button variant="secondary" size="sm" className="mt-2">Create New Customer</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- INVENTORY TABLE COMPONENT ---
const InventoryTable = ({
  data,
  isAdmin = false,
  setInventory,
  onAddToCart,
  cart
}: {
  data: typeof INVENTORY,
  isAdmin?: boolean,
  setInventory?: any,
  onAddToCart?: (item: any, qty: number) => void,
  cart?: any
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  // No local clientCounts - controlled component now

  const handleEditClick = (item: any) => {
    if (!isAdmin) return;
    setEditingId(item.id);
    setEditValues(item);
  };

  const handleSave = () => {
    if (setInventory) {
      setInventory((prev: any) => prev.map((item: any) => item.id === editingId ? editValues : item));
    }
    setEditingId(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setEditValues({ ...editValues, [field]: value });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-200">
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">Details</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Daily Rate</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Repl. Cost</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Order</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(item => {
            const isEditing = editingId === item.id;

            return (
              <tr
                key={item.id}
                className={`group transition-colors ${isEditing ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
              >
                <td className="p-4 pl-6" onClick={() => !isEditing && handleEditClick(item)}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{item.image}</div>
                    {isEditing ? (
                      <input
                        className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
                        value={editValues.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className={`font-bold text-slate-900 ${isAdmin ? 'cursor-pointer hover:text-indigo-600 hover:underline decoration-dashed decoration-slate-300 decoration-1 underline-offset-4' : ''}`}>
                        {item.name}
                      </span>
                    )}
                  </div>
                </td>

                <td className="p-4" onClick={() => !isEditing && handleEditClick(item)}>
                  {isEditing ? (
                    <input
                      className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
                      value={editValues.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    />
                  ) : (
                    <span className="text-sm text-slate-500">{item.category}</span>
                  )}
                </td>

                <td className="p-4 text-right" onClick={() => !isEditing && handleEditClick(item)}>
                  {isEditing ? (
                    <input
                      className="border border-slate-300 rounded px-2 py-1 text-sm w-20 text-right"
                      type="number"
                      value={editValues.price}
                      onChange={(e) => handleInputChange('price', Number(e.target.value))}
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-700">{formatCurrency(item.price)}</span>
                  )}
                </td>

                <td className="p-4 text-right" onClick={() => !isEditing && handleEditClick(item)}>
                  {isEditing ? (
                    <input
                      className="border border-slate-300 rounded px-2 py-1 text-sm w-20 text-right"
                      type="number"
                      value={editValues.replacementCost}
                      onChange={(e) => handleInputChange('replacementCost', Number(e.target.value))}
                    />
                  ) : (
                    <span className="text-sm font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded inline-block">{formatCurrency(item.replacementCost)}</span>
                  )}
                </td>

                <td className="p-4 text-center" onClick={() => !isEditing && handleEditClick(item)}>
                  {isEditing ? (
                    <input
                      className="border border-slate-300 rounded px-2 py-1 text-sm w-16 text-center"
                      type="number"
                      value={editValues.stock}
                      onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                    />
                  ) : (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${item.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                      {item.stock}
                    </span>
                  )}
                </td>

                {/* THE ORDER COLUMN */}
                <td className="p-4 text-center">
                  {isEditing ? (
                    <div className="flex justify-center gap-2">
                      <button onClick={handleSave} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onAddToCart && onAddToCart(item, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        disabled={!cart?.find((c: any) => c.id === item.id)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        className="w-16 text-center text-sm font-bold bg-white border border-slate-200 rounded-md focus:outline-indigo-500 py-1"
                        value={cart?.find((c: any) => c.id === item.id)?.qty || 0}
                        onChange={(e) => {
                          const newVal = parseInt(e.target.value) || 0;
                          const currentVal = cart?.find((c: any) => c.id === item.id)?.qty || 0;
                          const delta = newVal - currentVal;
                          if (delta !== 0 && onAddToCart) onAddToCart(item, delta);
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                      <button
                        onClick={() => onAddToCart && onAddToCart(item, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const OrderAdminCard = ({ order, updateStatus }: any) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-900">#{order.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)} font-bold uppercase tracking-wider`}>
              {order.status}
            </span>
          </div>
          <h4 className="font-bold text-lg">{order.customerName}</h4>
          <p className="text-sm text-slate-500">{order.startDate} • {order.items.length} Items</p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center">
          <Button variant="secondary" size="sm">
            <Printer className="w-4 h-4 mr-2" /> Invoice
          </Button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 hover:bg-slate-100 rounded-full transition-transform"
          >
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="bg-slate-50 p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Order Items</h5>
              <div className="space-y-2 mb-6">
                {order.items.map((item: any, idx: number) => {
                  // Start of rudimentary item lookup - ideally pass inventory
                  const itemName = INVENTORY.find(i => i.id === item.itemId)?.name || 'Unknown Item';
                  return (
                    <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded border border-slate-200">
                      <span className="font-medium text-slate-700">{itemName}</span>
                      <span className="font-mono text-slate-500">x{item.qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Actions</h5>
              <div className="flex flex-wrap gap-2">
                {order.status === 'Pending' && (
                  <>
                    <Button variant="success" size="sm" onClick={() => updateStatus(order.id, 'Approved')}>Approve</Button>
                    <Button variant="danger" size="sm" onClick={() => updateStatus(order.id, 'Rejected')}>Reject</Button>
                  </>
                )}
                {order.status === 'Approved' && (
                  <Button variant="primary" size="sm" onClick={() => updateStatus(order.id, 'Active')}>Dispatch</Button>
                )}
                {(order.status === 'Active' || order.status === 'Overdue') && (
                  <Button variant="primary" size="sm" onClick={() => updateStatus(order.id, 'Completed')}>
                    Process Return
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CUSTOMERS TABLE COMPONENT ---
const CustomersTable = ({ data }: { data: typeof CUSTOMERS }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/50 border-b border-slate-200">
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">Customer</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Orders</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Lifetime Spent</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Last Order</th>
          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {data.map(customer => (
          <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
            <td className="p-4 pl-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                  {customer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{customer.name}</span>
                  <span className="text-xs text-slate-400">ID: #{customer.id}</span>
                </div>
              </div>
            </td>
            <td className="p-4">
              <div className="text-sm text-slate-600">{customer.email}</div>
              <div className="text-xs text-slate-400">{customer.phone}</div>
            </td>
            <td className="p-4 text-center">
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                {customer.totalOrders}
              </span>
            </td>
            <td className="p-4 text-right font-medium text-slate-900">
              {formatCurrency(customer.totalSpent)}
            </td>
            <td className="p-4 text-right text-sm text-slate-500">
              {customer.lastOrder}
            </td>
            <td className="p-4 text-center">
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                <FileText className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- CLIENT PORTAL COMPONENT ---

const ClientPortal = ({ inventory, cartCount, addToCart, submitOrder, activeTab, setActiveTab, orders, setCart, cart }: any) => {
  const [formData, setFormData] = useState({ name: 'Kwame Mensah', phone: '024-455-1234', email: 'kwame@example.com', start: '', end: '' });
  const [showInvoice, setShowInvoice] = useState(false);

  // Determine if checkout is allowed (dates selected + items in cart)
  const canCheckout = formData.start && formData.end && cartCount > 0;

  return (
    <div className="space-y-6">
      {/* CLIENT HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'inventory', label: 'Catalog', icon: Package },
            { id: 'orders', label: 'My Orders', icon: ClipboardList },
            { id: 'profile', label: 'Profile', icon: User },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                    ${activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}
                  `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowInvoice(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${canCheckout ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          disabled={!canCheckout}
        >
          <ShoppingCart className="w-4 h-4" />
          Review Order
          {cartCount > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{cartCount}</span>}
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Rental Catalog</h2>
              <p className="text-slate-500">Use the <span className="font-bold text-slate-700">Order</span> column to add items to your cart.</p>
            </div>

            {/* INLINE DATE SELECTION */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase px-2">Pickup</label>
                <input
                  type="date"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                  value={formData.start}
                  onChange={e => setFormData({ ...formData, start: e.target.value })}
                />
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase px-2">Return</label>
                <input
                  type="date"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                  value={formData.end}
                  onChange={e => setFormData({ ...formData, end: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Card noPadding>
            <InventoryTable
              data={inventory}
              isAdmin={false} // READ ONLY except for order column
              onAddToCart={addToCart}
              cart={cart}
            />
          </Card>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="animate-in fade-in duration-500 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">My Rental History</h2>
          {orders.filter((o: any) => o.customerName === 'Kwame Mensah').length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No orders found.</p>
            </div>
          ) : (
            orders.filter((o: any) => o.customerName === 'Kwame Mensah').map((order: any) => (
              <Card key={order.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)} font-bold uppercase`}>
                      {order.status}
                    </span>
                    <h3 className="font-bold mt-1">Order #{order.id}</h3>
                    <p className="text-sm text-slate-500">{order.startDate} - {order.endDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-slate-400">{order.items.length} items</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto animate-in fade-in duration-500">
          <Card className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Kwame Mensah</h2>
                <p className="text-slate-500">Client Account</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg" defaultValue="024-455-1234" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg" defaultValue="kwame@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Default Delivery Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <textarea className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-24" defaultValue="12 Independence Avenue, Accra, Ghana" />
                </div>
              </div>
              <Button className="w-full">Update Profile</Button>
            </div>
          </Card>
        </div>
      )}

      {/* CHECKOUT TAB REMOVED - REPLACED BY INVOICE MODAL */}

      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        cart={cart}
        customer={{ name: formData.name, email: formData.email, phone: formData.phone }}
        total={cart.reduce((sum: number, i: any) => sum + (i.price * i.qty * 2), 0)}
        onConfirm={() => {
          submitOrder(formData);
          setShowInvoice(false);
        }}
      />
    </div>
  );
};

// --- MAIN APP ---

export default function CaroHansApp() {
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [activeTab, setActiveTab] = useState('overview'); // Default admin tab
  const [clientTab, setClientTab] = useState('inventory'); // Default client tab

  const [inventory, setInventory] = useState(INVENTORY);
  const [orders, setOrders] = useState(ORDERS);
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [cart, setCart] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ msg: string, type: string } | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // POS State
  const [createOrderStep, setCreateOrderStep] = useState<'none' | 'select-customer' | 'shop' | 'review'>('none');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posDates, setPosDates] = useState({ start: '', end: '' });
  const [orderFilter, setOrderFilter] = useState('All');

  // Stats
  const metrics = useMemo(() => calculateMetrics(orders), [orders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'All') return orders;
    return orders.filter(o => o.status === orderFilter);
  }, [orders, orderFilter]);

  const showNotification = (msg: string, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToPosCart = (item: any, qty: number) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
      }
      if (qty > 0) return [...prev, { ...item, qty }];
      return prev;
    });
  };

  const submitAdminOrder = () => {
    if (!selectedCustomer) return;
    const newOrder = {
      id: Math.floor(Math.random() * 10000),
      customerName: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email,
      status: 'Approved', // Auto-approved since admin created it
      items: posCart.map(i => ({ itemId: i.id, qty: i.qty })),
      startDate: posDates.start || '2026-02-25',
      endDate: posDates.end || '2026-02-27',
      totalAmount: posCart.reduce((sum, i) => sum + (i.price * i.qty * 2), 0),
      depositPaid: false
    };
    setOrders([newOrder, ...orders]);
    setPosCart([]);
    setSelectedCustomer(null);
    setPosDates({ start: '', end: '' });
    setCreateOrderStep('none');
    setOrderFilter('All');
    showNotification("Order Created Successfully!");
  };

  const addToCartInternal = (item: any, qty: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
      }
      if (qty > 0) return [...prev, { ...item, qty }];
      return prev;
    });
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showNotification(`Order #${orderId} marked as ${newStatus}`);
  };

  const submitOrder = (details: any) => {
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
    setOrders([newOrder, ...orders]);
    setCart([]);
    showNotification("Order Request Sent!");
    setClientTab('orders'); // Redirect to orders after submission
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-4xl w-full z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide uppercase">
              v2.0 Beta
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-none">
              Rental <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Intelligence.</span>
            </h1>
            <p className="text-slate-500 text-xl max-w-md leading-relaxed">
              CaroHans Enterprise Resource Management System. Manage inventory, track rentals, and analyze growth.
            </p>
          </div>

          <div className="grid gap-4 w-full max-w-md mx-auto">
            <button
              onClick={() => { setUserRole('client'); setClientTab('inventory'); }}
              className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShoppingCart className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Client Portal</h3>
                  <p className="text-slate-500 text-sm">Browse catalog & Request items</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => { setUserRole('admin'); setActiveTab('overview'); }}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <LayoutDashboard className="w-24 h-24 text-white" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-14 w-14 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                  <LayoutDashboard className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Admin Dashboard</h3>
                  <p className="text-slate-400 text-sm">Internal operations & Analytics</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-slate-200">
              CH
            </div>
            <div className="hidden md:block">
              <span className="font-bold text-lg tracking-tight block leading-none">CaroHans</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ventures</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userRole === 'admin' ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsCalendarOpen(true)}>
                  <CalendarIcon className="w-4 h-4 mr-2 text-indigo-500" /> Block Calendar
                </Button>
                <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
              </>
            ) : (
              <div className="flex gap-2">
                {cart.length > 0 && (
                  <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold border border-rose-100 flex items-center">
                    {cart.length} items waiting
                  </div>
                )}
              </div>
            )}

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={() => setUserRole(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed top-24 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          {notification.msg}
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
        {userRole === 'admin' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ADMIN NAVIGATION */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'inventory', label: 'Inventory Management', icon: Package },
                { id: 'bi', label: 'Business Intelligence', icon: TrendingUp },
                { id: 'customers', label: 'Customers', icon: Users },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all
                      ${activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'}
                    `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* TODAY'S LOGISTICS BANNER */}
                <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                    <Truck className="w-64 h-64 -mr-16 -mt-16" />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-4 border border-indigo-500/30">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        Live Operations
                      </div>
                      <h2 className="text-3xl font-bold mb-2">Today's Logistics</h2>
                      <p className="text-slate-400">Overview of pickup and return schedules for today.</p>
                    </div>

                    <div className="flex items-center gap-8 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <div className="text-center">
                        <span className="block text-3xl font-bold text-white">3</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Pickups</span>
                      </div>
                      <div className="w-px bg-white/10 h-10"></div>
                      <div className="text-center">
                        <span className="block text-3xl font-bold text-white">1</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Return</span>
                      </div>
                      <div className="w-px bg-white/10 h-10"></div>
                      <div className="text-center">
                        <span className="block text-3xl font-bold text-rose-400">{metrics.overdueRentals}</span>
                        <span className="text-xs text-rose-400/80 uppercase tracking-wider font-bold">Overdue</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FILTERABLE STATUS CARDS */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 ml-1">Order Status</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* ADDED 'ALL' CARD */}
                    <FilterCard
                      title="Total Orders"
                      count={orders.length}
                      status="All"
                      active={orderFilter === 'All'}
                      onClick={() => setOrderFilter('All')}
                      color="bg-slate-500"
                      icon={LayoutDashboard}
                    />
                    <FilterCard
                      title="Pending Requests"
                      count={metrics.pendingRequests}
                      status="Pending"
                      active={orderFilter === 'Pending'}
                      onClick={() => setOrderFilter('Pending')}
                      color="bg-amber-500"
                      icon={ClipboardList}
                    />
                    <FilterCard
                      title="Active Rentals"
                      count={metrics.activeRentals}
                      status="Active"
                      active={orderFilter === 'Active'}
                      onClick={() => setOrderFilter('Active')}
                      color="bg-indigo-500"
                      icon={Truck}
                    />
                    <FilterCard
                      title="Overdue Returns"
                      count={metrics.overdueRentals}
                      status="Overdue"
                      active={orderFilter === 'Overdue'}
                      onClick={() => setOrderFilter('Overdue')}
                      color="bg-rose-500"
                      icon={AlertOctagon}
                    />
                    <FilterCard
                      title="Completed History"
                      count={metrics.completedRentals}
                      status="Completed"
                      active={orderFilter === 'Completed'}
                      onClick={() => setOrderFilter('Completed')}
                      color="bg-emerald-500"
                      icon={Check}
                    />
                  </div>
                </div>

                {/* ORDER MANAGEMENT SECTION */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">
                          {orderFilter === 'All' ? 'Recent Orders' : `${orderFilter} Orders`}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{filteredOrders.length} records found</p>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:flex-none">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          placeholder="Search Order ID..."
                          className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:border-slate-400 hover:border-slate-300 transition-colors"
                        />
                      </div>
                    </div>
                    <Button size="sm" className="whitespace-nowrap" onClick={() => setCreateOrderStep('select-customer')}>
                      <Plus className="w-4 h-4 mr-2" /> CREATE ORDER
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <ClipboardList className="w-8 h-8" />
                      </div>
                      <h4 className="text-slate-900 font-bold mb-1">No orders found</h4>
                      <p className="text-slate-500 text-sm mb-4">There are no {orderFilter.toLowerCase()} orders to display.</p>
                      <button onClick={() => setOrderFilter('All')} className="text-indigo-600 text-sm font-bold hover:underline">View All Orders</button>
                    </div>
                  ) : (
                    filteredOrders.map(order => (
                      <OrderAdminCard key={order.id} order={order} updateStatus={updateOrderStatus} />
                    ))
                  )}
                </div>
              </div>
            )}

            {
              createOrderStep === 'select-customer' && (
                <CustomerSelector
                  customers={customers}
                  onClose={() => setCreateOrderStep('none')}
                  onSelect={(c: any) => { setSelectedCustomer(c); setCreateOrderStep('shop'); }}
                />
              )
            }

            {
              createOrderStep === 'shop' && (
                <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto animate-in fade-in duration-300">
                  {/* POS HEADER */}
                  <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <Button variant="secondary" size="sm" onClick={() => { setCreateOrderStep('none'); setPosCart([]); }}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                      <div className="h-6 w-px bg-slate-200"></div>
                      <div>
                        <h2 className="font-bold text-slate-900">New Order</h2>
                        <p className="text-xs text-slate-500">for <span className="font-bold text-indigo-600">{selectedCustomer?.name}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2 hidden md:block">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total (Est. 2 Days)</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(posCart.reduce((sum, i) => sum + (i.price * i.qty * 2), 0))}</p>
                      </div>
                      <Button onClick={() => setCreateOrderStep('review')} disabled={posCart.length === 0}>
                        Review Order ({posCart.length}) <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>

                  <div className="max-w-7xl mx-auto p-6">
                    {/* INLINE DATE SELECTION AND SEARCH FOR ADMIN POS */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full md:w-96">
                        <div className="pl-3 flex items-center pointer-events-none">
                          <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          className="w-full p-2 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                          placeholder="Search catalog..."
                        />
                      </div>

                      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-500 uppercase px-2">Pickup</label>
                          <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                            value={posDates.start}
                            onChange={e => setPosDates({ ...posDates, start: e.target.value })}
                          />
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-500 uppercase px-2">Return</label>
                          <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                            value={posDates.end}
                            onChange={e => setPosDates({ ...posDates, end: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <Card noPadding>
                      <InventoryTable
                        data={inventory}
                        isAdmin={false} // Use same as client view (order column only)
                        onAddToCart={addToPosCart}
                        cart={posCart} // Pass posCart to track counts properly
                      />
                    </Card>
                  </div>
                </div>
              )
            }

            {
              createOrderStep === 'review' && (
                <InvoiceModal
                  isOpen={true}
                  onClose={() => setCreateOrderStep('shop')}
                  cart={posCart}
                  customer={selectedCustomer}
                  total={posCart.reduce((sum, i) => sum + (i.price * i.qty * 2), 0)}
                  onConfirm={submitAdminOrder}
                />
              )
            }

            {
              activeTab === 'inventory' && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Inventory Management</h2>
                    <Button><Plus className="w-4 h-4 mr-2" /> Add SKU</Button>
                  </div>
                  <Card noPadding>
                    <InventoryTable
                      data={inventory}
                      isAdmin={true}
                      setInventory={setInventory}
                      onAddToCart={addToCartInternal}
                      cart={cart}
                    />
                  </Card>
                </div>
              )
            }

            {
              activeTab === 'bi' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} subtext="Last 30 Days" trend={metrics.revenueGrowth} color="bg-emerald-500" icon={DollarSign} />
                    <StatCard title="Avg. Order" value={formatCurrency(Math.floor(metrics.avgOrderValue))} subtext="Per rental" color="bg-blue-500" icon={CreditCard} />
                    <StatCard title="Total Customers" value={customers.length.toString()} subtext="Lifetime" color="bg-slate-500" icon={Users} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 min-h-[400px]">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Revenue Trends</h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={FINANCIAL_TRENDS}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `¢${value / 1000}k`} />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                    <Card className="min-h-[400px]">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Customer Segments</h3>
                      <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={CUSTOMER_SEGMENTS} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {CUSTOMER_SEGMENTS.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <RechartsTooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>
                </div>
              )
            }

            {
              activeTab === 'customers' && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Customer Database</h2>
                    <div className="relative">
                      <input className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64" placeholder="Search customers..." />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                  <Card noPadding>
                    <CustomersTable data={customers} />
                  </Card>
                </div>
              )
            }
          </div >
        ) : (
          <ClientPortal
            inventory={inventory}
            cart={cart}
            cartCount={cart.length}
            addToCart={addToCartInternal}
            submitOrder={submitOrder}
            activeTab={clientTab}
            setActiveTab={setClientTab}
            orders={orders}
            setCart={setCart}
          />
        )}
      </main >
    </div >
  );
}


