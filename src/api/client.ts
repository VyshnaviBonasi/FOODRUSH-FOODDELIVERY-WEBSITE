import type {
  User,
  Restaurant,
  MenuItem,
  Order,
  Coupon,
  OrderStatus,
  AnalyticsSummary,
} from '../types';

// Support dynamic production API URL if frontend and backend are hosted on different domains
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_BASE = BASE_URL ? `${BASE_URL}/api` : '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('foodrush_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API Request failed');
  }
  return data;
}

export const api = {
  auth: {
    login: (email: string, password?: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: password || 'customer123' }),
      }),
    register: (userData: Partial<User> & { password?: string }) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () => request<{ user: User }>('/auth/me'),
    demoSwitch: (role: string, email?: string) =>
      request<{ token: string; user: User }>('/auth/demo-switch', {
        method: 'POST',
        body: JSON.stringify({ role, email }),
      }),
  },

  restaurants: {
    getAll: (params?: { cuisine?: string; search?: string; sortBy?: string }) => {
      const q = new URLSearchParams();
      if (params?.cuisine) q.append('cuisine', params.cuisine);
      if (params?.search) q.append('search', params.search);
      if (params?.sortBy) q.append('sortBy', params.sortBy);
      return request<{ restaurants: Restaurant[]; total: number }>(`/restaurants?${q.toString()}`);
    },
    getById: (id: string) =>
      request<{ restaurant: Restaurant; menuItems: MenuItem[] }>(`/restaurants/${id}`),
    update: (id: string, updates: Partial<Restaurant>) =>
      request<{ restaurant: Restaurant }>(`/restaurants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },

  menu: {
    getAll: (restaurantId?: string) =>
      request<{ items: MenuItem[]; total: number }>(
        restaurantId ? `/menu?restaurantId=${restaurantId}` : '/menu'
      ),
    updateItem: (id: string, updates: Partial<MenuItem>) =>
      request<{ item: MenuItem }>(`/menu/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    addItem: (item: Partial<MenuItem>) =>
      request<{ item: MenuItem }>('/menu', {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    deleteItem: (id: string) =>
      request<{ success: boolean; message: string }>(`/menu/${id}`, {
        method: 'DELETE',
      }),
  },

  coupons: {
    getAll: () => request<{ coupons: Coupon[] }>('/coupons'),
  },

  cart: {
    validate: (restaurantId: string, items: any[], couponCode?: string) =>
      request<{
        items: any[];
        subtotal: number;
        tax: number;
        deliveryFee: number;
        discount: number;
        total: number;
        couponApplied?: Coupon;
        errors?: string[];
      }>('/cart/validate', {
        method: 'POST',
        body: JSON.stringify({ restaurantId, items, couponCode }),
      }),
  },

  orders: {
    create: (orderPayload: any) =>
      request<{ order: Order; pricing: any }>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      }),
    getAll: () => request<{ orders: Order[]; total: number }>('/orders'),
    getById: (id: string) =>
      request<{ order: Order; route: { lat: number; lng: number }[] }>(`/orders/${id}`),
    updateStatus: (id: string, status: OrderStatus, description?: string, extras?: any) =>
      request<{ order: Order }>(`/orders/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, description, extras }),
      }),
    cancel: (id: string, reason?: string) =>
      request<{ order: Order }>(`/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  delivery: {
    getPool: () => request<{ orders: Order[] }>('/delivery/pool'),
    claim: (orderId: string) =>
      request<{ order: Order }>(`/delivery/${orderId}/claim`, {
        method: 'POST',
      }),
  },

  admin: {
    getOverview: () =>
      request<{
        summary: AnalyticsSummary & {
          activeRestaurantsCount: number;
          totalRestaurantsCount: number;
        };
        auditLogs: any[];
      }>('/admin/overview'),
  },

  ai: {
    queryConcierge: (query: string) =>
      request<any>('/ai/concierge', {
        method: 'POST',
        body: JSON.stringify({ query }),
      }),
  },

  streamOrders: (onMessage: (event: { type: string; order: Order }) => void) => {
    const eventSource = new EventSource(`${API_BASE}/stream/orders`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type !== 'CONNECTED') {
          onMessage(data);
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
    return () => eventSource.close();
  },
};
