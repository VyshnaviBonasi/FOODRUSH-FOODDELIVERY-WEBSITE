import { db } from '../db/store.js';
import type { OrderItem, Coupon } from '../../src/types/index.js';

export interface PricingResult {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponApplied?: Coupon;
  errors?: string[];
}

export function calculateOrderPricing(
  restaurantId: string,
  rawItems: {
    menuItemId: string;
    quantity: number;
    variantId?: string;
    addonIds?: string[];
  }[],
  couponCode?: string
): PricingResult {
  const errors: string[] = [];
  const restaurant = db.getRestaurantById(restaurantId);

  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  if (!restaurant.isOpen) {
    throw new Error('Restaurant is currently closed for orders');
  }

  if (!rawItems || rawItems.length === 0) {
    throw new Error('Cart cannot be empty');
  }

  const validatedItems: OrderItem[] = [];
  let subtotal = 0;

  for (const raw of rawItems) {
    if (raw.quantity <= 0 || !Number.isInteger(raw.quantity)) {
      throw new Error(`Invalid item quantity: ${raw.quantity}`);
    }

    const menuItem = db.getMenuItemById(raw.menuItemId);
    if (!menuItem) {
      throw new Error(`Item ${raw.menuItemId} does not exist in catalog`);
    }

    if (menuItem.restaurantId !== restaurantId) {
      throw new Error(`Item "${menuItem.name}" does not belong to ${restaurant.name}. Multi-restaurant orders must be placed separately.`);
    }

    if (!menuItem.inStock) {
      throw new Error(`Item "${menuItem.name}" is currently sold out`);
    }

    let unitPrice = menuItem.price;
    let selectedVariant: { id: string; name: string; price: number } | undefined;
    const selectedAddons: { id: string; name: string; price: number }[] = [];

    // Check variant
    if (raw.variantId && menuItem.variants) {
      const v = menuItem.variants.find(va => va.id === raw.variantId);
      if (v) {
        unitPrice = v.price;
        selectedVariant = v;
      }
    }

    // Check addons
    if (raw.addonIds && raw.addonIds.length > 0 && menuItem.addons) {
      for (const aId of raw.addonIds) {
        const addon = menuItem.addons.find(a => a.id === aId);
        if (addon) {
          unitPrice += addon.price;
          selectedAddons.push(addon);
        }
      }
    }

    const itemSubtotal = unitPrice * raw.quantity;
    subtotal += itemSubtotal;

    validatedItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: unitPrice,
      quantity: raw.quantity,
      image: menuItem.image,
      isVeg: menuItem.isVeg,
      customization: {
        variant: selectedVariant,
        addons: selectedAddons.length > 0 ? selectedAddons : undefined
      },
      subtotal: itemSubtotal
    });
  }

  // Authoritative Tax calculation: 5% GST on Restaurant Service
  const tax = Math.round((subtotal * 0.05) * 100) / 100;

  // Delivery Fee
  let deliveryFee = restaurant.deliveryFee || 30;

  // Coupon evaluation
  let discount = 0;
  let couponApplied: Coupon | undefined;

  if (couponCode) {
    const coupon = db.getCouponByCode(couponCode);
    if (!coupon) {
      errors.push(`Coupon code "${couponCode}" is invalid`);
    } else if (subtotal < coupon.minOrderValue) {
      errors.push(`Coupon "${coupon.code}" requires a minimum order of ₹${coupon.minOrderValue}`);
    } else {
      couponApplied = coupon;
      if (coupon.code === 'CHICKEN453') {
        // Free delivery coupon
        discount = deliveryFee;
        deliveryFee = 0;
      } else {
        const calculatedDiscount = Math.round((subtotal * (coupon.discountPercent / 100)) * 100) / 100;
        discount = Math.min(calculatedDiscount, coupon.maxDiscount);
      }
    }
  }

  const total = Math.max(0, Math.round((subtotal + tax + deliveryFee - discount) * 100) / 100);

  return {
    items: validatedItems,
    subtotal,
    tax,
    deliveryFee,
    discount,
    total,
    couponApplied,
    errors: errors.length > 0 ? errors : undefined
  };
}
