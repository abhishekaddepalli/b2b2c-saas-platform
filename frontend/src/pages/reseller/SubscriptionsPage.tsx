import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CreditCard, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, Layers, Clock, ArrowUpRight,
  Sparkles, RefreshCw, X
} from 'lucide-react';
import { resellerApi } from '../../api';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function ResellerSubscriptions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reseller', 'subscriptions', search, statusFilter],
    queryFn: () => resellerApi.subscriptions({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const subscriptions: any[] = data?.data ?? [];

  // Metrics
  const totalSubs = subscriptions.length;
  const activeSubs = subscriptions.filter(s => s.status === 'active').length;
  const totalMrr = subscriptions.reduce((sum, s) => {
    const amt = Number(s.amount ?? s.service_plan?.price ?? 1499);
    return sum + (s.billing_interval === 'yearly' ? amt / 12 : amt);
  }, 0);
  const monthlyProfit = Math.round(totalMrr * 0.15);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Recurring Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your clients' recurring cloud services, automated renewals, and monthly recurring margins.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Subscriptions</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalSubs}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Services</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{activeSubs}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Monthly Run Rate (MRR)</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{Math.round(totalMrr).toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Your Monthly Margin</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">+₹{monthlyProfit.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subscriptions by customer email, plan name, or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <span className="text-xs text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 rounded-lg shrink-0">
              {subscriptions.length} {subscriptions.length === 1 ? 'Subscription' : 'Subscriptions'}
            </span>
          </div>
        </div>

        {/* Quick Filter Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Status:</span>
          {[
            { label: 'All Subscriptions', val: '' },
            { label: 'Active', val: 'active' },
            { label: 'Trial', val: 'trial' },
            { label: 'Suspended', val: 'suspended' },
            { label: 'Cancelled', val: 'cancelled' },
          ].map(pill => {
            const active = statusFilter === pill.val;
            return (
              <button
                key={pill.val}
                type="button"
                onClick={() => setStatusFilter(pill.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            );
          })}

          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 shrink-0 px-2 py-0.5"
            >
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
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
            <p className="text-sm font-semibold text-slate-700">No active subscriptions found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your customers have not subscribed to recurring cloud services yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Service / Plan</th>
                  <th className="px-5 py-3.5">Interval</th>
                  <th className="px-5 py-3.5">Price (₹)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Next Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subscriptions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{s.customer?.name || 'Retail Client'}</div>
                      <div className="text-[11px] text-slate-400">{s.customer?.email}</div>
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {s.service_plan?.name || s.name || 'Cloud VPS Compute'}
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
