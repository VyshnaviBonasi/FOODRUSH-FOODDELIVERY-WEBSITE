export type UserRole = 'customer' | 'restaurant' | 'delivery' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  passwordHash?: string;
  restaurantId?: string; // If role === 'restaurant'
  deliveryVehicle?: string; // If role === 'delivery'
  deliveryStatus?: 'online' | 'offline' | 'busy';
  rating?: number;
  createdAt: string;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  cuisine: string;
  isVeg: boolean;
  isPopular?: boolean;
  spiceLevel?: 'mild' | 'medium' | 'spicy';
  rating: number;
  preparationTimeMinutes: number;
  inStock: boolean;
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
  allergens?: string[];
  calories?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  image: string;
  bannerImage: string;
  cuisines: string[];
  rating: number;
  ratingCount: number;
  deliveryTime: string; // e.g. "25-35 mins"
  deliveryFee: number;
  priceForTwo: number;
  address: string;
  area: string;
  city: string;
  coordinates: { lat: number; lng: number };
  isOpen: boolean;
  isFeatured?: boolean;
  categories: string[];
  totalOrdersServed?: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItemCustomization {
  variant?: { id: string; name: string; price: number };
  addons?: { id: string; name: string; price: number }[];
  specialInstructions?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  isVeg: boolean;
  customization?: OrderItemCustomization;
  subtotal: number;
}

export interface DeliveryAddress {
  fullName: string;
  street: string;
  landmark?: string;
  city: string;
  pincode: string;
  phone: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
  performedBy?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'NETBANKING';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierCoords?: { lat: number; lng: number };
  estimatedDeliveryMinutes: number;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimelineEvent[];
  cancellationReason?: string;
}

export interface Coupon {
  code: string;
  title: string;
  discountPercent: number;
  maxDiscount: number;
  minOrderValue: number;
  description: string;
  expiryDate: string;
  applicableCategory?: string;
  image?: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  platformCommission: number;
  topRestaurants: { id: string; name: string; orders: number; revenue: number }[];
  topDishes: { name: string; orders: number; revenue: number }[];
  cuisineDistribution: { cuisine: string; count: number }[];
  ordersByStatus: Record<string, number>;
}
