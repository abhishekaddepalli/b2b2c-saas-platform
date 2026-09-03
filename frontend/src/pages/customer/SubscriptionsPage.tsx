import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CreditCard, Search, ShoppingBag, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, Layers, Clock, AlertCircle
} from 'lucide-react';
import { subscriptionsApi } from '../../api';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function CustomerSubscriptions() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customer', 'subscriptions', search],
    queryFn: () => subscriptionsApi.list({ search, per_page: 50 }).then(r => r.data),
  });

  const subscriptions: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            My Active Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your recurring SaaS tools, automated renewals, and billing cycles.
          </p>
        </div>
        <Link
          to="/app/marketplace"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Explore More Services</span>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading subscriptions…</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <CreditCard className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No active subscriptions</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't subscribed to any recurring cloud services. Visit the Marketplace to subscribe.
            </p>
            <Link
              to="/app/marketplace"
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Browse Recurring Services
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Service Name</th>
                  <th className="px-5 py-3.5">Billing Interval</th>
                  <th className="px-5 py-3.5">Recurring Price</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Next Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subscriptions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{s.service_plan?.name || s.name || 'Cloud Managed Service'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {s.id?.substring(0, 8)}</div>
                    </td>

                    <td className="px-5 py-3.5 capitalize text-slate-600">
                      {s.billing_interval || 'Monthly'}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                      ₹{Number(s.amount ?? s.service_plan?.price ?? 1499).toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[s.status || 'active'] ?? 'bg-slate-100 text-slate-600'}`}>
                        <span className="capitalize">{s.status || 'active'}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(s.next_billing_at || Date.now() + 30 * 86400000).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
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
