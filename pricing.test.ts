import { describe, it, expect } from 'vitest';
import { calculateOrderPricing } from '../server/services/pricing.js';

describe('Authoritative Pricing Engine', () => {
  it('calculates correct base subtotal and 5% tax for Paradise Biryani items', () => {
    const pricing = calculateOrderPricing('res_paradise', [
      { menuItemId: 'item_pb_3', quantity: 2 }, // 289 * 2 = 578
      { menuItemId: 'item_pb_6', quantity: 1 }  // 49 * 1 = 49
    ]);

    expect(pricing.subtotal).toBe(627);
    expect(pricing.tax).toBe(31.35); // 5% of 627
    expect(pricing.deliveryFee).toBe(30);
    expect(pricing.total).toBe(688.35);
  });

  it('correctly calculates variant pricing and addons', () => {
    const pricing = calculateOrderPricing('res_paradise', [
      {
        menuItemId: 'item_pb_3',
        quantity: 1,
        variantId: 'v_special', // 429
        addonIds: ['a_raita', 'a_egg'] // 35 + 30 = 65 -> total 494
      }
    ]);

    expect(pricing.subtotal).toBe(494);
    expect(pricing.items[0].price).toBe(494);
  });

  it('correctly applies BIRYANI145 coupon (40% off, max 145)', () => {
    const pricing = calculateOrderPricing('res_paradise', [
      { menuItemId: 'item_pb_3', quantity: 2 } // 578
    ], 'BIRYANI145');

    // 40% of 578 is 231.2, but max discount is 145
    expect(pricing.discount).toBe(145);
    expect(pricing.couponApplied?.code).toBe('BIRYANI145');
  });

  it('rejects coupon if minimum order value is not met', () => {
    const pricing = calculateOrderPricing('res_paradise', [
      { menuItemId: 'item_pb_6', quantity: 1 } // 49
    ], 'BIRYANI145');

    expect(pricing.discount).toBe(0);
    expect(pricing.errors).toBeDefined();
    expect(pricing.errors?.[0]).toContain('minimum order');
  });

  it('prevents multi-restaurant item mixing in a single checkout', () => {
    expect(() => {
      calculateOrderPricing('res_paradise', [
        { menuItemId: 'item_pb_3', quantity: 1 },
        { menuItemId: 'item_bh_1', quantity: 1 } // Burger Hub item
      ]);
    }).toThrow(/does not belong to Paradise Biryani/);
  });
});
