"use client";

import React, { useState } from 'react';
import { Icons } from '../../lib/icons';
import { useAppStore } from '../../context/AppContext';
import { PortalFormData } from '../../types';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { calculateOrderTotal } from '../../utils/helpers';

export default function AdminInventoryPage() {

  const { Plus, ShoppingCart, Check, X, Pencil, Ban, Loader2 } = Icons;

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

  

    const handleDeleteItem = (id: number) => {

      setInventory(prev => prev.filter(item => item.id !== id));

      showNotification("Item deleted successfully", "success");

    };

  

    const handleCreateOrder = () => {

      if (!selectedClient) {

        showNotification("Please select a client", "error");

        return;

      }

      if (!orderDates.start || !orderDates.end) {

        showNotification("Please select pickup and return dates", "error");

        return;

      }

      

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

  

      submitOrder(orderData);

      setIsOrderMode(false);

      setSelectedClientId('');

      setOrderDates({ start: '', end: '' });

    };

  

    return (

      <div className="animate-in fade-in duration-500 space-y-4">

              <div className="flex justify-between items-center">

                <div className="flex items-center gap-6">

                  <h2 className="text-2xl font-bold">Inventory</h2>

                  

                  {/* LATE PENALTY SETTING */}

                  {!isOrderMode && (

                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">

                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late Penalty / Day</label>

                      <div className="flex items-center gap-1.5">

                        <span className="text-slate-400 font-bold">¢</span>

                        <input 

                          type="number" 

                          value={latePenaltyPerDay} 

                          onChange={(e) => setLatePenaltyPerDay(Number(e.target.value))}

                          className="w-16 bg-slate-50 border-none rounded-lg p-1 text-sm font-black text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/20"

                        />

                      </div>

                    </div>

                  )}

                </div>

  

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

                 disabled={cart.length === 0 || !selectedClientId || !orderDates.start || !orderDates.end}

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

                   value={selectedClientId}

                   onChange={(e) => setSelectedClientId(e.target.value)}

                 >

                    <option value="">Select Client...</option>

                                        {clients.map(c => (

                                          <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>

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

        {loading ? (

          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">

            <Loader2 className="w-8 h-8 animate-spin" />

            <p className="text-sm font-medium">Fetching inventory...</p>

          </div>

        ) : (

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
