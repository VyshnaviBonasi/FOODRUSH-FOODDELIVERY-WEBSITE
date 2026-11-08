import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Store, 
  Users, 
  Download, 
  RefreshCw, 
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api/client';
import type { Order, Restaurant } from '../types';
import { useToast } from '../context/ToastContext';

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const overviewRes = await api.admin.getOverview();
      setSummary(overviewRes.summary);
      setAuditLogs(overviewRes.auditLogs);

      const ordersRes = await api.orders.getAll();
      setOrders(ordersRes.orders);

      const restRes = await api.restaurants.getAll();
      setRestaurants(restRes.restaurants);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    const unsubscribe = api.streamOrders(() => {
      loadAdminData();
    });

    return () => unsubscribe();
  }, []);

  const handleToggleRestaurantOpen = async (res: Restaurant) => {
    try {
      await api.restaurants.update(res.id, { isOpen: !res.isOpen });
      setRestaurants((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, isOpen: !r.isOpen } : r))
      );
      toast(`Updated ${res.name} operational status to ${!res.isOpen ? 'OPEN' : 'CLOSED'}`, 'info');
      loadAdminData();
    } catch (err: any) {
      toast('Failed to update restaurant status: ' + err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/admin/export-orders', '_blank');
    toast('Exporting orders CSV report...', 'success');
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchSearch =
      !searchFilter ||
      o.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.restaurantName.toLowerCase().includes(searchFilter.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#CAF509] text-black text-xs font-black uppercase">
              Platform Administration
            </span>
            <span className="text-xs text-gray-400">· Root Authority Level</span>
          </div>
          <h1 className="text-3xl font-black text-white">FoodRush X Command Center</h1>
          <p className="text-xs text-gray-400 mt-1">
            Live business intelligence, financial reconciliation and ecosystem operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-[#1C1715] hover:bg-[#2A2320] border border-[#2E2623] text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-[#CAF509]" />
            Export CSV
          </button>
          <button
            onClick={loadAdminData}
            className="p-2.5 rounded-xl bg-[#1C1715] hover:bg-[#2A2320] border border-[#2E2623] text-gray-300"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4 text-[#CAF509]" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
            <span className="text-xs font-bold text-gray-400 block mb-1">Gross Order Value (GMV)</span>
            <p className="text-2xl font-black text-[#CAF509]">₹{summary.totalRevenue.toFixed(0)}</p>
            <span className="text-[10px] text-gray-500 font-medium">From {summary.totalOrders} total orders</span>
          </div>

          <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
            <span className="text-xs font-bold text-gray-400 block mb-1">Platform Revenue (15%)</span>
            <p className="text-2xl font-black text-[#FF7A00]">₹{summary.platformCommission.toFixed(0)}</p>
            <span className="text-[10px] text-gray-500 font-medium">Net platform commission take</span>
          </div>

          <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
            <span className="text-xs font-bold text-gray-400 block mb-1">Avg Order Value (AOV)</span>
            <p className="text-2xl font-black text-white">₹{summary.averageOrderValue.toFixed(0)}</p>
            <span className="text-[10px] text-emerald-400 font-medium">Optimal basket size</span>
          </div>

          <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
            <span className="text-xs font-bold text-gray-400 block mb-1">Active Cloud Kitchens</span>
            <p className="text-2xl font-black text-white">
              {summary.activeRestaurantsCount} / {summary.totalRestaurantsCount}
            </p>
            <span className="text-[10px] text-gray-500 font-medium">Operational today</span>
          </div>

          <div className="p-5 rounded-3xl bg-[#151110] border border-[#261E1C]">
            <span className="text-xs font-bold text-gray-400 block mb-1">Active Deliveries</span>
            <p className="text-2xl font-black text-cyan-400">{summary.activeOrders}</p>
            <span className="text-[10px] text-gray-500 font-medium">In kitchen or transit</span>
          </div>
        </div>
      )}

      {/* Orders Oversight Table */}
      <div className="bg-[#151110] border border-[#261E1C] rounded-3xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Platform Orders Oversight</h3>
            <p className="text-xs text-gray-400">Complete historical and live transaction records</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search orders, customers..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#181311] border border-[#261E1C] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CAF509]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#181311] border border-[#261E1C] text-xs font-bold text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#261E1C] text-gray-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#211A18]">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-[#1A1412]">
                  <td className="py-3 px-4 font-mono font-bold text-white">{o.id}</td>
                  <td className="py-3 px-4 font-medium text-gray-300">{o.customerName}</td>
                  <td className="py-3 px-4 font-medium text-gray-300">{o.restaurantName}</td>
                  <td className="py-3 px-4 font-extrabold text-[#CAF509]">₹{o.total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      o.status === 'DELIVERED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : o.status === 'CANCELLED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                        : 'bg-[#CAF509]/15 text-[#CAF509] border border-[#CAF509]/30'
                    }`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-400">{o.paymentMethod}</td>
                  <td className="py-3 px-4 text-right text-gray-500">
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restaurant Partners Management */}
      <div className="bg-[#151110] border border-[#261E1C] rounded-3xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-1">Restaurant Partner Oversight</h3>
        <p className="text-xs text-gray-400 mb-6">Authorize and toggle operational availability</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {restaurants.map((res) => (
            <div key={res.id} className="p-4 rounded-2xl bg-[#181311] border border-[#261E1C] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{res.name}</h4>
                <p className="text-[11px] text-gray-400">{res.cuisines.slice(0, 2).join(', ')}</p>
                <span className={`text-[10px] font-extrabold uppercase mt-1 inline-block ${
                  res.isOpen ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {res.isOpen ? '● Open for Orders' : '○ Closed'}
                </span>
              </div>

              <button
                onClick={() => handleToggleRestaurantOpen(res)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  res.isOpen
                    ? 'bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300'
                }`}
              >
                {res.isOpen ? 'Close' : 'Open'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Audit Logs */}
      <div className="bg-[#151110] border border-[#261E1C] rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">System Security & Audit Trail</h3>
        <p className="text-xs text-gray-400 mb-4">Immutable operational logs for compliance and accountability</p>

        <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[11px]">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-2.5 rounded-xl bg-[#181311] border border-[#231C1A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[#CAF509] font-bold">[{log.action}]</span>
                <span className="text-gray-300">by {log.performedBy}</span>
                <span className="text-gray-500">{JSON.stringify(log.details)}</span>
              </div>
              <span className="text-gray-600">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
