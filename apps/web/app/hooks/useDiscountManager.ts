import { useState, useEffect, useCallback } from 'react';
import { Discount } from '../types';
import { getActiveDiscounts } from '../services/discountService';

interface DiscountState {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  code: string;
}

export const useDiscountManager = (
  subtotal: number,
  initialDiscount?: Omit<DiscountState, 'code'> & { code?: string },
  isConfirmedInitial: boolean = false
) => {
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(!!initialDiscount || isConfirmedInitial);
  const [isDiscountConfirmed, setIsDiscountConfirmed] = useState(isConfirmedInitial);
  const [discountMode, setDiscountMode] = useState<'new' | 'existing'>('new');
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  
  const [discountForm, setDiscountForm] = useState<DiscountState>({
    name: initialDiscount?.name || '',
    type: initialDiscount?.type || 'fixed',
    value: initialDiscount?.value || 0,
    code: initialDiscount?.code || ''
  });

  const loadDiscounts = useCallback(async () => {
    const discounts = await getActiveDiscounts();
    setActiveDiscounts(discounts);
  }, []);

  useEffect(() => {
    if (isApplyingDiscount && activeDiscounts.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDiscounts();
    }
  }, [isApplyingDiscount, activeDiscounts.length, loadDiscounts]);

  // Derive percentage for display if type is percentage
  const derivedPercentage = (discountForm.type === 'percentage' && subtotal > 0)
    ? ((discountForm.value / subtotal) * 100).toFixed(0)
    : discountPercentage;

  const handlePercentageChange = (val: string) => {
    setDiscountPercentage(val);
    const percent = parseFloat(val);
    if (!isNaN(percent)) {
      const monetaryValue = (subtotal * percent) / 100;
      setDiscountForm(prev => ({ 
        ...prev, 
        type: 'percentage', 
        value: parseFloat(monetaryValue.toFixed(2)) 
      }));
    } else {
      setDiscountForm(prev => ({ ...prev, type: 'percentage', value: 0 }));
    }
  };

  const handleMonetaryChange = (val: string) => {
    setDiscountPercentage('');
    setDiscountForm(prev => ({ 
      ...prev, 
      type: 'fixed', 
      value: parseFloat(val) || 0 
    }));
  };

  const handleSelectDiscount = (discountId: string) => {
    setSelectedDiscountId(discountId);
    const discount = activeDiscounts.find(d => d.id.toString() === discountId);
    if (discount) {
      setDiscountForm({
        name: discount.name,
        type: discount.discount_type as 'fixed' | 'percentage',
        value: Number(discount.discount_value),
        code: discount.code
      });
    }
  };

  const reset = useCallback(() => {
    setIsApplyingDiscount(false);
    setIsDiscountConfirmed(false);
    setDiscountMode('new');
    setDiscountForm({ name: '', type: 'fixed', value: 0, code: '' });
    setDiscountPercentage('');
    setSelectedDiscountId('');
  }, []);

  return {
    isApplyingDiscount,
    setIsApplyingDiscount,
    isDiscountConfirmed,
    setIsDiscountConfirmed,
    discountMode,
    setDiscountMode,
    activeDiscounts,
    selectedDiscountId,
    discountPercentage: derivedPercentage,
    discountForm,
    setDiscountForm,
    handlePercentageChange,
    handleMonetaryChange,
    handleSelectDiscount,
    reset,
    loadDiscounts
  };
};
