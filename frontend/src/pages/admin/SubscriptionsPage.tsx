import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Search, CheckCircle, ShieldAlert,
  Loader2, DollarSign, RefreshCw, X, Play, Pause,
  Layers, Clock, AlertTriangle
} from 'lucide-react';
import { adminApi } from '../../api';
import type { Subscription } from '../../types';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  expired: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminSubscriptions() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions', search, statusFilter],
    queryFn: () => adminApi.subscriptions({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const subs: Subscription[] = data?.data ?? [];

  // Metrics
  const totalSubs = subs.length;
  const activeSubs = subs.filter(s => s.status === 'active').length;
  const suspendedSubs = subs.filter(s => s.status === 'suspended').length;
  const mrr = subs
    .filter(s => s.status === 'active')
    .reduce((acc, s) => acc + Number(s.amount ?? s.recurring_amount ?? 0), 0);

  // Suspend Mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setSuccessMsg('Subscription suspended.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  // Reactivate Mutation
  const reactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.reactivateSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setSuccessMsg('Subscription reactivated.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Subscriptions Registry & Recurring MRR
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active recurring customer and reseller SaaS subscriptions, billing cycles, and life-cycle controls.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

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
            <div className="text-xs text-slate-500 font-medium">Active Recurring</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{activeSubs}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Suspended Subscriptions</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{suspendedSubs}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Monthly Run Rate (MRR)</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{mrr.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subscription ID or customer email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-2xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
          <option value="cancelled">Cancelled</option>
          <option value="trial">Trial Period</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading subscriptions registry...</span>
          </div>
        ) : subs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <CreditCard className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No active subscriptions found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Recurring service signups from marketplace and reseller portals will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Subscription & Service</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Billing Interval</th>
                  <th className="px-4 py-3.5">Recurring Amount</th>
                  <th className="px-4 py-3.5">Period Dates</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subs.map(s => {
                  const customer = (s as any).customer;
                  const plan = s.service_plan;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {plan?.name || 'SaaS Subscription'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {s.id.substring(0, 13)}...
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{customer?.name || 'Subscribed User'}</div>
                        <div className="text-[11px] text-slate-400">{customer?.email || '—'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                          {s.billing_interval || 'Monthly'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-black text-slate-900 text-sm">
                        ₹{Number(s.amount ?? s.recurring_amount ?? 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        <div>Start: {new Date(s.current_period_start || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                        <div className="text-[10px] text-slate-400">Renews: {new Date(s.next_billing_at || s.current_period_end || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          <span className="capitalize">{s.status}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => suspendMutation.mutate(s.id)}
                              className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition-colors"
                              title="Suspend Subscription"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => reactivateMutation.mutate(s.id)}
                              className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                              title="Reactivate Subscription"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
