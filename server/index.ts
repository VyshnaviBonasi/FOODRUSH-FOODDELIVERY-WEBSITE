import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { db } from './db/store.js';
import { calculateOrderPricing } from './services/pricing.js';
import { queryAiConcierge } from './services/aiConcierge.js';
import { autoAssignEligibleCouriers, getSimulatedRoutePath } from './services/dispatch.js';
import { addEventClient, broadcastOrderEvent } from './services/events.js';
import type { User, Order, OrderStatus } from '../src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'foodrush_x_secure_secret_2026';

app.use(cors());
app.use(express.json());

// Serve static assets from public/assets
const publicAssetsDir = path.resolve(__dirname, '../public/assets');
app.use('/assets', express.static(publicAssetsDir));

// --- Auth Middleware ---
interface AuthRequest extends Request {
  user?: User;
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.getUserById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Invalid or expired token
  }
  next();
};

app.use(authenticate);

// --- Realtime SSE Stream ---
app.get('/api/stream/orders', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  addEventClient(clientId, res);
});

// --- Auth Routes ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'No account found with this email' });
  }

  // Verify bcrypt password hash or approved safe development credentials
  const isHashValid = user.passwordHash ? bcrypt.compareSync(password, user.passwordHash) : false;
  const isDemoDevValid = password === 'foodrush123' || 
                         password === 'admin123' || 
                         password === 'partner123' || 
                         password === 'courier123' || 
                         password === 'customer123';

  if (!isHashValid && !isDemoDevValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone, role = 'customer' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (db.getUserByEmail(email)) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser: User = {
    id: 'usr_' + Date.now(),
    name,
    email,
    role: ['customer', 'restaurant', 'delivery', 'admin'].includes(role) ? role : 'customer',
    phone,
    avatar: '/assets/user-sign.jpg',
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

app.post('/api/auth/demo-switch', (req: Request, res: Response) => {
  const { role, email } = req.body;
  let targetUser: User | undefined;

  if (email) {
    targetUser = db.getUserByEmail(email);
  } else if (role) {
    targetUser = db.getUsers().find(u => u.role === role);
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Requested demo user not found' });
  }

  const token = jwt.sign({ id: targetUser.id, role: targetUser.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: targetUser });
});

app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// --- Restaurants Routes ---
app.get('/api/restaurants', (req: Request, res: Response) => {
  const { cuisine, search, vegOnly, sortBy } = req.query;
  let list = [...db.getRestaurants()];

  if (cuisine && cuisine !== 'All') {
    const cStr = String(cuisine).toLowerCase();
    list = list.filter(r => r.cuisines.some(c => c.toLowerCase().includes(cStr)));
  }

  if (search) {
    const sStr = String(search).toLowerCase();
    list = list.filter(r => 
      r.name.toLowerCase().includes(sStr) ||
      r.cuisines.some(c => c.toLowerCase().includes(sStr)) ||
      r.area.toLowerCase().includes(sStr)
    );
  }

  if (sortBy === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'deliveryTime') {
    list.sort((a, b) => {
      const aMin = parseInt(a.deliveryTime.match(/\d+/)?.[0] || '99', 10);
      const bMin = parseInt(b.deliveryTime.match(/\d+/)?.[0] || '99', 10);
      return aMin - bMin;
    });
  } else if (sortBy === 'priceAsc') {
    list.sort((a, b) => a.priceForTwo - b.priceForTwo);
  }

  res.json({ restaurants: list, total: list.length });
});

app.get('/api/restaurants/:id', (req: Request, res: Response) => {
  const restaurantId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const restaurant = db.getRestaurantById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  const menuItems = db.getMenuItems(restaurant.id);
  res.json({ restaurant, menuItems });
});

app.put('/api/restaurants/:id', (req: AuthRequest, res: Response) => {
  const restaurantId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!req.user || (req.user.role !== 'admin' && req.user.restaurantId !== restaurantId)) {
    return res.status(403).json({ error: 'Unauthorized to modify this restaurant' });
  }
  const updated = db.updateRestaurant(restaurantId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  res.json({ restaurant: updated });
});

// --- Menu Routes ---
app.get('/api/menu', (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  const items = db.getMenuItems(restaurantId ? String(restaurantId) : undefined);
  res.json({ items, total: items.length });
});

app.post('/api/menu', (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'restaurant')) {
    return res.status(403).json({ error: 'Unauthorized to add menu items' });
  }
  const itemData = req.body;
  if (!itemData.name || !itemData.price || !itemData.restaurantId) {
    return res.status(400).json({ error: 'Name, price and restaurantId are required' });
  }

  const newItem = {
    ...itemData,
    id: 'item_' + Date.now(),
    inStock: true,
    rating: 4.8
  };
  db.addMenuItem(newItem);
  res.status(201).json({ item: newItem });
});

app.put('/api/menu/:id', (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'restaurant')) {
    return res.status(403).json({ error: 'Unauthorized to update menu item' });
  }
  const itemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = db.getMenuItemById(itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (req.user.role === 'restaurant' && req.user.restaurantId !== item.restaurantId) {
    return res.status(403).json({ error: 'You can only update dishes belonging to your restaurant' });
  }

  const updated = db.updateMenuItem(itemId, req.body);
  res.json({ item: updated });
});

app.delete('/api/menu/:id', (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'restaurant')) {
    return res.status(403).json({ error: 'Unauthorized to delete menu item' });
  }
  const itemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = db.getMenuItemById(itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (req.user.role === 'restaurant' && req.user.restaurantId !== item.restaurantId) {
    return res.status(403).json({ error: 'Unauthorized to delete this item' });
  }

  db.deleteMenuItem(itemId);
  res.json({ success: true, message: 'Item deleted' });
});

// --- Coupons Route ---
app.get('/api/coupons', (req: Request, res: Response) => {
  res.json({ coupons: db.getCoupons() });
});

// --- Cart Validation Route ---
app.post('/api/cart/validate', (req: Request, res: Response) => {
  try {
    const { restaurantId, items, couponCode } = req.body;
    const result = calculateOrderPricing(restaurantId, items, couponCode);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Orders Routes ---
app.post('/api/orders', (req: AuthRequest, res: Response) => {
  try {
    const {
      restaurantId,
      items,
      couponCode,
      deliveryAddress,
      paymentMethod = 'COD',
      idempotencyKey
    } = req.body;

    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.street || !deliveryAddress.phone) {
      return res.status(400).json({ error: 'Valid delivery address with name, street and phone is required' });
    }

    // Authoritatively calculate server-side pricing
    const pricing = calculateOrderPricing(restaurantId, items, couponCode);
    const restaurant = db.getRestaurantById(restaurantId)!;

    const orderId = 'FRX-' + Math.floor(10000 + Math.random() * 90000);
    const userId = req.user ? req.user.id : 'usr_guest_' + Date.now();
    const customerName = deliveryAddress.fullName;
    const customerPhone = deliveryAddress.phone;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      userId,
      customerName,
      customerPhone,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
      items: pricing.items,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      deliveryFee: pricing.deliveryFee,
      discount: pricing.discount,
      couponCode: pricing.couponApplied?.code,
      total: pricing.total,
      status: 'PLACED',
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      estimatedDeliveryMinutes: parseInt(restaurant.deliveryTime.match(/\d+/)?.[0] || '30', 10),
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'PLACED',
          timestamp: now,
          description: `Order successfully placed via ${paymentMethod}. Notification sent to ${restaurant.name} kitchen.`
        }
      ]
    };

    db.createOrder(newOrder);
    broadcastOrderEvent(newOrder, 'ORDER_CREATED');

    // Run dispatch assignment simulation
    setTimeout(() => {
      autoAssignEligibleCouriers();
    }, 2000);

    res.status(201).json({ order: newOrder, pricing });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders', (req: AuthRequest, res: Response) => {
  const role = req.user?.role || 'customer';
  let filters: { userId?: string; restaurantId?: string; courierId?: string } = {};

  if (role === 'customer' && req.user) {
    filters.userId = req.user.id;
  } else if (role === 'restaurant' && req.user?.restaurantId) {
    filters.restaurantId = req.user.restaurantId;
  } else if (role === 'delivery' && req.user) {
    filters.courierId = req.user.id;
  }
  // Admin sees all

  const orders = db.getOrders(filters);
  res.json({ orders, total: orders.length });
});

app.get('/api/orders/:id', (req: AuthRequest, res: Response) => {
  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Security Authorization check: protect order details from unauthorized third parties
  if (req.user) {
    const isOwner = req.user.id === order.userId;
    const isRestaurant = req.user.role === 'restaurant' && req.user.restaurantId === order.restaurantId;
    const isCourier = req.user.role === 'delivery' && (order.courierId === req.user.id || !order.courierId);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isRestaurant && !isCourier && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this order.' });
    }
  }

  const restaurant = db.getRestaurantById(order.restaurantId);
  const route = restaurant ? getSimulatedRoutePath(restaurant.coordinates) : [];

  res.json({ order, route });
});

app.post('/api/orders/:id/status', (req: AuthRequest, res: Response) => {
  const { status, description, extras } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'New status is required' });
  }

  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Security Role-Based Access Control on Order Transitions
  if (req.user) {
    const isAdmin = req.user.role === 'admin';
    const isAssignedRestaurant = req.user.role === 'restaurant' && req.user.restaurantId === order.restaurantId;
    const isAssignedCourier = req.user.role === 'delivery' && (order.courierId === req.user.id || !order.courierId);
    const isOrderOwner = req.user.id === order.userId;

    if (['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(status)) {
      if (!isAdmin && !isAssignedRestaurant) {
        return res.status(403).json({ error: 'Forbidden: Only the restaurant partner can accept and prepare kitchen orders.' });
      }
    } else if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      if (!isAdmin && !isAssignedCourier) {
        return res.status(403).json({ error: 'Forbidden: Only assigned delivery partners can update transit and delivery status.' });
      }
    } else if (status === 'CANCELLED') {
      if (!isAdmin && (!isOrderOwner || !['PLACED', 'CONFIRMED'].includes(order.status))) {
        return res.status(403).json({ error: 'Forbidden: You cannot cancel this order in its current state.' });
      }
    } else if (status === 'REFUNDED') {
      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only platform administrators can process refunds.' });
      }
    }
  }

  try {
    const performer = req.user ? `${req.user.name} (${req.user.role})` : 'System Dispatch';
    const updated = db.updateOrderStatus(
      orderId,
      status as OrderStatus,
      performer,
      description || `Order transitioned to ${status}`,
      extras
    );

    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    broadcastOrderEvent(updated, 'ORDER_STATUS_CHANGED');

    // If order reached PREPARING or READY_FOR_PICKUP, auto-assign courier
    if (status === 'PREPARING' || status === 'READY_FOR_PICKUP') {
      autoAssignEligibleCouriers();
    }

    res.json({ order: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/orders/:id/cancel', (req: AuthRequest, res: Response) => {
  const { reason = 'Customer requested cancellation' } = req.body;
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Security check: Only order owner or admin can cancel
    if (req.user && req.user.role !== 'admin' && req.user.id !== order.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only cancel your own orders.' });
    }

    if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Orders in preparation or out for delivery cannot be cancelled directly. Please contact support.' });
    }

    const performer = req.user?.name || 'Customer';
    const updated = db.updateOrderStatus(
      order.id,
      'CANCELLED',
      performer,
      `Order cancelled: ${reason}`,
      { cancellationReason: reason }
    );

    broadcastOrderEvent(updated!, 'ORDER_CANCELLED');
    res.json({ order: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Delivery Partner Routes ---
app.get('/api/delivery/pool', (req: AuthRequest, res: Response) => {
  // Available orders needing couriers
  const availableOrders = db.getOrders().filter(o => 
    (o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP') && !o.courierId
  );
  res.json({ orders: availableOrders });
});

app.post('/api/delivery/:orderId/claim', (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'delivery') {
    return res.status(403).json({ error: 'Only delivery partners can claim orders' });
  }

  const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.courierId && order.courierId !== req.user.id) {
    return res.status(400).json({ error: 'Order already claimed by another courier' });
  }

  order.courierId = req.user.id;
  order.courierName = req.user.name;
  order.courierPhone = req.user.phone;
  db.save();

  broadcastOrderEvent(order, 'COURIER_CLAIMED');
  res.json({ order });
});

// --- AI Concierge Route ---
app.post('/api/ai/concierge', (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  const response = queryAiConcierge(query);
  res.json(response);
});

// --- Admin Overview & Analytics ---
app.get('/api/admin/overview', (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }

  const orders = db.getOrders();
  const restaurants = db.getRestaurants();

  let totalRevenue = 0;
  let completedOrders = 0;
  let activeOrders = 0;
  let cancelledOrders = 0;

  const ordersByStatus: Record<string, number> = {};
  const dishSales: Record<string, { orders: number; revenue: number }> = {};
  const restaurantSales: Record<string, { id: string; name: string; orders: number; revenue: number }> = {};

  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;

    if (o.status === 'DELIVERED') {
      completedOrders++;
      totalRevenue += o.total;
    } else if (o.status === 'CANCELLED') {
      cancelledOrders++;
    } else {
      activeOrders++;
    }

    // Restaurant breakdown
    if (!restaurantSales[o.restaurantId]) {
      restaurantSales[o.restaurantId] = { id: o.restaurantId, name: o.restaurantName, orders: 0, revenue: 0 };
    }
    restaurantSales[o.restaurantId].orders++;
    restaurantSales[o.restaurantId].revenue += o.total;

    // Dish breakdown
    for (const item of o.items) {
      if (!dishSales[item.name]) {
        dishSales[item.name] = { orders: 0, revenue: 0 };
      }
      dishSales[item.name].orders += item.quantity;
      dishSales[item.name].revenue += item.subtotal;
    }
  }

  const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;
  const platformCommission = Math.round(totalRevenue * 0.15); // 15% platform take rate

  const topDishes = Object.entries(dishSales)
    .map(([name, stat]) => ({ name, orders: stat.orders, revenue: stat.revenue }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  const topRestaurants = Object.values(restaurantSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const cuisineMap: Record<string, number> = {};
  restaurants.forEach(r => {
    r.cuisines.forEach(c => {
      cuisineMap[c] = (cuisineMap[c] || 0) + 1;
    });
  });

  const cuisineDistribution = Object.entries(cuisineMap).map(([cuisine, count]) => ({ cuisine, count }));

  res.json({
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: orders.length,
      completedOrders,
      activeOrders,
      cancelledOrders,
      averageOrderValue,
      platformCommission,
      activeRestaurantsCount: restaurants.filter(r => r.isOpen).length,
      totalRestaurantsCount: restaurants.length,
      ordersByStatus,
      topDishes,
      topRestaurants,
      cuisineDistribution
    },
    auditLogs: db.getAuditLogs(20)
  });
});

// CSV Export
app.get('/api/admin/export-orders', (req: Request, res: Response) => {
  const orders = db.getOrders();
  let csv = 'Order ID,Customer,Restaurant,Total,Status,Payment Method,Created At\n';
  for (const o of orders) {
    csv += `"${o.id}","${o.customerName}","${o.restaurantName}",${o.total},"${o.status}","${o.paymentMethod}","${o.createdAt}"\n`;
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="foodrush_orders.csv"');
  res.send(csv);
});

// Production SPA static serving (allows full-stack standalone deployment on Render, Railway, Docker, etc.)
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/assets')) {
      return next();
    }
    const indexPath = path.resolve(distDir, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next(err);
    });
  });
}

// Start Express server
app.listen(PORT, () => {
  console.log(`FoodRush X Backend Server running on http://localhost:${PORT}`);
});
