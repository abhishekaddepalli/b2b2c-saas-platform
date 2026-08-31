import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search, Wallet } from 'lucide-react';
import { adminApi } from '../../api';
import type { WalletBalance } from '../../types';

export default function AdminWallets() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'credit', amount: '', description: '' });
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'wallets', search],
    queryFn: () => adminApi.wallets({ search, per_page: 25 }).then(r => r.data),
  });

  const wallets: any[] = data?.data ?? [];

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet || !adjustForm.amount) return;
    setSaving(true);
    try {
      await adminApi.adjustWallet(selectedWallet.organization_id || selectedWallet.id, {
        type: adjustForm.type,
        amount: parseFloat(adjustForm.amount),
        description: adjustForm.description || 'Admin manual balance adjustment',
      });
      qc.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      setShowAdjust(false);
      setAdjustForm({ type: 'credit', amount: '', description: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reseller Wallets</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage balances, credit limits & admin top-ups</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search organization…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No reseller wallets found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Organization / Wallet ID', 'Available Balance', 'Spendable', 'Credit Limit', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {wallets.map(w => (
                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-medium text-slate-900">{w.organization?.name || 'Reseller Wallet'}</div>
                    <div className="text-xs text-slate-400 font-mono">{w.id}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-slate-900">₹{Number(w.available_balance ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-indigo-600">₹{Number(w.spendable ?? w.available_balance ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">₹{Number(w.credit_limit ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      {w.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => { setSelectedWallet(w); setShowAdjust(true); }}
                      className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adjust Balance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdjust && selectedWallet && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-slate-900 mb-4">Adjust Wallet Balance</h2>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Action</label>
                <select
                  value={adjustForm.type}
                  onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="credit">Credit Balance (+)</option>
                  <option value="debit">Debit Balance (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={adjustForm.amount}
                  onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason / Description</label>
                <input
                  type="text"
                  value={adjustForm.description}
                  onChange={e => setAdjustForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Promotional top-up"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjust(false)}
                  className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
