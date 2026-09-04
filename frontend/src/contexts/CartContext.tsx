import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // unique cart item id (e.g. product-123 or service-456-monthly)
  itemId: string; // underlying product or service id
  slug: string;
  name: string;
  type: 'physical' | 'digital' | 'license' | 'software' | 'hardware' | 'service' | 'other';
  price: number;
  originalPrice?: number;
  image?: string;
  quantity: number;
  interval?: 'monthly' | 'yearly';
  category?: string;
  sku?: string;
  resellerPrice?: number;
  customerRetailPrice?: number;
  clientNotes?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  couponCode: string;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  couponDiscountPct: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'infiniforge_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountPct, setCouponDiscountPct] = useState(0);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(prev => !prev);

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    const id = `${newItem.itemId}_${newItem.interval || 'once'}`;
    setItems(prev => {
      const existingIdx = prev.findIndex(item => item.id === id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += (newItem.quantity || 1);
        return updated;
      }
      return [...prev, { ...newItem, id, quantity: newItem.quantity || 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    setCouponDiscountPct(0);
  };

  const applyCoupon = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'LAUNCH20' || cleanCode === 'RESELL20') {
      setCouponCode(cleanCode);
      setCouponDiscountPct(20);
      return true;
    }
    if (cleanCode === 'INFINI10') {
      setCouponCode(cleanCode);
      setCouponDiscountPct(10);
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscountPct(0);
  };

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountTotal = Math.round((subtotal * couponDiscountPct) / 100);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxTotal = Math.round(taxableAmount * 0.18); // 18% GST in India
  const grandTotal = taxableAmount + taxTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        couponCode,
        applyCoupon,
        removeCoupon,
        couponDiscountPct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
