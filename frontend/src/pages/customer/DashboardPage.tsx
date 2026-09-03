import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, CreditCard, FileText, ArrowRight,
  Package, CheckCircle, Clock, ShieldCheck, Sparkles,
  ExternalLink, Loader2, IndianRupee
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ordersApi, subscriptionsApi } from '../../api';

export default function CustomerDashboard() {
  const { user } = useAuth();

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['customer', 'dashboard-orders'],
    queryFn: () => ordersApi.list({ per_page: 5 }).then(r => r.data),
  });

  const { data: subsData, isLoading: loadingSubs } = useQuery({
    queryKey: ['customer', 'dashboard-subs'],
    queryFn: () => subscriptionsApi.list({ per_page: 5 }).then(r => r.data),
  });

  const orders: any[] = ordersData?.data ?? [];
  const subscriptions: any[] = subsData?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Client Control Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Client'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Manage your digital licenses, active recurring services, download invoices, and explore enterprise tools.
          </p>
          <div className="pt-2">
            <Link
              to="/app/marketplace"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Catalog Marketplace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          to="/app/orders"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">Orders Placed</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{orders.length}</div>
            <span className="text-[11px] text-indigo-600 font-semibold group-hover:underline flex items-center gap-1 mt-1">
              View all orders <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/app/subscriptions"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Subscriptions</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{subscriptions.length}</div>
            <span className="text-[11px] text-emerald-600 font-semibold group-hover:underline flex items-center gap-1 mt-1">
              Manage services <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/app/invoices"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-xs text-slate-500 font-medium">Tax Invoices</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{orders.length}</div>
            <span className="text-[11px] text-slate-600 font-semibold group-hover:underline flex items-center gap-1 mt-1">
              Download receipts <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Purchases & Digital Orders</h2>
            <p className="text-xs text-slate-400 mt-0.5">Instant delivery and digital licensing keys</p>
          </div>
          <Link to="/app/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
            View All →
          </Link>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            You haven't placed any orders yet. Visit the Marketplace to explore available tools.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="py-3 font-mono font-bold text-indigo-600">{o.order_number || o.id.substring(0, 8)}</td>
                    <td className="py-3 text-slate-500">{new Date(o.placed_at || o.created_at || Date.now()).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 font-bold text-slate-900">₹{Number(o.total_amount ?? o.grand_total ?? 0).toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {o.status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link to="/app/orders" className="text-indigo-600 font-bold hover:underline">Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
