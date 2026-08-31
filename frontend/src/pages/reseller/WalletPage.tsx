import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Loader2, Plus, RefreshCw } from 'lucide-react';
import { resellerApi } from '../../api';
import type { WalletBalance, WalletTransaction } from '../../types';

const txTypeColor: Record<string, string> = {
  credit: 'text-emerald-600 bg-emerald-50',
  debit: 'text-red-600 bg-red-50',
  refund: 'text-blue-600 bg-blue-50',
  reversal: 'text-amber-600 bg-amber-50',
  adjustment: 'text-violet-600 bg-violet-50',
  reservation: 'text-orange-600 bg-orange-50',
  release: 'text-teal-600 bg-teal-50',
};

export default function ResellerWallet() {
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [gateway, setGateway] = useState('razorpay');
  const [txPage, setTxPage] = useState(1);

  const { data: walletData, isLoading: walletLoading, refetch } = useQuery({
    queryKey: ['reseller', 'wallet'],
    queryFn: () => resellerApi.wallet().then(r => r.data.data as WalletBalance),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['reseller', 'wallet-transactions', txPage],
    queryFn: () => resellerApi.walletTransactions({ page: txPage, per_page: 15 }).then(r => r.data),
  });

  const transactions: WalletTransaction[] = txData?.data ?? [];

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) < 1) return;
    try {
      const res = await resellerApi.rechargeWallet({ amount: parseFloat(rechargeAmount), gateway });
      const { gateway_order_id, key_id, amount } = res.data.data;
      // In production, open Razorpay checkout here
      alert(`Payment initiated. Gateway Order: ${gateway_order_id}\nAmount: ₹${amount}\nKey: ${key_id}\n\n(Integrate Razorpay SDK to complete payment)`);
      setShowRecharge(false);
      setRechargeAmount('');
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to initiate recharge');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRecharge(true)}
            className="flex items-center gap-1.5 bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Recharge
          </button>
        </div>
      </div>

      {/* Balance Card */}
      {walletLoading ? (
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 h-36 animate-pulse" />
      ) : walletData && (
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="text-sm text-violet-200 mb-1">Available Balance</div>
          <div className="text-4xl font-bold mb-4">
            ₹{walletData.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-violet-300">Reserved</div>
              <div className="font-semibold">₹{walletData.reserved_balance.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-xs text-violet-300">Credit Limit</div>
              <div className="font-semibold">₹{walletData.credit_limit.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-xs text-violet-300">Spendable</div>
              <div className="font-semibold">₹{walletData.spendable.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${walletData.status === 'active' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
              {walletData.status}
            </span>
            <span className="text-xs text-violet-300">{walletData.currency}</span>
          </div>
        </div>
      )}

      {/* Recharge modal */}
      {showRecharge && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-slate-900 mb-4">Recharge Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={rechargeAmount}
                  onChange={e => setRechargeAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Gateway</label>
                <select
                  value={gateway}
                  onChange={e => setGateway(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="razorpay">Razorpay</option>
                  <option value="phonepe">PhonePe</option>
                  <option value="cashfree">Cashfree</option>
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setShowRecharge(false)} className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleRecharge} className="flex-1 bg-violet-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-violet-700 transition-colors">
                  Pay ₹{rechargeAmount || '0'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Transaction History</h2>
        </div>
        {txLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${txTypeColor[tx.type] ?? 'text-slate-600 bg-slate-50'}`}>
                  {tx.type === 'credit' || tx.type === 'refund' || tx.type === 'release'
                    ? <ArrowDownLeft className="w-4 h-4" />
                    : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{tx.description || tx.type}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(tx.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-semibold text-sm ${['credit','refund','reversal','release'].includes(tx.type) ? 'text-emerald-600' : 'text-red-600'}`}>
                    {['credit','refund','reversal','release'].includes(tx.type) ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400">Bal: ₹{Number(tx.balance_after).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {txData?.meta && txData.meta.last_page > 1 && (
          <div className="flex justify-center gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              Previous
            </button>
            <span className="text-sm text-slate-500 px-3 py-1.5">Page {txPage} of {txData.meta.last_page}</span>
            <button onClick={() => setTxPage(p => p + 1)} disabled={txPage >= txData.meta.last_page}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
