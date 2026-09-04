import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Building2, CreditCard, IndianRupee, Loader2,
  TrendingUp, Wallet, Download, RefreshCw, Calendar, ShieldCheck,
  Zap, Package, Layers, Sparkles, Server, CheckCircle2, Clock,
  XCircle, AlertCircle, ShoppingBag, ArrowUpRight, Award
} from 'lucide-react';
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

  const { data: resellerData } = useQuery({
    queryKey: ['admin', 'reports', 'resellers'],
    queryFn: () => adminApi.reportsResellers().then(r => r.data?.data),
  });

  const { data: subData } = useQuery({
    queryKey: ['admin', 'reports', 'subscriptions'],
    queryFn: () => adminApi.reportsSubscriptions().then(r => r.data?.data),
  });

  const { data: prodPerfData } = useQuery({
    queryKey: ['admin', 'reports', 'products', startDate, endDate],
    queryFn: () => adminApi.reportsProducts({ start_date: startDate, end_date: endDate }).then(r => r.data?.data),
  });

  const { data: orderPerfData } = useQuery({
    queryKey: ['admin', 'reports', 'orders', startDate, endDate],
    queryFn: () => adminApi.reportsOrders({ start_date: startDate, end_date: endDate }).then(r => r.data?.data),
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
  const subs = subData?.counts ?? { active: 0, trial: 0, grace_period: 0, suspended: 0, cancelled: 0 };
  const typeBreakdown = prodPerfData?.type_breakdown ?? {
    software: { revenue: 0, units: 0, label: 'Software Licenses' },
    physical: { revenue: 0, units: 0, label: 'Physical Products' },
    digital: { revenue: 0, units: 0, label: 'Digital Assets' },
    service: { revenue: 0, units: 0, label: 'Cloud Services' },
  };
  const topProducts: any[] = prodPerfData?.top_products ?? [];
  const orderAnalytics = orderPerfData ?? {
    total_orders: 0,
    total_revenue: 0,
    average_order_value: 0,
    fulfillment_rate: 100,
    status_breakdown: { completed: 0, paid: 0, processing: 0, pending: 0, cancelled: 0, refunded: 0 },
  };

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

  const statusCounts = orderAnalytics.status_breakdown || {};
  const totalOrdersCount = orderAnalytics.total_orders || 1;
  const completedPct = Math.round((((statusCounts.completed || 0) + (statusCounts.paid || 0)) / totalOrdersCount) * 100);
  const processingPct = Math.round(((statusCounts.processing || 0) / totalOrdersCount) * 100);
  const pendingPct = Math.round(((statusCounts.pending || 0) / totalOrdersCount) * 100);
  const cancelledPct = Math.round((((statusCounts.cancelled || 0) + (statusCounts.refunded || 0)) / totalOrdersCount) * 100);

  return (
    <div className="space-y-8">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Financial Ledger & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time cross-channel analytics across physical hardware, cloud services, software licenses, and reseller commissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV Ledger
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-indigo-600" /> Date Range Filter:
        </div>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
        />
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-rose-600 font-bold hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {loadingRev ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Executive Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Gross Sales Revenue</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{fmt(rev.gross_revenue)}</div>
              <div className="text-xs text-slate-500 mt-1">Net: <span className="font-semibold text-slate-700">{fmt(rev.net_revenue)}</span></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Platform Gross Profit</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{fmt(rev.platform_profit)}</div>
              <div className="text-xs text-slate-500 mt-1">Direct Cost: <span className="font-semibold text-slate-700">{fmt(rev.platform_cost)}</span></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Reseller Commissions</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{fmt(rev.reseller_commissions)}</div>
              <div className="text-xs text-slate-500 mt-1">Gateway Fees (~2%): <span className="font-semibold text-slate-700">{fmt(rev.gateway_fees)}</span></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="text-xs font-bold uppercase tracking-wider text-violet-600">Wallet Liabilities</div>
              <div className="text-2xl font-black text-violet-600 mt-1">{fmt(rev.wallet_liabilities)}</div>
              <div className="text-xs text-slate-500 mt-1">Taxes Collected: <span className="font-semibold text-slate-700">{fmt(rev.taxes)}</span></div>
            </div>
          </div>

          {/* Product & Services Performance by Type */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Product & Services Breakdown
              </h2>
              <span className="text-xs text-slate-400 font-medium">Physical • Digital • Software • Cloud Services</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Software */}
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Software Licenses</span>
                  <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/20 text-indigo-300">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black mt-3">
                  ₹{Number(typeBreakdown.software?.revenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-200/70 mt-2 pt-2 border-t border-indigo-900/60">
                  <span>Provisioned Keys</span>
                  <span className="font-bold text-white">{typeBreakdown.software?.units || 0} units</span>
                </div>
              </div>

              {/* Cloud Services */}
              <div className="bg-gradient-to-br from-violet-950 to-slate-900 text-white rounded-2xl p-5 border border-violet-900/50 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">Cloud & Managed Services</span>
                  <div className="p-2 bg-violet-600/30 rounded-xl border border-violet-400/20 text-violet-300">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black mt-3">
                  ₹{Number(typeBreakdown.service?.revenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-xs text-violet-200/70 mt-2 pt-2 border-t border-violet-900/60">
                  <span>Retainers & Subscriptions</span>
                  <span className="font-bold text-white">{typeBreakdown.service?.units || 0} subs</span>
                </div>
              </div>

              {/* Physical Products */}
              <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-2xl p-5 border border-emerald-900/50 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Physical Hardware</span>
                  <div className="p-2 bg-emerald-600/30 rounded-xl border border-emerald-400/20 text-emerald-300">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black mt-3">
                  ₹{Number(typeBreakdown.physical?.revenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-200/70 mt-2 pt-2 border-t border-emerald-900/60">
                  <span>Fulfilled Shipments</span>
                  <span className="font-bold text-white">{typeBreakdown.physical?.units || 0} orders</span>
                </div>
              </div>

              {/* Digital Downloads */}
              <div className="bg-gradient-to-br from-cyan-950 to-slate-900 text-white rounded-2xl p-5 border border-cyan-900/50 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Digital Downloads</span>
                  <div className="p-2 bg-cyan-600/30 rounded-xl border border-cyan-400/20 text-cyan-300">
                    <Download className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black mt-3">
                  ₹{Number(typeBreakdown.digital?.revenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-xs text-cyan-200/70 mt-2 pt-2 border-t border-cyan-900/60">
                  <span>Download Deliveries</span>
                  <span className="font-bold text-white">{typeBreakdown.digital?.units || 0} assets</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Catalog Items */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Top Performing Marketplace Items
              </h2>
              <span className="text-xs text-slate-400 font-semibold">Ranked by revenue</span>
            </div>
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No orders recorded for this time interval.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Units Sold</th>
                      <th className="px-4 py-3 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {topProducts.map((p, idx) => (
                      <tr key={p.name + idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{p.name}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                            p.type === 'physical'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.type === 'service'
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : p.type === 'digital'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-slate-700">{p.units}</td>
                        <td className="px-4 py-3.5 text-right font-black text-indigo-600">
                          ₹{Number(p.revenue).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Orders Funnel & Fulfillment Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Order Fulfillment & Funnel Health
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Distribution of all customer and reseller checkout sessions.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completed / Paid ({completedPct}%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Processing ({processingPct}%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Pending ({pendingPct}%)</span>
              </div>
            </div>

            {/* Visual Funnel Stack Bar */}
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex shadow-inner">
              <div style={{ width: `${completedPct}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Completed/Paid: ${completedPct}%`} />
              <div style={{ width: `${processingPct}%` }} className="bg-blue-500 h-full transition-all duration-500" title={`Processing: ${processingPct}%`} />
              <div style={{ width: `${pendingPct}%` }} className="bg-amber-400 h-full transition-all duration-500" title={`Pending: ${pendingPct}%`} />
              <div style={{ width: `${cancelledPct}%` }} className="bg-rose-400 h-full transition-all duration-500" title={`Cancelled: ${cancelledPct}%`} />
            </div>

            {/* 4 Summary Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Volume</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{orderAnalytics.total_orders || 0}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Order Value</span>
                <p className="text-xl font-black text-indigo-600 mt-0.5">₹{Number(orderAnalytics.average_order_value || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Success Rate</span>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{orderAnalytics.fulfillment_rate || 100}%</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Processing</span>
                <p className="text-xl font-black text-blue-600 mt-0.5">{statusCounts.processing || 0}</p>
              </div>
            </div>
          </div>

          {/* Subscriptions Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" /> Active Subscriptions Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active</div>
                <div className="text-2xl font-black mt-1">{subs.active ?? 0}</div>
              </div>
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Trial</div>
                <div className="text-2xl font-black mt-1">{subs.trial ?? 0}</div>
              </div>
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Grace Period</div>
                <div className="text-2xl font-black mt-1">{subs.grace_period ?? 0}</div>
              </div>
              <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200">
                <div className="text-xs font-bold uppercase tracking-wider text-red-600">Suspended</div>
                <div className="text-2xl font-black mt-1">{subs.suspended ?? 0}</div>
              </div>
              <div className="bg-slate-100 text-slate-800 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Cancelled</div>
                <div className="text-2xl font-black mt-1">{subs.cancelled ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Reseller Sales & Profitability Ranking */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Reseller Performance & Sales Ledger
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Reseller Organization</th>
                    <th className="py-3.5 px-4">Customers</th>
                    <th className="py-3.5 px-4">Wallet Balance</th>
                    <th className="py-3.5 px-4">Total Sales</th>
                    <th className="py-3.5 px-4">Reseller Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {resellers.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{r.customer_count ?? 0} customers</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{fmt(r.wallet_balance)}</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600">{fmt(r.total_sales)}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{fmt(r.total_profit)}</td>
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
