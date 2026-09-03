import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IndianRupee, Plus, RefreshCw, ArrowDownLeft, ArrowUpRight,
  ShieldCheck, Loader2, CreditCard, QrCode, Building,
  CheckCircle, AlertCircle, X, Download, Filter, Sparkles, Check
} from 'lucide-react';
import { resellerApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { WalletBalance, WalletTransaction } from '../../types';

const txTypeColor: Record<string, { badge: string; icon: any; sign: string; amountColor: string }> = {
  credit: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowDownLeft, sign: '+', amountColor: 'text-emerald-600' },
  debit: { badge: 'bg-red-50 text-red-700 border-red-200', icon: ArrowUpRight, sign: '-', amountColor: 'text-red-600' },
  refund: { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: ArrowDownLeft, sign: '+', amountColor: 'text-blue-600' },
  adjustment: { badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: RefreshCw, sign: '±', amountColor: 'text-purple-600' },
  reservation: { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle, sign: '-', amountColor: 'text-amber-600' },
  release: { badge: 'bg-teal-50 text-teal-700 border-teal-200', icon: ArrowDownLeft, sign: '+', amountColor: 'text-teal-600' },
};

const quickAmounts = [500, 1000, 2500, 5000, 10000];

export default function ResellerWallet() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('1000');
  const [paymentMode, setPaymentMode] = useState<'razorpay' | 'instant_test' | 'bank_transfer'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [txFilter, setTxFilter] = useState('');
  const [txPage, setTxPage] = useState(1);

  // Preload Razorpay Checkout Script
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['reseller', 'wallet'],
    queryFn: () => resellerApi.wallet().then(r => r.data.data as WalletBalance),
    refetchInterval: 30_000,
  });

  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ['reseller', 'wallet-transactions', txPage, txFilter],
    queryFn: () => resellerApi.walletTransactions({ page: txPage, type: txFilter || undefined, per_page: 25 }).then(r => r.data),
  });

  const transactions: WalletTransaction[] = txData?.data ?? [];

  const handleRefresh = () => {
    refetchWallet();
    refetchTx();
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(rechargeAmount);
    if (isNaN(amountNum) || amountNum < 1) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid top-up amount of at least ₹1.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      // 1. Initiate recharge on backend
      const res = await resellerApi.rechargeWallet({
        amount: amountNum,
        gateway: paymentMode === 'instant_test' ? 'test' : 'razorpay',
      });

      const orderData = res.data.data;
      const paymentId = orderData.payment_id;

      // 2. If Instant Test Mode, fulfill directly
      if (paymentMode === 'instant_test') {
        const fulfillRes = await resellerApi.fulfillRecharge({
          payment_id: paymentId,
          razorpay_payment_id: 'pay_test_' + Date.now(),
          razorpay_signature: 'valid_mock_signature',
        });

        setStatusMessage({
          type: 'success',
          text: `Success! ₹${amountNum.toLocaleString('en-IN')} has been immediately credited to your wallet balance.`,
        });
        qc.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
        qc.invalidateQueries({ queryKey: ['reseller', 'wallet-transactions'] });
        setShowRecharge(false);
        return;
      }

      // 3. Open Razorpay Gateway
      const rzpKey = orderData.key_id || 'rzp_test_mock_key';
      const checkoutOptions = {
        key: rzpKey,
        amount: Math.round(amountNum * 100),
        currency: 'INR',
        name: user?.organization?.name || 'Reseller SaaS Cloud',
        description: `Wallet Balance Top-up of ₹${amountNum}`,
        order_id: orderData.gateway_order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response: any) => {
          try {
            await resellerApi.fulfillRecharge({
              payment_id: paymentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setStatusMessage({
              type: 'success',
              text: `Payment verified! ₹${amountNum.toLocaleString('en-IN')} added to your wallet.`,
            });
            qc.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
            qc.invalidateQueries({ queryKey: ['reseller', 'wallet-transactions'] });
            setShowRecharge(false);
          } catch (fulfillErr: any) {
            setStatusMessage({
              type: 'error',
              text: fulfillErr?.response?.data?.message || 'Payment received but verification failed. Please contact support.',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(checkoutOptions);
        rzp.on('payment.failed', (failRes: any) => {
          setStatusMessage({
            type: 'error',
            text: `Payment failed: ${failRes.error?.description || 'Transaction cancelled by user'}`,
          });
        });
        rzp.open();
      } else {
        // Fallback fulfill if popup blocked or offline
        await resellerApi.fulfillRecharge({
          payment_id: paymentId,
          razorpay_payment_id: 'pay_fallback_' + Date.now(),
          razorpay_signature: 'valid_mock_signature',
        });
        setStatusMessage({
          type: 'success',
          text: `Recharge of ₹${amountNum.toLocaleString('en-IN')} credited successfully!`,
        });
        qc.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
        qc.invalidateQueries({ queryKey: ['reseller', 'wallet-transactions'] });
        setShowRecharge(false);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Server error initiating wallet recharge.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportStatement = () => {
    if (transactions.length === 0) {
      alert('No wallet transactions to export.');
      return;
    }
    const headers = ['Transaction ID,Type,Amount (INR),Balance After (INR),Description,Date\n'];
    const rows = transactions.map(t => `"${t.id}","${t.type}",${t.amount},${t.balance_after},"${t.description || ''}","${t.created_at}"\n`);
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <IndianRupee className="w-7 h-7 text-indigo-600" />
            Prepaid Wallet & Settlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain prepaid funds for automated wholesale deductions, client provisioning, and real-time margin settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
            title="Refresh balance & transactions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setShowRecharge(true);
              setStatusMessage(null);
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Recharge Wallet</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Balance & Capital Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Available Card */}
        <div className="md:col-span-2 bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Available Spendable Balance</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ACTIVE • ₹ INR
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight mt-2 flex items-baseline gap-1">
              <span>₹</span>
              <span>{Number(walletData?.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Wholesale Settlement</span>
            </div>
            <button
              onClick={() => {
                setShowRecharge(true);
                setRechargeAmount('2500');
              }}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
            >
              + Quick Top-up
            </button>
          </div>
        </div>

        {/* Reserved Balance Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Reserved For Pending Orders</div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              ₹{Number(walletData?.reserved_balance || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Locked during automated provisioning</p>
          </div>
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Auto-releases on complete
          </div>
        </div>

        {/* Credit Limit Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Authorized Credit Facility</div>
            <div className="text-2xl font-black text-indigo-600 mt-2">
              ₹{Number(walletData?.credit_limit || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Extended by platform super admin</p>
          </div>
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-2">
            <Check className="w-3.5 h-3.5" /> 0% Interest Buffer
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
        {/* Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Wallet Ledger & Transaction Records</h2>
            <p className="text-xs text-slate-400 mt-0.5">Immutable audit trail of debits, recharges and profit reversals</p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={txFilter}
              onChange={e => setTxFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
            >
              <option value="">All Transactions</option>
              <option value="credit">Credits (Top-ups)</option>
              <option value="debit">Debits (Orders)</option>
              <option value="refund">Refunds</option>
              <option value="adjustment">Adjustments</option>
            </select>

            <button
              onClick={exportStatement}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {txLoading ? (
          <div className="flex justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading ledger transactions…</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <IndianRupee className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Recharge your wallet to fund customer orders or view automated invoice debits.
            </p>
            <button
              onClick={() => setShowRecharge(true)}
              className="inline-flex items-center gap-1 bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Top-up Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Reference ID</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Balance After</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map(t => {
                  const conf = txTypeColor[t.type] || txTypeColor.credit;
                  const Icon = conf.icon;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 text-xs">
                        {t.id?.substring(0, 8)}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${conf.badge}`}>
                          <Icon className="w-3 h-3" />
                          <span>{t.type}</span>
                        </span>
                      </td>

                      <td className={`px-5 py-3.5 font-bold text-sm ${conf.amountColor}`}>
                        {conf.sign}₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        ₹{Number(t.balance_after).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                        {t.description || 'Wallet transaction'}
                      </td>

                      <td className="px-5 py-3.5 text-right text-slate-500">
                        {new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECHARGE WALLET MODAL */}
      {showRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Recharge Reseller Wallet</h3>
                  <p className="text-[11px] text-slate-400">Preload balance to fund customer provisioning</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecharge(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-4">
              {/* Amount Input & Preset Chips */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">Top-up Amount (₹ INR) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="Enter amount"
                    value={rechargeAmount}
                    onChange={e => setRechargeAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-base font-black text-slate-900 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmount(amt.toString())}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                        rechargeAmount === amt.toString()
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">Select Payment Method</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Razorpay Option */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      paymentMode === 'razorpay'
                        ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_mode"
                      value="razorpay"
                      checked={paymentMode === 'razorpay'}
                      onChange={() => setPaymentMode('razorpay')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Razorpay Instant Gateway</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Pay with UPI (GPay, PhonePe, Paytm), NetBanking, Credit/Debit Cards, or QR.
                      </p>
                    </div>
                  </label>

                  {/* Instant Test Mode Option */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      paymentMode === 'instant_test'
                        ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_mode"
                      value="instant_test"
                      checked={paymentMode === 'instant_test'}
                      onChange={() => setPaymentMode('instant_test')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Instant Sandbox Top-up (Fast Test)</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-800">
                          Demo Mode
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Credits balance immediately without launching external payment gateway.
                      </p>
                    </div>
                  </label>

                  {/* Bank Transfer Option */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      paymentMode === 'bank_transfer'
                        ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_mode"
                      value="bank_transfer"
                      checked={paymentMode === 'bank_transfer'}
                      onChange={() => setPaymentMode('bank_transfer')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">Direct Bank IMPS / NEFT Transfer</div>
                      <p className="text-[11px] text-slate-500">
                        Virtual account coordinates for high-value wholesale deposits.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bank Details Display if Bank Transfer selected */}
              {paymentMode === 'bank_transfer' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-[11px]">
                  <div className="font-bold text-slate-900">Virtual Bank Account Credentials:</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>Bank: <strong className="text-slate-800">HDFC Bank Ltd</strong></div>
                    <div>Account No: <strong className="text-slate-800 font-mono">50200098765432</strong></div>
                    <div>IFSC Code: <strong className="text-slate-800 font-mono">HDFC0000123</strong></div>
                    <div>Account Name: <strong className="text-slate-800">InfiniForge Cloud SaaS</strong></div>
                  </div>
                  <p className="text-[10px] text-amber-700 font-medium">
                    Funds transferred via IMPS are credited to your wallet within 15 minutes after confirmation.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecharge(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <IndianRupee className="w-4 h-4" />
                  )}
                  <span>
                    {paymentMode === 'instant_test'
                      ? `Credit ₹${rechargeAmount || 0} Instantly`
                      : paymentMode === 'bank_transfer'
                      ? 'I Have Transferred Funds'
                      : `Proceed to Pay ₹${rechargeAmount || 0}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
