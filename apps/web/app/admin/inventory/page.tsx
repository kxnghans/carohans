"use client";

import React, { useState } from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { PortalFormData } from '../../types';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { calculateOrderTotal } from '../../utils/helpers';

export default function AdminInventoryPage() {

  const { Plus, ShoppingCart, Check, X, Pencil, Ban, Loader2, Calendar } = Icons;

    const { inventory, setInventory, cart, setCart, clients, submitOrder, showNotification, loading, latePenaltyPerDay, setLatePenaltyPerDay } = useAppStore();

  

    const [isOrderMode, setIsOrderMode] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);

    

    const [selectedClientId, setSelectedClientId] = useState('');

    const [orderDates, setOrderDates] = useState({ start: '', end: '' });

    const [showReview, setShowReview] = useState(false);

  

    const selectedClient = clients.find(c => c.id.toString() === selectedClientId);

  

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

        setSelectedClientId('');

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

  

    const handleReviewOrder = () => {
      if (!selectedClientId) {
        showNotification("Please select a client to continue.", "error");
        return;
      }
      if (!orderDates.start || !orderDates.end) {
        showNotification("Please select both pickup and return dates.", "error");
        return;
      }
      if (orderDates.end < orderDates.start) {
        showNotification("Return date cannot be earlier than the pickup date.", "error");
        return;
      }
      if (cart.length === 0) {
        showNotification("Your order cart is empty. Please add items to continue.", "error");
        return;
      }
      setShowReview(true);
    };

    const handleCreateOrder = async () => {
      if (!selectedClient) return;
      
      const orderData: PortalFormData = {
        firstName: selectedClient.firstName,
        lastName: selectedClient.lastName,
        username: selectedClient.username || '',
        phone: selectedClient.phone,
        email: selectedClient.email,
        address: selectedClient.address,
        start: orderDates.start,
        end: orderDates.end
      };
  
      await submitOrder(orderData);
      setIsOrderMode(false);
      setSelectedClientId('');
      setOrderDates({ start: '', end: '' });
      setCart([]);
      showNotification("Order created successfully!", "success");
    };

    const handleDeleteItem = (id: number) => {
      setInventory(prev => prev.filter(item => item.id !== id));
      showNotification("Item deleted successfully", "success");
    };

    return (
      <div className="animate-in fade-in duration-500 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <h1 className="text-theme-hero text-foreground tracking-tight">Inventory Management</h1>
                  
                  {/* LATE PENALTY SETTING */}
                  {!isOrderMode && (
                    <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-xl border border-border shadow-sm">
                      <label className="text-theme-caption text-muted uppercase tracking-[0.2em] font-bold">Late Penalty</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted text-theme-body">¢</span>
                        <input 
                          type="number" 
                          value={latePenaltyPerDay} 
                          onChange={(e) => setLatePenaltyPerDay(Number(e.target.value))}
                          className="w-16 bg-background border-none rounded-lg p-1 text-theme-label text-error font-bold outline-none focus:ring-2 focus:ring-rose-500/20 text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
  
                <div className="flex items-center gap-3">
        
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
                 onClick={handleReviewOrder} 
                 className="shadow-lg shadow-primary/20"
               >
                 Review Order ({cart.length})
               </Button>
             </>
          ) : (
            <Button onClick={toggleOrderMode} disabled={isEditMode} className={isEditMode ? "opacity-50 shadow-lg shadow-primary/20" : "shadow-lg shadow-primary/20"}>
               <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
          )}
        </div>
      </div>

      {isOrderMode && (
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 flex flex-col gap-1.5">
                 <label className="text-theme-caption font-black text-muted uppercase tracking-wider ml-1">Client Selection</label>
                 <select 
                   className="p-3 border border-border rounded-xl bg-background text-foreground text-theme-label font-medium outline-none focus:border-primary transition-all"
                   value={selectedClientId}
                   onChange={(e) => setSelectedClientId(e.target.value)}
                 >
                    <option value="">Select Client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                 </select>
              </div>
              <DatePicker 
                label="Pickup Date"
                value={orderDates.start}
                onChange={(val) => setOrderDates(prev => ({ ...prev, start: val }))}
                containerClassName="md:col-span-4"
              />
              <DatePicker 
                label="Return Date"
                value={orderDates.end}
                onChange={(val) => setOrderDates(prev => ({ ...prev, end: val }))}
                containerClassName="md:col-span-4"
              />
           </div>
        </div>
      )}

      <Card noPadding>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-theme-body font-medium">Fetching inventory...</p>
          </div>
        ) : (
          <InventoryTable
            data={inventory}
            isAdmin={!isOrderMode} 
            isEditMode={isEditMode} 
            onDelete={handleDeleteItem} 
            setInventory={setInventory}
            onAddToCart={addToCart}
            cart={cart}
            showOrderColumn={isOrderMode}
          />
        )}
      </Card>



            {showReview && selectedClient && (



              <InvoiceModal



                isOpen={showReview}



                onClose={() => setShowReview(false)}



                cart={cart}



                client={selectedClient}



                total={calculateOrderTotal(cart, orderDates.start, orderDates.end)}



                startDate={orderDates.start}



                endDate={orderDates.end}



                onConfirm={() => {



                  handleCreateOrder();



                  setShowReview(false);



                }}



              />



            )}

    </div>

  );

}
