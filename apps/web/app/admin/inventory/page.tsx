"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icons } from '../../lib/icons';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../context/AppContext';
import { InventoryItem, PortalFormData } from '../../types';
import { getDurationDays } from '../../utils/helpers';
import { ClientSelector } from '../../components/modals/ClientSelector';
import { InvoiceModal } from '../../components/modals/InvoiceModal';
import { DiscountManager } from '../../components/common/DiscountManager';

export default function AdminInventoryPage() {
  const { Plus, Check, X, Pencil, Loader2, Calendar } = Icons;
  const { 
    inventory, setInventory, cart, setCart, clients, submitOrder, showNotification, 
    loading, modifyingOrderId, portalFormData, setPortalFormData,
    cancelModification
  } = useAppStore();

  const [isOrderMode, setIsOrderMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [orderDates, setOrderDates] = useState({ start: '', end: '', discountCode: '' });
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('mode') === 'order') {
      setIsOrderMode(true);
      setCart([]);
    }
  }, [searchParams, setCart]);

  const toggleOrderMode = () => {
    if (isOrderMode) {
      setIsOrderMode(false);
      setCart([]);
      setOrderDates({ start: '', end: '', discountCode: '' });
      setSelectedClientId('');
    } else {
      setIsOrderMode(true);
      setIsEditMode(false);
      setCart([]);
    }
  };

  const toggleEditMode = async () => {
    if (isEditMode) {
      setIsEditMode(false);
      try {
          const { bulkSaveInventory } = await import('../../actions/inventory');
          await bulkSaveInventory(inventory);
          showNotification("Inventory updates saved!", "success");
      } catch {
          showNotification("Failed to save changes", "error");
      }
    } else {
      setIsEditMode(true);
      setIsOrderMode(false);
      setCart([]);
    }
  };

  const discardEditChanges = async () => {
      setIsEditMode(false);
      const { getInventoryCached } = await import('../../actions/inventory');
      const freshInv = await getInventoryCached();
      setInventory(freshInv);
      showNotification("Inventory changes discarded", "info");
  };

  const handleReviewOrder = () => {
    if (!selectedClientId) {
      showNotification("Please select a client to continue.", "error");
      return;
    }
    if (!orderDates.start || !orderDates.end) {
      showNotification("Please select both pickup and planned return dates.", "error");
      return;
    }
    if (orderDates.end < orderDates.start) {
      showNotification("Planned return date cannot be earlier than the pickup date.", "error");
      return;
    }
    if (cart.length === 0) {
      showNotification("Your order cart is empty. Please add items to continue.", "error");
      return;
    }
    setShowReview(true);
  };

  const handleConfirmOrder = async () => {
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

    try {
        await submitOrder(orderData, portalFormData.discountCode);
        showNotification(modifyingOrderId ? "Order updated successfully!" : "Order placed successfully!", "success");
        setIsOrderMode(false);
        setSelectedClientId('');
        setOrderDates({ start: '', end: '', discountCode: '' });
        setCart([]);
        setShowReview(false);
    } catch (e) {
        const error = e as Error;
        showNotification(error.message || "Failed to process order", "error");
    }
  };

  useEffect(() => {
    if (modifyingOrderId) {
      setIsOrderMode(true);
      setSelectedClientId(clients.find(c => c.email === portalFormData.email)?.id.toString() || '');
      setOrderDates({
        start: portalFormData.start,
        end: portalFormData.end,
        discountCode: portalFormData.discountCode || ''
      });
    }
  }, [modifyingOrderId, clients, portalFormData, cart]);

  const subtotal = useMemo(() => {
    const duration = getDurationDays(orderDates.start, orderDates.end);
    return cart.reduce((sum, item) => sum + (item.price * item.qty * duration), 0);
  }, [cart, orderDates.start, orderDates.end]);

  const handleDeleteItem = (id: number) => {
    setInventory(inventory.filter(item => item.id !== id));
    showNotification("Item deleted from catalog.");
  };

  const addToCart = (item: InventoryItem, qty: number) => {
    const existing = cart.find(c => c.id === item.id);
    if (qty <= 0) {
      setCart(cart.filter(c => c.id !== item.id));
    } else if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty } : c));
    } else {
      setCart([...cart, { id: item.id, qty, price: item.price }]);
    }
  };

  const selectedClient = clients.find(c => c.id.toString() === selectedClientId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-theme-header font-bold tracking-tight text-foreground flex items-center gap-3">
            <Icons.LayoutDashboard className="w-8 h-8 text-primary" />
            Inventory & Logistics
          </h1>
          <p className="text-theme-body text-muted font-medium mt-1">Manage equipment stock levels and operational availability.</p>
        </div>
        <div className="flex items-center gap-3">
           {/* EDIT MODE TOGGLE */}
           {!isOrderMode && (
             <div className="flex gap-2">
               {isEditMode && (
                 <Button
                   variant="danger"
                   onClick={discardEditChanges}
                 >
                   <X className="w-4 h-4 mr-2" /> Discard
                 </Button>
               )}
               <Button
                 variant={isEditMode ? "primary" : "secondary"}
                 onClick={toggleEditMode}
                 className={`transition-all font-bold ${isEditMode ? 'bg-primary dark:bg-surface text-white dark:text-foreground shadow-inner' : ''}`}
               >
                 {isEditMode ? <><Check className="w-4 h-4 mr-2" /> Save Changes</> : <><Pencil className="w-4 h-4 mr-2" /> Edit Mode</>}
               </Button>
             </div>
           )}

           {/* NEW ORDER TOGGLE */}
           {isOrderMode ? (
             <div className="flex gap-2">
               {modifyingOrderId ? (
                 <Button 
                   variant="danger" 
                   className="font-bold shadow-lg shadow-error/20" 
                   onClick={() => {
                     cancelModification();
                     setIsOrderMode(false);
                   }}
                 >
                   <X className="w-4 h-4 mr-2" /> Discard Changes
                 </Button>
               ) : (
                 <Button variant="secondary" className="font-bold" onClick={toggleOrderMode}>
                   <X className="w-4 h-4 mr-2" /> Exit Order Mode
                 </Button>
               )}
               <Button
                 onClick={handleReviewOrder}
                 className="font-bold shadow-lg shadow-primary/20"
               >
                 Review Order ({cart.length})
               </Button>
             </div>
           ) : (
             <Button 
               onClick={toggleOrderMode} 
               disabled={isEditMode} 
               className={`font-bold shadow-lg shadow-primary/20 ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               <Plus className="w-4 h-4 mr-2" /> New Order
             </Button>
           )}
        </div>
      </div>

      {isOrderMode && (
        <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
           <div className="bg-surface p-8 rounded-3xl border border-border shadow-xl ring-1 ring-black/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-muted uppercase tracking-[0.2em] ml-1">Client Selection</label>
                    <button 
                      onClick={() => setShowClientSelector(true)} 
                      className="w-full flex items-center justify-between px-5 py-4 bg-background border border-border rounded-2xl text-theme-body font-bold hover:border-primary transition-all group"
                    >
                      <div className="flex items-center gap-3 text-foreground">
                        <Icons.User className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                        <span>{selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : "Select Client..."}</span>
                      </div>
                      <Icons.ChevronDown className="w-4 h-4 text-muted" />
                    </button>
                    {selectedClient && <p className="text-[10px] text-muted opacity-80 font-bold tracking-wider ml-1">{selectedClient.phone} • {selectedClient.email}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-muted uppercase tracking-[0.2em] ml-1">Pickup Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                      <input 
                        type="date" 
                        className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl text-theme-body font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:[color-scheme:dark]" 
                        value={orderDates.start} 
                        onChange={(e) => { setOrderDates({...orderDates, start: e.target.value}); setPortalFormData({...portalFormData, start: e.target.value}); }} 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-muted uppercase tracking-[0.2em] ml-1">Planned Return Date</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                      <input 
                        type="date" 
                        className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl text-theme-body font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all dark:[color-scheme:dark]" 
                        value={orderDates.end} 
                        onChange={(e) => { setOrderDates({...orderDates, end: e.target.value}); setPortalFormData({...portalFormData, end: e.target.value}); }} 
                      />
                    </div>
                  </div>
                </div>
           </div>

           <div className="bg-surface p-6 rounded-3xl border border-border shadow-lg">
                <DiscountManager 
                    variant="featured"
                    subtotal={subtotal}
                    initialDiscount={portalFormData.discountName ? {
                        name: portalFormData.discountName,
                        type: (portalFormData.discountType as 'fixed' | 'percentage') || 'fixed',
                        value: portalFormData.discountValue || 0
                    } : undefined}
                    isConfirmedInitial={!!portalFormData.discountName}
                    onApply={(form) => {
                        setPortalFormData(prev => ({
                            ...prev,
                            discountName: form.name,
                            discountType: form.type,
                            discountValue: form.value,
                            discountCode: form.code
                        }));
                    }}
                    onClear={() => {
                        setPortalFormData(prev => ({
                            ...prev,
                            discountName: '',
                            discountType: 'fixed',
                            discountValue: 0,
                            discountCode: ''
                        }));
                    }}
                    showNotification={showNotification}
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

      {showClientSelector && (
        <ClientSelector 
          isOpen={true} 
          onClose={() => setShowClientSelector(false)} 
          clients={clients} 
          onSelect={(client) => {
            setSelectedClientId(client.id.toString());
            setPortalFormData({
              ...portalFormData,
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              phone: client.phone
            });
            setShowClientSelector(false);
          }} 
        />
      )}

      {showReview && selectedClient && (
        <InvoiceModal 
            isOpen={true} 
            onClose={() => setShowReview(false)} 
            cart={cart.map(item => ({ ...inventory.find(i => i.id === item.id), ...item })) as (InventoryItem & { qty: number })[]} 
            client={selectedClient} 
            startDate={orderDates.start} 
            endDate={orderDates.end} 
            onConfirm={handleConfirmOrder} 
            orderId={modifyingOrderId || undefined}
            discountName={portalFormData.discountName}
            discountType={portalFormData.discountType}
            discountValue={portalFormData.discountValue}
        />
      )}
    </div>
  );
}