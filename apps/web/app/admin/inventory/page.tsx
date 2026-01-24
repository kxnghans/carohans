"use client";

import React, { useState } from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { InvoiceModal } from '../../components/modals/InvoiceModal';

export default function AdminInventoryPage() {
  const { Plus, ShoppingCart, Check, X, Pencil, Ban } = Icons;
  const { inventory, setInventory, cart, setCart, customers, submitOrder, showNotification } = useAppStore();
  
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderDates, setOrderDates] = useState({ start: '', end: '' });
  const [showReview, setShowReview] = useState(false);

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

  const addToCart = (item: any, qty: number) => {
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

  const toggleOrderMode = () => {
    if (isOrderMode) {
      // Cancel order mode
      setIsOrderMode(false);
      setCart([]);
      setOrderDates({ start: '', end: '' });
      setSelectedCustomerId('');
    } else {
      setIsOrderMode(true);
      setIsEditMode(false); // Disable edit mode
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
    } else {
      setIsEditMode(true);
      setIsOrderMode(false); // Disable order mode
      setCart([]);
    }
  };

  const handleDeleteItem = (id: number) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    showNotification("Item deleted successfully", "success");
  };

  const handleCreateOrder = () => {
    if (!selectedCustomer) {
      showNotification("Please select a customer", "error");
      return;
    }
    if (!orderDates.start || !orderDates.end) {
      showNotification("Please select pickup and return dates", "error");
      return;
    }
    
    const orderData = {
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email,
      start: orderDates.start,
      end: orderDates.end
    };

    submitOrder(orderData);
    setIsOrderMode(false);
    setSelectedCustomerId('');
    setOrderDates({ start: '', end: '' });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex gap-2">
          {/* EDIT MODE TOGGLE */}
          {!isOrderMode && (
            <Button 
              variant={isEditMode ? "primary" : "secondary"}
              onClick={toggleEditMode}
              className={isEditMode ? "shadow-indigo-100" : ""}
            >
              {isEditMode ? <><Check className="w-4 h-4 mr-2" /> Done Editing</> : <><Pencil className="w-4 h-4 mr-2" /> Edit Mode</>}
            </Button>
          )}

          {/* NEW ORDER TOGGLE */}
          {isOrderMode ? (
             <>
               <Button variant="secondary" onClick={toggleOrderMode}><X className="w-4 h-4 mr-2" /> Cancel</Button>
               <Button 
                 onClick={() => setShowReview(true)} 
                 disabled={cart.length === 0 || !selectedCustomerId || !orderDates.start || !orderDates.end}
               >
                 Review Order ({cart.length})
               </Button>
             </>
          ) : (
            <Button onClick={toggleOrderMode} disabled={isEditMode} className={isEditMode ? "opacity-50" : ""}>
               <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
          )}
        </div>
      </div>

      {isOrderMode && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Client</label>
                 <select 
                   className="p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium outline-none focus:border-indigo-500"
                   value={selectedCustomerId}
                   onChange={(e) => setSelectedCustomerId(e.target.value)}
                 >
                    <option value="">Select Client...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                 </select>
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Pickup Date</label>
                 <input 
                   type="date"
                   className="p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium outline-none focus:border-indigo-500"
                   value={orderDates.start}
                   onChange={(e) => setOrderDates(prev => ({ ...prev, start: e.target.value }))}
                 />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Return Date</label>
                 <input 
                   type="date"
                   className="p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium outline-none focus:border-indigo-500"
                   value={orderDates.end}
                   onChange={(e) => setOrderDates(prev => ({ ...prev, end: e.target.value }))}
                 />
              </div>
           </div>
        </div>
      )}

      <Card noPadding>
        <InventoryTable
          data={inventory}
          isAdmin={!isOrderMode} 
          isEditMode={isEditMode} // Pass edit mode state
          onDelete={handleDeleteItem} // Pass delete handler
          setInventory={setInventory}
          onAddToCart={addToCart}
          cart={cart}
          showOrderColumn={isOrderMode}
        />
      </Card>

      {showReview && selectedCustomer && (
        <InvoiceModal
          isOpen={showReview}
          onClose={() => setShowReview(false)}
          cart={cart}
          customer={{ name: selectedCustomer.name, email: selectedCustomer.email, phone: selectedCustomer.phone }}
          total={cart.reduce((sum: number, i: any) => sum + (i.price * i.qty * 2), 0)}
          onConfirm={() => {
            handleCreateOrder();
            setShowReview(false);
          }}
        />
      )}
    </div>
  );
}