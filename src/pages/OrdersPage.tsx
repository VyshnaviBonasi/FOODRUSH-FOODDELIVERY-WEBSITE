import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Bike, 
  Store, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight, 
  XCircle,
  MapPin,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import type { Order, OrderStatus } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { LiveRouteMap } from '../components/LiveRouteMap';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, setIsCartDrawerOpen } = useCart();
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const res = await api.orders.getAll();
      setOrders(res.orders);
      if (res.orders.length > 0 && !selectedOrder) {
        setSelectedOrder(res.orders[0]);
      } else if (selectedOrder) {
        const updated = res.orders.find((o) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Listen to real-time order stream
    const unsubscribe = api.streamOrders((data) => {
      if (data.order) {
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.id === data.order.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = data.order;
            return next;
          }
          return [data.order, ...prev];
        });

        setSelectedOrder((curr) => {
          if (curr && curr.id === data.order.id) {
            return data.order;
          }
          return curr;
        });

        toast(`Live Order Update: ${data.order.id} is now ${data.order.status}!`, 'info');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleReorder = async (order: Order) => {
    try {
      const restRes = await api.restaurants.getById(order.restaurantId);
      for (const item of order.items) {
        const menuItem = restRes.menuItems.find((m) => m.id === item.menuItemId);
        if (menuItem) {
          addItem(menuItem, restRes.restaurant, item.customization, item.quantity);
        }
      }
      toast('Items re-added to your cart!', 'success');
      setIsCartDrawerOpen(true);
    } catch (err: any) {
      toast('Failed to reorder: ' + err.message, 'error');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Please provide a reason for cancelling this order:');
    if (!reason) return;

    try {
      const res = await api.orders.cancel(orderId, reason);
      setSelectedOrder(res.order);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      toast('Order cancelled successfully', 'info');
    } catch (err: any) {
      toast(err.message || 'Cannot cancel order', 'error');
    }
  };

  const statusSteps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'PLACED', label: 'Order Placed', icon: <Package className="w-4 h-4" /> },
    { status: 'CONFIRMED', label: 'Confirmed', icon: <CheckCircle2 className="w-4 h-4" /> },
    { status: 'PREPARING', label: 'Kitchen Preparing', icon: <Store className="w-4 h-4" /> },
    { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: <Package className="w-4 h-4" /> },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: <Bike className="w-4 h-4" /> },
    { status: 'DELIVERED', label: 'Delivered', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const getStepStatus = (stepStatus: OrderStatus, currentStatus: OrderStatus) => {
    const orderIndex = statusSteps.findIndex((s) => s.status === currentStatus);
    const stepIndex = statusSteps.findIndex((s) => s.status === stepStatus);

    if (currentStatus === 'CANCELLED') return 'cancelled';
    if (stepIndex < orderIndex) return 'completed';
    if (stepIndex === orderIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-tight">My Orders & Live Tracking</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-[#CAF509] animate-ping" />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time status updates, live dispatch timeline and instant reordering
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-2 rounded-xl bg-[#1C1715] hover:bg-[#2A2320] border border-[#2E2623] text-xs font-bold text-gray-300 flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#CAF509]" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-[#151110] animate-pulse border border-[#261E1C]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-[#151110] rounded-3xl border border-[#2E2623]">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No orders placed yet</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
            Treat yourself to genuine Hyderabadi Dum Biryani, hand-tossed gourmet pizza or artisanal cakes!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Orders List (Left Col) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Recent Orders ({orders.length})
            </h3>

            {orders.map((o) => {
              const isSelected = selectedOrder?.id === o.id;
              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1D1714] border-[#CAF509] shadow-xl shadow-[#CAF509]/5'
                      : 'bg-[#151110] border-[#261F1C] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono text-gray-400">{o.id}</span>
                      <h4 className="text-base font-bold text-white">{o.restaurantName}</h4>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                          : o.status === 'CANCELLED'
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                          : 'bg-[#CAF509]/15 text-[#CAF509] border border-[#CAF509]/40 animate-pulse'
                      }`}
                    >
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-3 truncate">
                    {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-[#231C1A]">
                    <span className="font-extrabold text-white">₹{o.total.toFixed(2)}</span>
                    <span className="text-gray-500 text-[11px]">
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Order Timeline & Dispatch Tracker (Right Col) */}
          <div className="lg:col-span-7">
            {selectedOrder ? (
              <div className="bg-[#151110] border border-[#2E2623] rounded-3xl p-6 sm:p-8 space-y-8 sticky top-24">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#231C1A]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-[#CAF509] bg-[#CAF509]/10 px-2 py-0.5 rounded">
                        {selectedOrder.id}
                      </span>
                      <span className="text-xs text-gray-400">
                        Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{selectedOrder.restaurantName}</h2>
                    <p className="text-xs text-gray-400">{selectedOrder.restaurantAddress}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {['PLACED', 'CONFIRMED'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-bold transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}

                    <button
                      onClick={() => handleReorder(selectedOrder)}
                      className="px-4 py-2 rounded-xl bg-[#CAF509] hover:bg-[#B6DD06] text-black text-xs font-black shadow-md shadow-[#CAF509]/15 transition-all"
                    >
                      Reorder Items
                    </button>
                  </div>
                </div>

                {/* Simulated Live Route Map when in OUT_FOR_DELIVERY */}
                {(selectedOrder.status === 'OUT_FOR_DELIVERY' || selectedOrder.status === 'READY_FOR_PICKUP') && (
                  <LiveRouteMap
                    orderStatus={selectedOrder.status}
                    restaurantName={selectedOrder.restaurantName}
                    courierName={selectedOrder.courierName}
                    deliveryAddress={selectedOrder.deliveryAddress.street}
                  />
                )}

                {/* Step-by-Step Live Status Tracker */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">
                    Live Order Lifecycle
                  </h3>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#28211E]">
                    {statusSteps.map((step) => {
                      const stepState = getStepStatus(step.status, selectedOrder.status);
                      return (
                        <div key={step.status} className="relative flex items-start gap-4">
                          {/* Dot marker */}
                          <div
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                              stepState === 'completed'
                                ? 'bg-[#CAF509] text-black font-black'
                                : stepState === 'current'
                                ? 'bg-[#FF7A00] text-black font-black ring-4 ring-[#FF7A00]/20 animate-pulse'
                                : 'bg-[#1C1715] border border-[#2E2623] text-gray-500'
                            }`}
                          >
                            {stepState === 'completed' ? '✓' : ''}
                          </div>

                          <div>
                            <p
                              className={`text-sm font-bold ${
                                stepState === 'current'
                                  ? 'text-[#FF7A00]'
                                  : stepState === 'completed'
                                  ? 'text-white'
                                  : 'text-gray-500'
                              }`}
                            >
                              {step.label}
                            </p>

                            {/* Timeline notes if matched */}
                            {selectedOrder.timeline
                              .filter((t) => t.status === step.status)
                              .map((t, idx) => (
                                <p key={idx} className="text-xs text-gray-400 mt-0.5">
                                  {t.description} ·{' '}
                                  <span className="text-[10px] text-gray-500">
                                    {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </p>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items & Payment Summary */}
                <div className="pt-6 border-t border-[#231C1A] space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Purchased Items & Customizations
                  </h4>

                  <div className="space-y-2">
                    {selectedOrder.items.map((i, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#181311] border border-[#241D1A] text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={i.image}
                            alt={i.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-bold text-white">
                              {i.quantity}x {i.name}
                            </p>
                            {i.customization?.variant && (
                              <p className="text-[10px] text-[#CAF509]">
                                Portion: {i.customization.variant.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-white">₹{i.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="p-4 rounded-2xl bg-[#181311] border border-[#241D1A] text-xs space-y-2">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>GST (5%)</span>
                      <span>₹{selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Delivery Partner Fee</span>
                      <span>₹{selectedOrder.deliveryFee.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-[#CAF509] font-bold">
                        <span>Coupon Savings ({selectedOrder.couponCode})</span>
                        <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-[#261E1C] flex justify-between text-sm font-black text-white">
                      <span>Total Paid ({selectedOrder.paymentMethod})</span>
                      <span className="text-[#CAF509]">₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-[#151110] rounded-3xl border border-[#2E2623] text-gray-400 text-xs">
                Select an order from the left to view live timeline and route details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
