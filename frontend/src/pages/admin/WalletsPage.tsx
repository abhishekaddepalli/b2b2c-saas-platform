import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, Plus, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, X, TrendingUp, Building2,
  ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { adminApi } from '../../api';

export default function AdminWallets() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'credit', amount: '', description: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'wallets', search],
    queryFn: () => adminApi.wallets({ search, per_page: 50 }).then(r => r.data),
  });

  const wallets: any[] = data?.data ?? [];

  // Metrics
  const totalWallets = wallets.length;
  const totalCapital = wallets.reduce((acc, w) => acc + Number(w.balance || w.available_balance || 0), 0);
  const totalCreditLimit = wallets.reduce((acc, w) => acc + Number(w.organization?.credit_limit || w.credit_limit || 0), 0);
  const totalSpendable = wallets.reduce((acc, w) => acc + Number(w.spendable || w.available_balance || 0), 0);

  // Adjustment Mutation
  const adjustMutation = useMutation({
    mutationFn: ({ orgId, payload }: { orgId: string; payload: any }) => adminApi.adjustWallet(orgId, payload),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      setShowAdjust(false);
      setAdjustForm({ type: 'credit', amount: '', description: '' });
      setSuccessMsg(res.data?.message || 'Wallet balance updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to adjust wallet balance.');
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet || !adjustForm.amount) return;
    setErrorMsg('');
    const orgId = selectedWallet.organization_id || selectedWallet.organization?.id || selectedWallet.id;
    adjustMutation.mutate({
      orgId,
      payload: {
        type: adjustForm.type,
        amount: parseFloat(adjustForm.amount),
        description: adjustForm.description || 'Admin manual balance adjustment',
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-indigo-600" />
            Reseller Wallets & Credit Facilities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage prepaid capital balances, credit facilities, and administrator top-ups.
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
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Capital Balance</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{totalCapital.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Spendable Reserve</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">₹{totalSpendable.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Credit Lines Extended</div>
            <div className="text-xl font-bold text-violet-600 mt-1">₹{totalCreditLimit.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Wallets</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{totalWallets}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by organization name or wallet ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading reseller wallets...</span>
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Wallet className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No reseller wallets found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Wallets are automatically created when reseller organizations are approved.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Organization / Tenant</th>
                  <th className="px-4 py-3.5">Available Balance</th>
                  <th className="px-4 py-3.5">Spendable</th>
                  <th className="px-4 py-3.5">Credit Facility</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {wallets.map(w => {
                  const org = w.organization;
                  const balance = Number(w.available_balance ?? w.balance ?? 0);
                  const spendable = Number(w.spendable ?? balance);
                  const creditLimit = Number(org?.credit_limit ?? w.credit_limit ?? 0);

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {org?.name ? org.name.charAt(0).toUpperCase() : 'W'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{org?.name || 'Reseller Tenant'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {w.id.substring(0, 13)}...</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-black text-slate-900 text-sm">
                        ₹{balance.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-emerald-600">
                        ₹{spendable.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        ₹{creditLimit.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWallet(w);
                            setShowAdjust(true);
                            setErrorMsg('');
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adjust Balance
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADJUST BALANCE MODAL */}
      {showAdjust && selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Adjust Wallet Balance</h2>
                <p className="text-xs text-slate-400">{selectedWallet.organization?.name || 'Reseller'}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjust(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm(f => ({ ...f, type: 'credit' }))}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      adjustForm.type === 'credit'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" /> Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm(f => ({ ...f, type: 'debit' }))}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      adjustForm.type === 'debit'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Debit (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={adjustForm.amount}
                  onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Promotional deposit or refund"
                  value={adjustForm.description}
                  onChange={e => setAdjustForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjust(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {adjustMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
