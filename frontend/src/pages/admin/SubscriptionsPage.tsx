import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, RefreshCw, X, Play, Pause,
  Layers, Clock, AlertTriangle, Key, Edit3, Globe,
  ExternalLink, Box, Sparkles
} from 'lucide-react';
import { adminApi } from '../../api';
import type { Subscription } from '../../types';
import FulfillmentCard from '../../components/fulfillment/FulfillmentCard';

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
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [accessForm, setAccessForm] = useState({
    service_type: 'single',
    bundled_apps: '',
    access_url: '',
    portal_url: '',
    username: '',
    password: '',
    instructions: '',
    live_preview_url: '',
    current_period_end: '',
  });

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

  // Access Update Mutation
  const updateAccessMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminApi.updateSubscriptionAccess(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setEditingSub(null);
      setSuccessMsg('Subscription access credentials and bundled setup updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to update access credentials.');
    }
  });

  const openEditAccess = (sub: Subscription) => {
    setEditingSub(sub);
    const meta = typeof sub?.metadata === 'object' && sub?.metadata !== null
      ? sub.metadata
      : (typeof sub?.metadata === 'string' ? JSON.parse(sub.metadata || '{}') : {});
    setAccessForm({
      service_type: meta.service_type || 'single',
      bundled_apps: Array.isArray(meta.bundled_apps) ? meta.bundled_apps.join(', ') : (meta.bundled_apps || ''),
      access_url: meta.access_url || meta.portal_url || '',
      portal_url: meta.portal_url || meta.access_url || '',
      username: meta.username || '',
      password: meta.password || '',
      instructions: meta.instructions || '',
      live_preview_url: meta.live_preview_url || '',
      current_period_end: sub.current_period_end ? sub.current_period_end.split('T')[0] : '',
    });
  };

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
            <IndianRupee className="w-5 h-5" />
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
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                          {plan?.name || 'SaaS Subscription'}
                          {(s as any).metadata?.service_type === 'bundle' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 inline-flex items-center gap-1">
                              <Box className="w-3 h-3" /> Suite
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Single App
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px]">
                          <span className="text-slate-400 font-mono">ID: {s.id.substring(0, 10)}...</span>
                          {(s as any).metadata?.live_preview_url && (
                            <a
                              href={(s as any).metadata.live_preview_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Demo
                            </a>
                          )}
                          {((s as any).metadata?.portal_url || (s as any).metadata?.access_url) && (
                            <span className="text-slate-500 font-medium inline-flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5" /> Portal Active
                            </span>
                          )}
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
                          <button
                            type="button"
                            onClick={() => openEditAccess(s)}
                            className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs bg-indigo-50/50"
                            title="Edit Credentials & Access"
                          >
                            <Key className="w-3.5 h-3.5" /> Access
                          </button>
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

      {/* EDIT SUBSCRIPTION ACCESS MODAL */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    SaaS Provisioning & Access Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign cloud login credentials, bundled app suites, and setup guides for this subscriber
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateAccessMutation.mutate({
                  id: editingSub.id,
                  payload: {
                    service_type: accessForm.service_type,
                    bundled_apps: accessForm.bundled_apps ? accessForm.bundled_apps.split(',').map(s => s.trim()).filter(Boolean) : [],
                    access_url: accessForm.portal_url || accessForm.access_url,
                    portal_url: accessForm.portal_url || accessForm.access_url,
                    username: accessForm.username,
                    password: accessForm.password,
                    instructions: accessForm.instructions,
                    live_preview_url: accessForm.live_preview_url,
                    current_period_end: accessForm.current_period_end,
                  }
                });
              }}
              className="space-y-4"
            >
              {/* Subscriber info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    {editingSub.service_plan?.name || 'Recurring Plan'} • {(editingSub as any).customer?.name || 'Customer'}
                  </div>
                  <div className="text-[11px] text-slate-400">Subscription ID: {editingSub.id}</div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {editingSub.status}
                </span>
              </div>

              {/* Architecture Selector */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <label className="block font-bold text-slate-800">Subscription Architecture</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccessForm(f => ({ ...f, service_type: 'single' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      accessForm.service_type === 'single'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold text-xs">Single Application</div>
                      <div className="text-[10px] text-slate-400">Direct portal credentials</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessForm(f => ({ ...f, service_type: 'bundle' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      accessForm.service_type === 'bundle'
                        ? 'bg-violet-50 border-violet-500 text-violet-900 ring-1 ring-violet-500'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Box className="w-4 h-4 text-violet-600" />
                    <div>
                      <div className="font-bold text-xs">Bundled SaaS Suite</div>
                      <div className="text-[10px] text-slate-400">Multiple integrated apps</div>
                    </div>
                  </button>
                </div>

                {accessForm.service_type === 'bundle' && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Included Suite Applications (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CRM Pro, Ticket Helpdesk, Invoicing AI, Analytics Dashboard"
                      value={accessForm.bundled_apps}
                      onChange={e => setAccessForm(f => ({ ...f, bundled_apps: e.target.value }))}
                      className="w-full px-3 py-2 border border-violet-200 bg-violet-50/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Login Credentials Section */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-600" /> Access Portal & Login Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cloud / Login Portal URL *</label>
                    <input
                      type="url"
                      placeholder="https://app.mysaas.com/login"
                      value={accessForm.portal_url}
                      onChange={e => setAccessForm(f => ({ ...f, portal_url: e.target.value, access_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Interactive Live Demo URL</label>
                    <input
                      type="url"
                      placeholder="https://demo.mysaas.com"
                      value={accessForm.live_preview_url}
                      onChange={e => setAccessForm(f => ({ ...f, live_preview_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">User Account / Email</label>
                    <input
                      type="text"
                      placeholder="e.g. client@example.com"
                      value={accessForm.username}
                      onChange={e => setAccessForm(f => ({ ...f, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
                    <input
                      type="text"
                      placeholder="e.g. CloudAccess#2026"
                      value={accessForm.password}
                      onChange={e => setAccessForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Setup Instructions / Getting Started Guide</label>
                  <textarea
                    rows={2}
                    placeholder="Provide onboarding steps or instructions for subscriber..."
                    value={accessForm.instructions}
                    onChange={e => setAccessForm(f => ({ ...f, instructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Renewal Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Billing / Period End</label>
                  <input
                    type="date"
                    value={accessForm.current_period_end}
                    onChange={e => setAccessForm(f => ({ ...f, current_period_end: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateAccessMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {updateAccessMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
