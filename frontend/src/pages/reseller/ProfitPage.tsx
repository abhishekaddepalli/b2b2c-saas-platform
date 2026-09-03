import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, IndianRupee, ArrowUpRight, Calendar,
  Loader2, Download, CheckCircle, ShieldCheck,
  Tag, Percent, ShoppingBag
} from 'lucide-react';
import { resellerApi } from '../../api';

export default function ResellerProfit() {
  const { data: profitData, isLoading: loadingProfit } = useQuery({
    queryKey: ['reseller', 'profit'],
    queryFn: () => resellerApi.profit({ per_page: 50 }).then(r => r.data),
  });

  const { data: chartData } = useQuery({
    queryKey: ['reseller', 'profit-chart'],
    queryFn: () => resellerApi.profitChart().then(r => r.data?.data ?? []),
  });

  const records: any[] = profitData?.data ?? [];

  // Totals
  const totalRevenue = records.reduce((s, r) => s + Number(r.total_revenue || 0), 0);
  const totalProfit = records.reduce((s, r) => s + Number(r.reseller_profit || 0), 0);
  const totalCost = Math.max(0, totalRevenue - totalProfit);
  const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 15;

  const exportCsv = () => {
    if (records.length === 0) {
      alert('No profit records available to export.');
      return;
    }
    const headers = ['Order Number,Customer,Gross Revenue (INR),Wholesale Cost (INR),Reseller Margin (INR),Date\n'];
    const rows = records.map(r => `"${r.order_number || r.id}","${r.customer_name || 'Retail Client'}",${r.total_revenue || 0},${r.platform_cost || 0},${r.reseller_profit || 0},"${r.recorded_at || r.created_at}"\n`);
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reseller-profit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
            Profit & Margin Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time financial audits of customer retail sales, wholesale debits, and realized earnings.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Profit CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Gross Retail Volume</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Wholesale Cost (COGS)</div>
            <div className="text-xl font-bold text-slate-700 mt-1">₹{totalCost.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Realized Profit Margin</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">+₹{totalProfit.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Average Margin Rate</div>
            <div className="text-xl font-bold text-violet-600 mt-1">{avgMargin}%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Financial Settlement Note */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent border border-emerald-500/20 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900">Instant Wallet Net-Settlement Active</div>
          <p className="text-slate-600 leading-relaxed">
            Whenever a customer completes checkout, your wholesale rate is automatically deducted from your prepaid balance, while 100% of your marked-up profit margin is retained immediately.
          </p>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Real-time Margin Audit Log</h2>
          <span className="text-xs text-slate-400 font-medium">{records.length} transactions recorded</span>
        </div>

        {loadingProfit ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Compiling financial records…</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <TrendingUp className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No profit records generated yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Profit logs are generated automatically each time an order is settled for your organization.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Order Reference</th>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Gross Order Value</th>
                  <th className="px-5 py-3.5">Wholesale Base Cost</th>
                  <th className="px-5 py-3.5">Your Realized Profit</th>
                  <th className="px-5 py-3.5">Settlement Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                      {r.order_number || r.id.substring(0, 8)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {r.customer_name || 'Retail Client'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ₹{Number(r.total_revenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      ₹{Number(r.platform_cost || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-600 text-sm">
                      +₹{Number(r.reseller_profit || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(r.recorded_at || r.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
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
