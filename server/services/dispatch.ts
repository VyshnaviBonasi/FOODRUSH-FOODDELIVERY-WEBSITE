import { db } from '../db/store.js';
import { broadcastOrderEvent } from './events.js';
import type { Order } from '../../src/types/index.js';

export function autoAssignEligibleCouriers(): { assignedCount: number; assignedOrders: string[] } {
  const pendingOrders = db.getOrders().filter(o => 
    (o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP') && !o.courierId
  );

  const couriers = db.getUsers().filter(u => u.role === 'delivery' && u.deliveryStatus === 'online');
  if (couriers.length === 0 || pendingOrders.length === 0) {
    return { assignedCount: 0, assignedOrders: [] };
  }

  const assignedOrders: string[] = [];

  for (const order of pendingOrders) {
    // Pick the courier with fewest active deliveries
    const activeAssignments = couriers.map(c => ({
      courier: c,
      activeCount: db.getOrders({ courierId: c.id }).filter(o => o.status === 'OUT_FOR_DELIVERY' || o.status === 'READY_FOR_PICKUP').length
    })).sort((a, b) => a.activeCount - b.activeCount);

    const chosen = activeAssignments[0]?.courier;
    if (chosen) {
      order.courierId = chosen.id;
      order.courierName = chosen.name;
      order.courierPhone = chosen.phone;
      db.save();
      broadcastOrderEvent(order, 'COURIER_ASSIGNED');
      assignedOrders.push(order.id);
    }
  }

  return { assignedCount: assignedOrders.length, assignedOrders };
}

// Generate GPS coordinate path between restaurant and customer
export function getSimulatedRoutePath(restaurantCoords: { lat: number; lng: number }, steps: number = 10) {
  // Destination: Anna Nagar, Chennai ~ 13.0850, 80.2100
  const dest = { lat: 13.0850, lng: 80.2100 };
  const points: { lat: number; lng: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    points.push({
      lat: Number((restaurantCoords.lat + (dest.lat - restaurantCoords.lat) * fraction).toFixed(6)),
      lng: Number((restaurantCoords.lng + (dest.lng - restaurantCoords.lng) * fraction).toFixed(6))
    });
  }

  return points;
}
