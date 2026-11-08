import { describe, it, expect } from 'vitest';
import { db } from '../server/db/store.js';
import { calculateOrderPricing } from '../server/services/pricing.js';
import { queryAiConcierge } from '../server/services/aiConcierge.js';
import { autoAssignEligibleCouriers, getSimulatedRoutePath } from '../server/services/dispatch.js';
import type { Order } from '../src/types/index.js';

describe('PHASE 2: Rigorous Functional & Workflow Audit', () => {

  describe('1. Restaurant Discovery & Catalog Search', () => {
    it('retrieves all verified restaurants with complete metadata', () => {
      const restaurants = db.getRestaurants();
      expect(restaurants.length).toBeGreaterThanOrEqual(8);
      for (const r of restaurants) {
        expect(r.id).toBeDefined();
        expect(r.name).toBeDefined();
        expect(r.rating).toBeGreaterThan(0);
        expect(r.deliveryFee).toBeGreaterThanOrEqual(0);
        expect(r.cuisines.length).toBeGreaterThan(0);
        expect(r.coordinates.lat).toBeDefined();
        expect(r.coordinates.lng).toBeDefined();
      }
    });

    it('filters restaurants accurately by cuisine', () => {
      const biryaniSpots = db.getRestaurants().filter(r => 
        r.cuisines.some(c => c.toLowerCase().includes('biryani'))
      );
      expect(biryaniSpots.length).toBeGreaterThanOrEqual(2);
      expect(biryaniSpots.some(r => r.name === 'Paradise Biryani')).toBe(true);
      expect(biryaniSpots.some(r => r.name === 'Nawabi Dum House')).toBe(true);
    });

    it('finds dishes matching search keywords in dish name or description', () => {
      const allDishes = db.getMenuItems();
      const paneerDishes = allDishes.filter(d => 
        d.name.toLowerCase().includes('paneer') || d.description.toLowerCase().includes('paneer')
      );
      expect(paneerDishes.length).toBeGreaterThanOrEqual(3);
      for (const d of paneerDishes) {
        expect(d.isVeg).toBe(true);
      }
    });
  });

  describe('2. Dish Customization & Server Total Verification', () => {
    it('correctly prices variants and add-on combinations', () => {
      const pricing = calculateOrderPricing('res_paradise', [
        {
          menuItemId: 'item_pb_3', // Hyderabadi Chicken Biryani (base 289)
          quantity: 2,
          variantId: 'v_special', // Special variant (429)
          addonIds: ['a_raita', 'a_egg'] // 35 + 30 = 65 -> 494 per item
        }
      ]);

      // 494 * 2 = 988 subtotal
      expect(pricing.subtotal).toBe(988);
      expect(pricing.items[0].price).toBe(494);
      // 5% GST on 988 = 49.40
      expect(pricing.tax).toBe(49.4);
      expect(pricing.deliveryFee).toBe(30);
      expect(pricing.total).toBe(1067.4);
    });

    it('server ignores client-manipulated prices and enforces catalog price', () => {
      // Simulate client attempting to pass price: 1
      const clientPayloadItem: any = {
        menuItemId: 'item_pb_1', // Chicken 65 (₹299 in catalog)
        quantity: 1,
        price: 1, // Manipulated
        subtotal: 1 // Manipulated
      };

      const result = calculateOrderPricing('res_paradise', [clientPayloadItem]);
      // Must charge 299, NOT 1
      expect(result.subtotal).toBe(299);
      expect(result.items[0].price).toBe(299);
    });

    it('rejects items belonging to a different restaurant in the same order', () => {
      expect(() => {
        calculateOrderPricing('res_paradise', [
          { menuItemId: 'item_pb_1', quantity: 1 }, // Paradise
          { menuItemId: 'item_bh_1', quantity: 1 }  // Burger Hub
        ]);
      }).toThrow(/does not belong to/);
    });

    it('rejects sold-out items', () => {
      // Temporarily mark item sold out
      const item = db.getMenuItemById('item_pb_6');
      if (item) {
        item.inStock = false;
        expect(() => {
          calculateOrderPricing('res_paradise', [{ menuItemId: 'item_pb_6', quantity: 1 }]);
        }).toThrow(/sold out/);
        item.inStock = true; // restore
      }
    });
  });

  describe('3. Coupon Rules & Edge Cases', () => {
    it('enforces minimum order spend for BIRYANI145', () => {
      // BIRYANI145 requires ₹299 min spend. Order of ₹49 should fail coupon validation.
      const pricing = calculateOrderPricing('res_paradise', [
        { menuItemId: 'item_pb_6', quantity: 1 } // ₹49
      ], 'BIRYANI145');

      expect(pricing.discount).toBe(0);
      expect(pricing.errors).toBeDefined();
      expect(pricing.errors?.[0]).toContain('minimum order of ₹299');
    });

    it('caps percentage discount at maxDiscount limit', () => {
      // FIRST50 is 50% discount capped at ₹150 max.
      // Order of 3 biryanis = ₹867. 50% would be 433.5, but discount must be 150.
      const pricing = calculateOrderPricing('res_paradise', [
        { menuItemId: 'item_pb_3', quantity: 3 }
      ], 'FIRST50');

      expect(pricing.discount).toBe(150);
      expect(pricing.couponApplied?.code).toBe('FIRST50');
    });

    it('handles non-existent or blank coupon codes cleanly', () => {
      const pricing = calculateOrderPricing('res_paradise', [
        { menuItemId: 'item_pb_3', quantity: 1 }
      ], 'BOGUS_CODE');

      expect(pricing.discount).toBe(0);
      expect(pricing.errors?.[0]).toContain('invalid');
    });
  });

  describe('4. Order Lifecycle, Transitions & Cancellation Authorization', () => {
    const testOrderId = 'FRX-AUDIT-' + Date.now();

    it('creates an order with PLACED status and records timeline event', () => {
      const pricing = calculateOrderPricing('res_paradise', [
        { menuItemId: 'item_pb_3', quantity: 1 }
      ]);

      const order: Order = {
        id: testOrderId,
        userId: 'usr_customer',
        customerName: 'Bonasi Vyshnavi',
        customerPhone: '+91 9876543299',
        restaurantId: 'res_paradise',
        restaurantName: 'Paradise Biryani',
        restaurantAddress: 'MG Road',
        items: pricing.items,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        deliveryFee: pricing.deliveryFee,
        discount: pricing.discount,
        total: pricing.total,
        status: 'PLACED',
        deliveryAddress: {
          fullName: 'Bonasi Vyshnavi',
          street: 'Anna Nagar',
          city: 'Chennai',
          pincode: '600040',
          phone: '+91 9876543299'
        },
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        estimatedDeliveryMinutes: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          { status: 'PLACED', timestamp: new Date().toISOString(), description: 'Order Placed' }
        ]
      };

      db.createOrder(order);
      const retrieved = db.getOrderById(testOrderId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.status).toBe('PLACED');
      expect(retrieved?.timeline.length).toBe(1);
    });

    it('permits valid state transitions and appends timeline events', () => {
      // PLACED -> CONFIRMED
      db.updateOrderStatus(testOrderId, 'CONFIRMED', 'restaurant', 'Accepted by kitchen');
      expect(db.getOrderById(testOrderId)?.status).toBe('CONFIRMED');

      // CONFIRMED -> PREPARING
      db.updateOrderStatus(testOrderId, 'PREPARING', 'kitchen', 'Cooking on flame');
      expect(db.getOrderById(testOrderId)?.status).toBe('PREPARING');

      // PREPARING -> READY_FOR_PICKUP
      db.updateOrderStatus(testOrderId, 'READY_FOR_PICKUP', 'kitchen', 'Packed with seal');
      expect(db.getOrderById(testOrderId)?.status).toBe('READY_FOR_PICKUP');

      // READY_FOR_PICKUP -> OUT_FOR_DELIVERY
      db.updateOrderStatus(testOrderId, 'OUT_FOR_DELIVERY', 'courier', 'Picked up by rider');
      expect(db.getOrderById(testOrderId)?.status).toBe('OUT_FOR_DELIVERY');

      // OUT_FOR_DELIVERY -> DELIVERED
      db.updateOrderStatus(testOrderId, 'DELIVERED', 'courier', 'Delivered at doorstep');
      expect(db.getOrderById(testOrderId)?.status).toBe('DELIVERED');
      expect(db.getOrderById(testOrderId)?.timeline.length).toBe(6);
    });

    it('rejects backward or illegal state leaps', () => {
      // Cannot transition DELIVERED -> PLACED
      expect(() => {
        db.updateOrderStatus(testOrderId, 'PLACED', 'attacker', 'Rewind state');
      }).toThrow(/Invalid state transition/);

      // Cannot transition DELIVERED -> PREPARING
      expect(() => {
        db.updateOrderStatus(testOrderId, 'PREPARING', 'attacker', 'Rewind state');
      }).toThrow(/Invalid state transition/);
    });
  });

  describe('5. Multi-Role Workflows: Restaurant, Courier & Admin', () => {
    it('isolates orders for restaurant partner', () => {
      const paradiseOrders = db.getOrders({ restaurantId: 'res_paradise' });
      for (const o of paradiseOrders) {
        expect(o.restaurantId).toBe('res_paradise');
      }
    });

    it('courier assignment simulation auto-assigns active available orders', () => {
      const result = autoAssignEligibleCouriers();
      expect(result).toBeDefined();
      expect(typeof result.assignedCount).toBe('number');
    });

    it('computes accurate route waypoint coordinates for simulated navigation', () => {
      const waypoints = getSimulatedRoutePath({ lat: 13.0827, lng: 80.2707 }, 5);
      expect(waypoints.length).toBe(6);
      expect(waypoints[0].lat).toBe(13.0827);
      expect(waypoints[5].lat).toBe(13.085);
    });
  });

  describe('6. AI Food Concierge Natural Language Parsing', () => {
    it('handles complex multi-constraint prompt: "I need vegetarian dinner for two under ₹400, with a delivery time under 40 minutes."', () => {
      const res = queryAiConcierge('I need vegetarian dinner for two under ₹400, with a delivery time under 40 minutes.');
      expect(res.mode).toBe('deterministic_engine');
      expect(res.interpretation.budget).toBe(400);
      expect(res.interpretation.isVeg).toBe(true);
      expect(res.interpretation.maxDeliveryTimeMinutes).toBe(40);
      expect(res.interpretation.partySize).toBe(2);

      // Every returned combo must satisfy constraints
      for (const combo of res.combos) {
        expect(combo.totalPrice).toBeLessThanOrEqual(400);
        for (const item of combo.items) {
          expect(item.dish.isVeg).toBe(true);
        }
      }
    });

    it('handles query with no match gracefully', () => {
      // Impossible budget of ₹10 for dinner
      const res = queryAiConcierge('I want full biryani meal under ₹10');
      expect(res.combos.length).toBe(0);
      expect(res.summaryMessage).toContain('No exact catalogue dishes matched');
    });
  });
});
