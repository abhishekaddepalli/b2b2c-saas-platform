import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Building2, CreditCard, IndianRupee, Loader2, TrendingUp, Wallet, Download, RefreshCw, Calendar, ShieldCheck, Zap } from 'lucide-react';
import { adminApi } from '../../api';

function fmt(n?: number) {
  return `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: revData, isLoading: loadingRev, refetch } = useQuery({
    queryKey: ['admin', 'reports', 'revenue', startDate, endDate],
    queryFn: () => adminApi.reportsRevenue({ start_date: startDate, end_date: endDate }).then(r => r.data?.data),
  });

  const { data: resellerData, isLoading: loadingResellers } = useQuery({
    queryKey: ['admin', 'reports', 'resellers'],
    queryFn: () => adminApi.reportsResellers().then(r => r.data?.data),
  });

  const { data: subData } = useQuery({
    queryKey: ['admin', 'reports', 'subscriptions'],
    queryFn: () => adminApi.reportsSubscriptions().then(r => r.data?.data),
  });

  const { data: profData } = useQuery({
    queryKey: ['admin', 'reports', 'profitability'],
    queryFn: () => adminApi.reportsProfitability().then(r => r.data?.data),
  });

  const rev = revData ?? {
    gross_revenue: 0,
    net_revenue: 0,
    platform_cost: 0,
    platform_profit: 0,
    reseller_commissions: 0,
    refunds: 0,
    taxes: 0,
    gateway_fees: 0,
    wallet_liabilities: 0,
    outstanding_credit: 0,
    mrr: 0,
    arr: 0,
  };

  const resellers = Array.isArray(resellerData) ? resellerData : [];
  const profitability = Array.isArray(profData) ? profData : [];
  const subs = subData?.counts ?? { active: 0, trial: 0, grace_period: 0, suspended: 0, cancelled: 0 };

  const handleExportCsv = async () => {
    try {
      const response = await adminApi.exportReportsCsv();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Export CSV failed', e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Ledger & Profitability Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reconciled financial analytics: Gross/Net Revenue, Platform Profit, Gateway Fees, Wallet Liabilities & Taxes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-indigo-600" /> Date Range Filter:
        </div>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-indigo-600 font-semibold hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {loadingRev ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Executive Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-xs font-medium text-slate-500">Gross Revenue</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{fmt(rev.gross_revenue)}</div>
              <div className="text-xs text-slate-400 mt-1">Net: {fmt(rev.net_revenue)}</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-xs font-medium text-slate-500">Platform Gross Profit</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{fmt(rev.platform_profit)}</div>
              <div className="text-xs text-slate-400 mt-1">Platform Cost: {fmt(rev.platform_cost)}</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-xs font-medium text-slate-500">Reseller Commissions</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{fmt(rev.reseller_commissions)}</div>
              <div className="text-xs text-slate-400 mt-1">Gateway Fees (~2%): {fmt(rev.gateway_fees)}</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-xs font-medium text-slate-500">Wallet Liabilities</div>
              <div className="text-2xl font-extrabold text-violet-600 mt-1">{fmt(rev.wallet_liabilities)}</div>
              <div className="text-xs text-slate-400 mt-1">Taxes Collected: {fmt(rev.taxes)}</div>
            </div>
          </div>

          {/* Subscriptions Overview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Active Subscriptions Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active</div>
                <div className="text-2xl font-bold mt-1">{subs.active ?? 0}</div>
              </div>
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Trial</div>
                <div className="text-2xl font-bold mt-1">{subs.trial ?? 0}</div>
              </div>
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Grace Period</div>
                <div className="text-2xl font-bold mt-1">{subs.grace_period ?? 0}</div>
              </div>
              <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100">
                <div className="text-xs font-bold uppercase tracking-wider text-red-600">Suspended</div>
                <div className="text-2xl font-bold mt-1">{subs.suspended ?? 0}</div>
              </div>
              <div className="bg-slate-100 text-slate-800 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Cancelled</div>
                <div className="text-2xl font-bold mt-1">{subs.cancelled ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Reseller Sales & Profitability Ranking */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> Reseller Performance & Sales Ledger
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Reseller Organization</th>
                    <th className="py-3 px-4">Customers</th>
                    <th className="py-3 px-4">Wallet Balance</th>
                    <th className="py-3 px-4">Total Sales</th>
                    <th className="py-3 px-4">Reseller Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {resellers.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{r.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{r.customer_count ?? 0} customers</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{fmt(r.wallet_balance)}</td>
                      <td className="py-3.5 px-4 font-medium text-indigo-600">{fmt(r.total_sales)}</td>
                      <td className="py-3.5 px-4 font-medium text-emerald-600">{fmt(r.total_profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
