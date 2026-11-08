import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  CheckCircle2, 
  Store, 
  Clock, 
  DollarSign, 
  Navigation, 
  RefreshCw,
  Power
} from 'lucide-react';
import { api } from '../api/client';
import type { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LiveRouteMap } from '../components/LiveRouteMap';

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isOnline, setIsOnline] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveryData = async () => {
    try {
      const poolRes = await api.delivery.getPool();
      setAvailableOrders(poolRes.orders);

      const allOrdersRes = await api.orders.getAll();
      const myOrders = allOrdersRes.orders.filter(
        (o) => o.courierId === user?.id || (user?.role === 'delivery' && o.courierName?.includes('Rajesh'))
      );
      setAssignedOrders(myOrders);
    } catch (err) {
      console.error('Failed to load courier data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();

    const unsubscribe = api.streamOrders((data) => {
      fetchDeliveryData();
    });

    return () => unsubscribe();
  }, []);

  const handleClaimOrder = async (orderId: string) => {
    try {
      await api.delivery.claim(orderId);
      toast(`You claimed order ${orderId}! Proceed to restaurant for pickup.`, 'success');
      fetchDeliveryData();
    } catch (err: any) {
      toast(err.message || 'Failed to claim order', 'error');
    }
  };

  const handlePickupOrder = async (orderId: string) => {
    try {
      await api.orders.updateStatus(
        orderId,
        'OUT_FOR_DELIVERY',
        'Rajesh Kumar verified package seal and initiated delivery'
      );
      toast(`Order ${orderId} picked up! Route navigation active.`, 'success');
      fetchDeliveryData();
    } catch (err: any) {
      toast(err.message || 'Failed to update order', 'error');
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      await api.orders.updateStatus(
        orderId,
        'DELIVERED',
        'Customer received package at door with OTP confirmation'
      );
      toast(`Order ${orderId} delivered! +₹40 added to your daily earnings.`, 'success');
      fetchDeliveryData();
    } catch (err: any) {
      toast(err.message || 'Failed to complete order', 'error');
    }
  };

  const activeDeliveries = assignedOrders.filter(
    (o) => o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'PREPARING'
  );
  const completedDeliveries = assignedOrders.filter((o) => o.status === 'DELIVERED');
  const todayEarnings = completedDeliveries.length * 40; // ₹40 per payout

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#CAF509] text-black text-xs font-black uppercase">
              Courier Partner Interface
            </span>
            <span className="text-xs text-gray-400">· TVS Raider 125 (TN-09-CB-4491)</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            Welcome, {user?.name || 'Rajesh Kumar'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Accept delivery orders, navigate simulated routes and track payouts
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Online/Offline Toggle */}
          <button
            onClick={() => {
              setIsOnline(!isOnline);
              toast(`You are now ${!isOnline ? 'ONLINE' : 'OFFLINE'}`, !isOnline ? 'success' : 'info');
            }}
            className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-black transition-all ${
              isOnline
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-red-950 text-red-300 border border-red-500/50'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'ONLINE · Accepting Orders' : 'OFFLINE'}</span>
          </button>

          <button
            onClick={fetchDeliveryData}
            className="p-2.5 rounded-xl bg-[#1C1715] hover:bg-[#2A2320] border border-[#2E2623] text-gray-300"
            title="Refresh Pool"
          >
            <RefreshCw className="w-4 h-4 text-[#CAF509]" />
          </button>
        </div>
      </div>

      {/* Courier Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
          <span className="text-xs font-bold text-gray-400 block mb-1">Active Deliveries</span>
          <p className="text-3xl font-black text-[#FF7A00]">{activeDeliveries.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
          <span className="text-xs font-bold text-gray-400 block mb-1">Available Nearby</span>
          <p className="text-3xl font-black text-white">{availableOrders.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
          <span className="text-xs font-bold text-gray-400 block mb-1">Completed Today</span>
          <p className="text-3xl font-black text-[#CAF509]">{completedDeliveries.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
          <span className="text-xs font-bold text-gray-400 block mb-1">Today's Payout</span>
          <p className="text-3xl font-black text-[#CAF509]">₹{todayEarnings}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Assigned Deliveries (Left Column) */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            My Active Route Assignments ({activeDeliveries.length})
          </h2>

          {activeDeliveries.length === 0 ? (
            <div className="p-8 text-center bg-[#151110] rounded-3xl border border-[#261E1C] text-xs text-gray-400">
              No active deliveries assigned currently. Claim an order from the available pool on the right!
            </div>
          ) : (
            activeDeliveries.map((order) => (
              <div
                key={order.id}
                className="p-6 rounded-3xl bg-[#181311] border-2 border-[#CAF509]/40 space-y-5 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#CAF509]">{order.id}</span>
                    <h3 className="text-xl font-black text-white">{order.restaurantName}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-gray-500" />
                      Pickup: {order.restaurantAddress}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#CAF509] text-black text-xs font-black uppercase">
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Simulated GPS Route Tracker */}
                <LiveRouteMap
                  orderStatus={order.status}
                  restaurantName={order.restaurantName}
                  courierName={user?.name || 'Rajesh Kumar'}
                  deliveryAddress={order.deliveryAddress.street}
                />

                {/* Customer Doorstep Info */}
                <div className="p-4 rounded-2xl bg-[#130F0E] border border-[#261E1C] text-xs space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Delivery Drop-off</span>
                  <p className="font-bold text-white text-sm">{order.customerName}</p>
                  <p className="text-gray-300">{order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
                  <p className="text-[#CAF509] font-medium">Customer Phone: {order.customerPhone}</p>
                </div>

                {/* Action buttons */}
                <div className="pt-2">
                  {order.status === 'READY_FOR_PICKUP' || order.status === 'PREPARING' ? (
                    <button
                      onClick={() => handlePickupOrder(order.id)}
                      className="w-full py-3 px-6 rounded-2xl bg-[#CAF509] hover:bg-[#B6DD06] text-black font-black text-sm tracking-wide shadow-lg shadow-[#CAF509]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Store className="w-4 h-4" />
                      Confirm Restaurant Package Pickup
                    </button>
                  ) : order.status === 'OUT_FOR_DELIVERY' ? (
                    <button
                      onClick={() => handleDeliverOrder(order.id)}
                      className="w-full py-3 px-6 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm tracking-wide shadow-lg shadow-emerald-400/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Delivery to Customer Doorstep
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Available Orders Pool (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Available Orders in Radius ({availableOrders.length})
          </h2>

          {availableOrders.length === 0 ? (
            <div className="p-8 text-center bg-[#151110] rounded-3xl border border-[#261E1C] text-xs text-gray-400">
              No orders waiting in pool. Orders appear as customers place them.
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((o) => (
                <div
                  key={o.id}
                  className="p-5 rounded-2xl bg-[#151110] border border-[#261E1C] hover:border-gray-500 space-y-3 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-gray-400">{o.id}</span>
                      <h4 className="text-base font-bold text-white">{o.restaurantName}</h4>
                      <p className="text-xs text-gray-400">{o.restaurantAddress}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#CAF509] block">+₹40 Fee</span>
                      <span className="text-[10px] text-gray-500">~2.4 km trip</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 truncate">
                    Drop to: {o.deliveryAddress.street}
                  </p>

                  <button
                    onClick={() => handleClaimOrder(o.id)}
                    className="w-full py-2.5 rounded-xl bg-[#1F1917] hover:bg-[#CAF509] text-white hover:text-black font-black text-xs border border-[#2E2623] transition-all"
                  >
                    Claim & Accept Delivery
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
