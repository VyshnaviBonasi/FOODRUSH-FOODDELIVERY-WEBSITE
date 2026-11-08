import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Package, 
  DollarSign, 
  Utensils, 
  Plus, 
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api } from '../api/client';
import type { Order, MenuItem, Restaurant, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RestaurantDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'kds' | 'menu' | 'analytics'>('kds');
  const [loading, setLoading] = useState(true);

  // Restaurant ID from user profile or default to Paradise Biryani
  const restaurantId = user?.restaurantId || 'res_paradise';

  const loadData = async () => {
    try {
      const ordersRes = await api.orders.getAll();
      const rOrders = ordersRes.orders.filter((o) => o.restaurantId === restaurantId);
      setOrders(rOrders);

      const menuRes = await api.menu.getAll(restaurantId);
      setMenuItems(menuRes.items);
    } catch (err) {
      console.error('Failed to load restaurant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live incoming orders
    const unsubscribe = api.streamOrders((data) => {
      if (data.order && data.order.restaurantId === restaurantId) {
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.id === data.order.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = data.order;
            return next;
          }
          return [data.order, ...prev];
        });
        toast(`Kitchen Alert: Order ${data.order.id} update!`, 'info');
      }
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, description: string) => {
    try {
      const res = await api.orders.updateStatus(orderId, newStatus, description);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      toast(`Order ${orderId} moved to ${newStatus}`, 'success');
    } catch (err: any) {
      toast(err.message || 'Status transition failed', 'error');
    }
  };

  const handleToggleStock = async (item: MenuItem) => {
    try {
      const res = await api.menu.updateItem(item.id, { inStock: !item.inStock });
      setMenuItems((prev) => prev.map((m) => (m.id === item.id ? res.item : m)));
      toast(`"${item.name}" is now ${!item.inStock ? 'In Stock' : 'Marked Sold Out'}`, 'info');
    } catch (err: any) {
      toast('Failed to update stock: ' + err.message, 'error');
    }
  };

  const handlePriceUpdate = async (item: MenuItem) => {
    const newPriceStr = window.prompt(`Enter new price for "${item.name}":`, String(item.price));
    if (!newPriceStr) return;
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast('Invalid price', 'error');
      return;
    }

    try {
      const res = await api.menu.updateItem(item.id, { price: newPrice });
      setMenuItems((prev) => prev.map((m) => (m.id === item.id ? res.item : m)));
      toast(`Updated price of "${item.name}" to ₹${newPrice}`, 'success');
    } catch (err: any) {
      toast('Failed to update price: ' + err.message, 'error');
    }
  };

  // Calculations
  const incomingQueue = orders.filter((o) => o.status === 'PLACED');
  const preparingQueue = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING');
  const readyQueue = orders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const totalRevenue = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#CAF509] text-black text-xs font-black uppercase">
              Kitchen Display Mode (KDS)
            </span>
            <span className="text-xs text-gray-400">· Connected Partner Terminal</span>
          </div>
          <h1 className="text-3xl font-black text-white">Paradise Biryani Kitchen Command</h1>
          <p className="text-xs text-gray-400 mt-1">Manage incoming tickets, kitchen preparation queues and menu stock</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-[#1C1715] hover:bg-[#2A2320] border border-[#2E2623] text-gray-300"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4 text-[#CAF509]" />
          </button>

          <div className="flex bg-[#181311] border border-[#2E2623] rounded-2xl p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('kds')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'kds' ? 'bg-[#CAF509] text-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Kitchen Orders ({incomingQueue.length + preparingQueue.length})
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'menu' ? 'bg-[#CAF509] text-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Menu & Stock ({menuItems.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
          <span className="text-xs font-bold text-gray-400 block mb-1">New Incoming Tickets</span>
          <p className="text-3xl font-black text-[#FF7A00]">{incomingQueue.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
          <span className="text-xs font-bold text-gray-400 block mb-1">Currently Cooking</span>
          <p className="text-3xl font-black text-[#CAF509]">{preparingQueue.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
          <span className="text-xs font-bold text-gray-400 block mb-1">Ready for Pickup</span>
          <p className="text-3xl font-black text-white">{readyQueue.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
          <span className="text-xs font-bold text-gray-400 block mb-1">Delivered Revenue</span>
          <p className="text-3xl font-black text-[#CAF509]">₹{totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'kds' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: New Incoming Orders (Needs Acceptance) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#261E1C]">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A00] animate-ping" />
                1. New Orders ({incomingQueue.length})
              </h3>
            </div>

            {incomingQueue.length === 0 ? (
              <div className="p-8 text-center bg-[#151110] rounded-2xl border border-[#261E1C] text-xs text-gray-500">
                No pending tickets waiting for acceptance
              </div>
            ) : (
              incomingQueue.map((o) => (
                <div key={o.id} className="p-5 rounded-2xl bg-[#181311] border-2 border-[#FF7A00]/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#CAF509]">{o.id}</span>
                      <p className="text-xs text-gray-400">{o.customerName} · {o.customerPhone}</p>
                    </div>
                    <span className="text-xs font-black text-white">₹{o.total}</span>
                  </div>

                  <div className="space-y-1.5 py-2 border-y border-[#261E1C] text-xs">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between font-bold text-white">
                        <span>{i.quantity}x {i.name}</span>
                        <span>₹{i.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'CONFIRMED', 'Kitchen accepted order ticket')}
                      className="flex-1 py-2 rounded-xl bg-[#CAF509] hover:bg-[#B6DD06] text-black font-black text-xs transition-all"
                    >
                      Accept Order
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'CANCELLED', 'Kitchen rejected: Out of capacity')}
                      className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: Preparation Queue (Cooking in Kitchen) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#261E1C]">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-[#CAF509]" />
                2. In Preparation ({preparingQueue.length})
              </h3>
            </div>

            {preparingQueue.length === 0 ? (
              <div className="p-8 text-center bg-[#151110] rounded-2xl border border-[#261E1C] text-xs text-gray-500">
                Kitchen queue is clear
              </div>
            ) : (
              preparingQueue.map((o) => (
                <div key={o.id} className="p-5 rounded-2xl bg-[#181311] border border-[#261E1C] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-white">{o.id}</span>
                      <p className="text-xs text-gray-400">Order by {o.customerName}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold">
                      {o.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-2 border-y border-[#261E1C] text-xs">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-gray-200">
                        <span>{i.quantity}x {i.name}</span>
                        <span>₹{i.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    {o.status === 'CONFIRMED' ? (
                      <button
                        onClick={() => handleUpdateStatus(o.id, 'PREPARING', 'Chef started preparing dishes on flame')}
                        className="w-full py-2 rounded-xl bg-[#1F1917] hover:bg-[#2A2320] border border-[#CAF509] text-[#CAF509] font-black text-xs transition-all"
                      >
                        Start Cooking (Flame On)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(o.id, 'READY_FOR_PICKUP', 'Dishes packed in tamper-proof thermal boxes')}
                        className="w-full py-2 rounded-xl bg-[#CAF509] hover:bg-[#B6DD06] text-black font-black text-xs transition-all"
                      >
                        Mark Ready for Pickup
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Ready for Pickup & Courier Dispatch */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#261E1C]">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                3. Ready for Courier ({readyQueue.length})
              </h3>
            </div>

            {readyQueue.length === 0 ? (
              <div className="p-8 text-center bg-[#151110] rounded-2xl border border-[#261E1C] text-xs text-gray-500">
                No orders waiting for pickup
              </div>
            ) : (
              readyQueue.map((o) => (
                <div key={o.id} className="p-5 rounded-2xl bg-[#181311] border border-emerald-500/40 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-400">{o.id}</span>
                      <p className="text-xs text-gray-400">Packed & Sealed</p>
                    </div>
                    <span className="text-xs font-bold text-gray-300">
                      Rider: {o.courierName || 'Assigning...'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 truncate">
                    {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  <div className="p-2.5 rounded-xl bg-[#121910] border border-emerald-500/30 text-[11px] text-emerald-300">
                    Waiting for delivery partner handoff at kitchen counter.
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Menu & Stock Management Tab */
        <div className="bg-[#151110] border border-[#261E1C] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Live Menu & Availability Control</h3>
              <p className="text-xs text-gray-400">
                Immediately toggle sold-out items or adjust catalog prices in real-time
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#261E1C] text-gray-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Diet</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#211A18]">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1A1412]">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">{item.description}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-300">{item.category}</td>
                    <td className="py-3 px-4 font-extrabold text-[#CAF509]">₹{item.price}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.isVeg ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {item.isVeg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        item.inStock
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : 'bg-red-950 text-red-400 border border-red-500/40'
                      }`}>
                        {item.inStock ? 'In Stock' : 'Sold Out'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handlePriceUpdate(item)}
                        className="px-2.5 py-1 rounded-lg bg-[#241D1A] hover:bg-[#2F2622] text-gray-300 font-bold"
                      >
                        Edit Price
                      </button>
                      <button
                        onClick={() => handleToggleStock(item)}
                        className={`px-3 py-1 rounded-lg font-black transition-all ${
                          item.inStock
                            ? 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30'
                            : 'bg-[#CAF509] text-black'
                        }`}
                      >
                        {item.inStock ? 'Mark Sold Out' : 'Restock Item'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
