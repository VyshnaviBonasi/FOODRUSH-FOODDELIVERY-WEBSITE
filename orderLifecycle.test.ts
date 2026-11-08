import { describe, it, expect } from 'vitest';
import { db } from '../server/db/store.js';
import type { Order } from '../src/types/index.js';

describe('Order Lifecycle & State Transitions', () => {
  it('enforces linear state progression: PLACED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> OUT_FOR_DELIVERY -> DELIVERED', () => {
    const testOrderId = 'FRX-TEST-' + Date.now();
    const testOrder: Order = {
      id: testOrderId,
      userId: 'usr_customer',
      customerName: 'Test Customer',
      customerPhone: '+91 9999999999',
      restaurantId: 'res_paradise',
      restaurantName: 'Paradise Biryani',
      restaurantAddress: 'MG Road',
      items: [
        {
          menuItemId: 'item_pb_3',
          name: 'Hyderabadi Chicken Biryani',
          price: 289,
          quantity: 1,
          image: '/assets/chickenbiriyani.jpg',
          isVeg: false,
          subtotal: 289
        }
      ],
      subtotal: 289,
      tax: 14.45,
      deliveryFee: 30,
      discount: 0,
      total: 333.45,
      status: 'PLACED',
      deliveryAddress: {
        fullName: 'Test Customer',
        street: '123 Test Street',
        city: 'Chennai',
        pincode: '600001',
        phone: '+91 9999999999'
      },
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      estimatedDeliveryMinutes: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: []
    };

    db.createOrder(testOrder);

    // 1. PLACED -> CONFIRMED
    const s1 = db.updateOrderStatus(testOrderId, 'CONFIRMED', 'restaurant', 'Restaurant accepted order');
    expect(s1?.status).toBe('CONFIRMED');

    // 2. CONFIRMED -> PREPARING
    const s2 = db.updateOrderStatus(testOrderId, 'PREPARING', 'kitchen', 'Kitchen started cooking');
    expect(s2?.status).toBe('PREPARING');

    // 3. PREPARING -> READY_FOR_PICKUP
    const s3 = db.updateOrderStatus(testOrderId, 'READY_FOR_PICKUP', 'kitchen', 'Order boxed and ready');
    expect(s3?.status).toBe('READY_FOR_PICKUP');

    // 4. READY_FOR_PICKUP -> OUT_FOR_DELIVERY
    const s4 = db.updateOrderStatus(testOrderId, 'OUT_FOR_DELIVERY', 'courier', 'Picked up by delivery partner');
    expect(s4?.status).toBe('OUT_FOR_DELIVERY');

    // 5. OUT_FOR_DELIVERY -> DELIVERED
    const s5 = db.updateOrderStatus(testOrderId, 'DELIVERED', 'courier', 'Delivered to customer');
    expect(s5?.status).toBe('DELIVERED');
  });

  it('rejects invalid or illegal state transitions', () => {
    const invalidOrderId = 'FRX-INV-' + Date.now();
    const testOrder: Order = {
      id: invalidOrderId,
      userId: 'usr_customer',
      customerName: 'Test',
      customerPhone: '123',
      restaurantId: 'res_paradise',
      restaurantName: 'Paradise',
      restaurantAddress: 'Street',
      items: [],
      subtotal: 100,
      tax: 5,
      deliveryFee: 30,
      discount: 0,
      total: 135,
      status: 'DELIVERED', // Already delivered
      deliveryAddress: { fullName: 'T', street: 'S', city: 'C', pincode: 'P', phone: '1' },
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      estimatedDeliveryMinutes: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: []
    };

    db.createOrder(testOrder);

    // Cannot transition from DELIVERED to PREPARING
    expect(() => {
      db.updateOrderStatus(invalidOrderId, 'PREPARING', 'hacker', 'Illegal rewind');
    }).toThrow(/Invalid state transition/);
  });
});
