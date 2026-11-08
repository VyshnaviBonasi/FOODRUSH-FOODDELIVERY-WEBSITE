import { describe, it, expect } from 'vitest';
import { calculateOrderPricing } from '../server/services/pricing.js';

describe('Promotional Coupons & Deals Engine', () => {
  it('applies FIRST50 with 50% discount capped at ₹150', () => {
    // 2 x ₹289 = ₹578
    const pricing = calculateOrderPricing('res_paradise', [
      { menuItemId: 'item_pb_3', quantity: 2 }
    ], 'FIRST50');

    expect(pricing.discount).toBe(150);
    expect(pricing.couponApplied?.code).toBe('FIRST50');
  });

  it('applies CHICKEN453 for zero delivery charge', () => {
    const pricing = calculateOrderPricing('res_paradise', [
      { menuItemId: 'item_pb_3', quantity: 1 } // ₹289
    ], 'CHICKEN453');

    expect(pricing.deliveryFee).toBe(0);
    expect(pricing.discount).toBe(30); // original delivery fee absorbed as discount
  });

  it('rejects expired or nonexistent promo codes gracefully', () => {
    const pricing = calculateOrderPricing('res_paradise', [
      { menuItemId: 'item_pb_3', quantity: 1 }
    ], 'INVALID_CODE_999');

    expect(pricing.discount).toBe(0);
    expect(pricing.errors).toBeDefined();
    expect(pricing.errors?.[0]).toContain('invalid');
  });
});
