import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { MenuItem, Restaurant, Coupon, OrderItemCustomization } from '../types';
import { api } from '../api/client';
import { useToast } from './ToastContext';

export interface CartItem {
  id: string; // unique item id + customizations
  menuItem: MenuItem;
  restaurantId: string;
  restaurantName: string;
  quantity: number;
  customization?: OrderItemCustomization;
  unitPrice: number;
}

interface CartContextType {
  items: CartItem[];
  restaurant: Restaurant | null;
  coupon: Coupon | null;
  couponCodeInput: string;
  setCouponCodeInput: (code: string) => void;
  addItem: (
    menuItem: MenuItem,
    restaurant: Restaurant,
    customization?: OrderItemCustomization,
    quantity?: number
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  totalItemCount: number;
  subtotal: number;
  estimatedDeliveryFee: number;
  estimatedTax: number;
  discount: number;
  estimatedTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('foodrush_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [restaurant, setRestaurant] = useState<Restaurant | null>(() => {
    try {
      const saved = localStorage.getItem('foodrush_cart_restaurant');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('foodrush_cart_items', JSON.stringify(items));
    if (items.length === 0) {
      setRestaurant(null);
      localStorage.removeItem('foodrush_cart_restaurant');
      setCoupon(null);
    } else if (restaurant) {
      localStorage.setItem('foodrush_cart_restaurant', JSON.stringify(restaurant));
    }
  }, [items, restaurant]);

  const addItem = (
    menuItem: MenuItem,
    itemRestaurant: Restaurant,
    customization?: OrderItemCustomization,
    quantity: number = 1
  ) => {
    // Multi-restaurant rule check
    if (restaurant && restaurant.id !== itemRestaurant.id && items.length > 0) {
      const confirmed = window.confirm(
        `Your cart contains items from "${restaurant.name}". Do you want to discard them and order from "${itemRestaurant.name}" instead?`
      );
      if (!confirmed) return;
      setItems([]);
      setCoupon(null);
    }

    setRestaurant(itemRestaurant);

    // Calculate unit price including customizations
    let unitPrice = menuItem.price;
    if (customization?.variant) {
      unitPrice = customization.variant.price;
    }
    if (customization?.addons) {
      for (const a of customization.addons) {
        unitPrice += a.price;
      }
    }

    const uniqueCartId = `${menuItem.id}_${customization?.variant?.id || 'def'}_${
      customization?.addons?.map((a) => a.id).sort().join('-') || 'none'
    }`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === uniqueCartId);
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      } else {
        return [
          ...prev,
          {
            id: uniqueCartId,
            menuItem,
            restaurantId: itemRestaurant.id,
            restaurantName: itemRestaurant.name,
            quantity,
            customization,
            unitPrice,
          },
        ];
      }
    });

    toast(`Added "${menuItem.name}" to your cart!`, 'success');
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
    toast('Item removed from cart', 'info');
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
    setRestaurant(null);
    setCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    if (!restaurant || items.length === 0) {
      toast('Add items to your cart before applying coupons', 'error');
      return false;
    }

    try {
      const rawItems = items.map((i) => ({
        menuItemId: i.menuItem.id,
        quantity: i.quantity,
        variantId: i.customization?.variant?.id,
        addonIds: i.customization?.addons?.map((a) => a.id),
      }));

      const res = await api.cart.validate(restaurant.id, rawItems, code.toUpperCase());

      if (res.errors && res.errors.length > 0) {
        toast(res.errors[0], 'error');
        return false;
      }

      if (res.couponApplied) {
        setCoupon(res.couponApplied);
        toast(`Promo code "${res.couponApplied.code}" applied! You saved ₹${res.discount}`, 'success');
        return true;
      }

      toast('Invalid promo code', 'error');
      return false;
    } catch (err: any) {
      toast(err.message || 'Coupon verification failed', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCodeInput('');
    toast('Coupon removed', 'info');
  };

  // Calculations
  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const estimatedTax = Math.round(subtotal * 0.05 * 100) / 100;
  let estimatedDeliveryFee = restaurant ? restaurant.deliveryFee : 30;
  let discount = 0;

  if (coupon) {
    if (coupon.code === 'CHICKEN453') {
      discount = estimatedDeliveryFee;
      estimatedDeliveryFee = 0;
    } else {
      const calculated = Math.round(subtotal * (coupon.discountPercent / 100) * 100) / 100;
      discount = Math.min(calculated, coupon.maxDiscount);
    }
  }

  const estimatedTotal = Math.max(0, Math.round((subtotal + estimatedTax + estimatedDeliveryFee - discount) * 100) / 100);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurant,
        coupon,
        couponCodeInput,
        setCouponCodeInput,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        totalItemCount,
        subtotal,
        estimatedDeliveryFee,
        estimatedTax,
        discount,
        estimatedTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
