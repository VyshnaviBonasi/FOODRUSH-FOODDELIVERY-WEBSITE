import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import express from 'express';
import cors from 'cors';
import { db } from '../server/db/store.js';
import { calculateOrderPricing } from '../server/services/pricing.js';
import { queryAiConcierge } from '../server/services/aiConcierge.js';

describe('End-to-End API Routes Integration', () => {
  it('retrieves restaurant catalogue and menu items', () => {
    const restaurants = db.getRestaurants();
    expect(restaurants.length).toBeGreaterThanOrEqual(6);

    const paradise = db.getRestaurantById('res_paradise');
    expect(paradise).toBeDefined();
    expect(paradise?.name).toBe('Paradise Biryani');

    const menu = db.getMenuItems('res_paradise');
    expect(menu.length).toBeGreaterThan(0);
    expect(menu.some(m => m.name.includes('Biryani'))).toBe(true);
  });

  it('validates server-side cart pricing and discount calculations', () => {
    const result = calculateOrderPricing('res_paradise', [
      { menuItemId: 'item_pb_3', quantity: 1 }
    ], 'FIRST50');

    expect(result.subtotal).toBe(289);
    expect(result.discount).toBeGreaterThan(0);
    expect(result.total).toBeLessThan(289 + 30 + 15);
  });

  it('queries AI Concierge with natural language prompts and yields structured sets', () => {
    const aiResponse = queryAiConcierge('I need vegetarian dinner for two under ₹400, with a delivery time under 40 minutes.');
    expect(aiResponse.interpretation.isVeg).toBe(true);
    expect(aiResponse.combos.length).toBeGreaterThan(0);
  });
});
