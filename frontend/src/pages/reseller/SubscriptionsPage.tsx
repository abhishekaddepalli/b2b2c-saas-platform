import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CreditCard, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, Layers, Clock, ArrowUpRight,
  Sparkles, RefreshCw, X, Key, PauseCircle, PlayCircle,
  XCircle, Copy, Check, ExternalLink, ShieldCheck, Eye, EyeOff, Edit3
} from 'lucide-react';
import { resellerApi } from '../../api';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function ResellerSubscriptions() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  // Credentials / Access Modal State
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [credentialsForm, setCredentialsForm] = useState({
    portal_url: '',
    username: '',
    password: '',
    server_ip: '',
    port: '',
    license_key: '',
    instructions: '',
    client_notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reseller', 'subscriptions', search, statusFilter],
    queryFn: () => resellerApi.subscriptions({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => resellerApi.suspendSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reseller', 'subscriptions'] });
      qc.invalidateQueries({ queryKey: ['reseller', 'dashboard'] });
      showToast('Subscription suspended successfully.');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Failed to suspend subscription.', 'error');
    },
  });

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: (id: string) => resellerApi.reactivateSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reseller', 'subscriptions'] });
      qc.invalidateQueries({ queryKey: ['reseller', 'dashboard'] });
      showToast('Subscription reactivated successfully.');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Failed to reactivate subscription.', 'error');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => resellerApi.cancelSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reseller', 'subscriptions'] });
      qc.invalidateQueries({ queryKey: ['reseller', 'dashboard'] });
      showToast('Subscription cancelled.');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Failed to cancel subscription.', 'error');
    },
  });

  // Update Access Credentials mutation
  const updateAccessMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => resellerApi.updateSubscriptionAccess(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reseller', 'subscriptions'] });
      setEditingSub(null);
      showToast('Access credentials & client configuration updated successfully.');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Failed to update credentials.', 'error');
    },
  });

  const handleOpenCredentials = (sub: any) => {
    const meta = isNaN(sub.metadata) && typeof sub.metadata === 'object' ? sub.metadata : (typeof sub.metadata === 'string' ? JSON.parse(sub.metadata || '{}') : {});
    setCredentialsForm({
      portal_url: meta.portal_url || meta.access_url || 'https://app.infiniforge.cloud',
      username: meta.username || sub.customer?.email || '',
      password: meta.password || '',
      server_ip: meta.server_ip || '',
      port: meta.port || '443 / 22 (SSH)',
      license_key: meta.license_key || '',
      instructions: meta.instructions || 'Log in to your cloud dashboard or connect via SSH with provided credentials.',
      client_notes: meta.client_notes || '',
    });
    setShowPassword(false);
    setEditingSub(sub);
  };

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Recurring Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage client subscriptions, provisioning credentials, suspend or reactivate services, and monitor recurring margins.
          </p>
        </div>
        <Link
          to="/reseller/marketplace"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Provision New Service</span>
        </Link>
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
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subscriptions.map(s => {
                  const isAct = s.status === 'active';
                  const isSusp = s.status === 'suspended';
                  const isCanc = s.status === 'cancelled';

                  return (
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

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Access / Credentials Modal Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenCredentials(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Manage Access & Credentials"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Access</span>
                          </button>

                          {/* Suspend Button */}
                          {isAct && (
                            <button
                              type="button"
                              disabled={suspendMutation.isPending}
                              onClick={() => {
                                if (confirm(`Are you sure you want to suspend this subscription for ${s.customer?.name || 'the customer'}?`)) {
                                  suspendMutation.mutate(s.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                              title="Suspend Subscription"
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </button>
                          )}

                          {/* Reactivate Button */}
                          {isSusp && (
                            <button
                              type="button"
                              disabled={reactivateMutation.isPending}
                              onClick={() => {
                                if (confirm(`Reactivate this subscription for ${s.customer?.name || 'the customer'}?`)) {
                                  reactivateMutation.mutate(s.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                              title="Reactivate Subscription"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </button>
                          )}

                          {/* Cancel Button */}
                          {!isCanc && (
                            <button
                              type="button"
                              disabled={cancelMutation.isPending}
                              onClick={() => {
                                if (confirm(`Cancel this subscription permanently? Customer service will be terminated.`)) {
                                  cancelMutation.mutate(s.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                              title="Cancel Subscription"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
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

      {/* ACCESS & CREDENTIALS MODAL */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">Client Provisioning</span>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Access Credentials & Configuration</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-1">
              <div className="font-bold text-indigo-950 text-xs">
                {editingSub.service_plan?.name || editingSub.name || 'Cloud Service'}
              </div>
              <div className="text-indigo-800 text-[11px]">
                Assigned to: <strong className="text-indigo-950">{editingSub.customer?.name}</strong> ({editingSub.customer?.email})
              </div>
              <div className="text-indigo-600 text-[10px]">
                These credentials and login URLs are visible to your customer in their Customer App under "My Subscriptions".
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                updateAccessMutation.mutate({ id: editingSub.id, data: credentialsForm });
              }}
              className="space-y-4"
            >
              {/* Portal URL */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Access / Console URL:</label>
                <div className="relative">
                  <input
                    type="url"
                    value={credentialsForm.portal_url}
                    onChange={e => setCredentialsForm({ ...credentialsForm, portal_url: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="https://console.yourdomain.com or IP address"
                  />
                  {credentialsForm.portal_url && (
                    <a
                      href={credentialsForm.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800 p-1"
                      title="Open Console URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username / Client ID:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={credentialsForm.username}
                      onChange={e => setCredentialsForm({ ...credentialsForm, username: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                      placeholder="root / admin"
                    />
                    {credentialsForm.username && (
                      <button
                        type="button"
                        onClick={() => handleCopy(credentialsForm.username, 'user')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {copiedKey === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Access Password / Secret:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentialsForm.password}
                      onChange={e => setCredentialsForm({ ...credentialsForm, password: e.target.value })}
                      className="w-full pl-3 pr-14 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                      placeholder="Temporary password"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {credentialsForm.password && (
                        <button
                          type="button"
                          onClick={() => handleCopy(credentialsForm.password, 'pass')}
                          className="p-1 hover:text-slate-600 cursor-pointer"
                          title="Copy password"
                        >
                          {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Server IP & Port */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Server / Host IP:</label>
                  <input
                    type="text"
                    value={credentialsForm.server_ip}
                    onChange={e => setCredentialsForm({ ...credentialsForm, server_ip: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="e.g. 192.168.1.100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Port / Protocol:</label>
                  <input
                    type="text"
                    value={credentialsForm.port}
                    onChange={e => setCredentialsForm({ ...credentialsForm, port: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="e.g. 22 (SSH) / 443"
                  />
                </div>
              </div>

              {/* License Key */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">License / Activation Key:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={credentialsForm.license_key}
                    onChange={e => setCredentialsForm({ ...credentialsForm, license_key: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                  />
                  {credentialsForm.license_key && (
                    <button
                      type="button"
                      onClick={() => handleCopy(credentialsForm.license_key, 'lic')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {copiedKey === 'lic' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Access Instructions:</label>
                <textarea
                  rows={2}
                  value={credentialsForm.instructions}
                  onChange={e => setCredentialsForm({ ...credentialsForm, instructions: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="How customer should log in or install..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateAccessMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updateAccessMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
