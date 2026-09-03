import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag, Plus, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, X, Edit3, Trash2,
  Sparkles, Percent, Ticket, Calendar, Users,
  Power, Check, Copy, AlertCircle
} from 'lucide-react';
import { adminApi } from '../../api';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
  disabled: 'bg-red-50 text-red-700 border-red-200',
};

const audienceLabels: Record<string, { label: string; color: string }> = {
  all: { label: 'All Users', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  reseller: { label: 'Resellers Only', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  customer: { label: 'Customers Only', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export default function AdminOffers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const emptyForm = {
    name: '',
    code: '',
    type: 'percentage_discount',
    discount_value: 5,
    min_order_amount: 500,
    max_discount_amount: 1000,
    audience: 'all',
    description: '',
    status: 'active',
  };

  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'offers', search, statusFilter],
    queryFn: () => adminApi.offers({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const offers: any[] = data?.data ?? [];

  // Metrics
  const totalOffers = offers.length;
  const activeOffers = offers.filter(o => o.status === 'active').length;
  const percentOffers = offers.filter(o => o.type?.includes('percentage')).length;
  const fixedOffers = offers.filter(o => o.type?.includes('fixed')).length;

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createOffer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      setShowCreate(false);
      setForm(emptyForm);
      setSuccessMsg('Promotional offer campaign launched successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create offer.';
      setErrorMsg(msg);
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateOffer(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      setSuccessMsg('Offer status updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to update status.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteOffer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      setSuccessMsg('Offer campaign deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to delete offer.');
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-indigo-600" />
            Offers & Coupons Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage promotional discounts, custom coupon codes, and volume incentives across catalog items.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setForm(emptyForm);
            setErrorMsg('');
          }}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Offer / Coupon
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Campaigns</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalOffers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Offers</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{activeOffers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Percentage Discounts</div>
            <div className="text-xl font-bold text-violet-600 mt-1">{percentOffers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Flat (₹) Discounts</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{fixedOffers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns by name, slug or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="expired">Expired</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading offers & coupons...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Tag className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No campaigns found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create coupon codes or automatic discounts to drive sales across your platform.
            </p>
            <button
              onClick={() => {
                setShowCreate(true);
                setForm(emptyForm);
              }}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Offer Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Campaign Details</th>
                  <th className="px-4 py-3.5">Audience</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Discount Benefit</th>
                  <th className="px-4 py-3.5">Min Order / Max Cap</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {offers.map(o => {
                  const aud = audienceLabels[o.audience || 'all'] || audienceLabels.all;
                  const isCoupon = Boolean(o.coupons?.[0]?.code || o.code);
                  const displayCode = o.coupons?.[0]?.code || o.code;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{o.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {displayCode ? (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(displayCode)}
                              className="inline-flex items-center gap-1 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                              title="Click to copy coupon code"
                            >
                              <span>{displayCode}</span>
                              {copiedCode === displayCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-indigo-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Auto-applied</span>
                          )}
                        </div>
                        {o.description && <div className="text-[10px] text-slate-400 mt-1 max-w-xs">{o.description}</div>}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${aud.color}`}>
                          {aud.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                          {o.type?.replace('_', ' ') || 'Percentage'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-black text-violet-700 text-sm">
                        {o.type?.includes('fixed') ? `₹${Number(o.discount_value).toLocaleString('en-IN')}` : `${o.discount_value}% OFF`}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 space-y-0.5">
                        <div>Min: <strong className="text-slate-800">₹{Number(o.min_order_amount ?? 0).toLocaleString('en-IN')}</strong></div>
                        {o.max_discount_amount > 0 && (
                          <div className="text-[10px] text-slate-400">Cap: ₹{Number(o.max_discount_amount).toLocaleString('en-IN')}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[o.status || 'active']}`}>
                          <span className="capitalize">{o.status || 'active'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = o.status === 'active' ? 'disabled' : 'active';
                              toggleStatusMutation.mutate({ id: o.id, status: newStatus });
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              o.status === 'active'
                                ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={o.status === 'active' ? 'Disable Campaign' : 'Activate Campaign'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete offer "${o.name}"?`)) {
                                deleteMutation.mutate(o.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* CREATE OFFER MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Create Promotional Campaign</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMsg('');
                createMutation.mutate(form);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Freedom SALE 5% OFF"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. FREEDOM5"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={form.audience}
                    onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    <option value="all">All Platforms & Users</option>
                    <option value="reseller">Resellers Only</option>
                    <option value="customer">End Customers Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    <option value="percentage_discount">Percentage (% Off)</option>
                    <option value="fixed_discount">Flat Discount (₹ Off)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={form.discount_value}
                    onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-violet-700 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_order_amount}
                    onChange={e => setForm(f => ({ ...f, min_order_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_discount_amount}
                    onChange={e => setForm(f => ({ ...f, max_discount_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Applies to all eligible reseller and customer orders"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
