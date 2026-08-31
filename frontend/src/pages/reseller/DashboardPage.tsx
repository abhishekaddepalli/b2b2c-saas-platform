import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, IndianRupee, Loader2, Plus, ScrollText, TrendingUp, Users, Wallet } from 'lucide-react';
import { resellerApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function KpiCard({ label, value, sub, icon: Icon, color, to }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; to?: string;
}) {
  const content = (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all ${to ? 'cursor-pointer' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function ResellerDashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['reseller', 'dashboard'],
    queryFn: () => resellerApi.dashboard().then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: profitChart } = useQuery({
    queryKey: ['reseller', 'profit-chart'],
    queryFn: () => resellerApi.profitChart().then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    );
  }

  const d = data ?? {};

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">{user?.organization?.name} · Reseller Portal</p>
        </div>
        <div className="flex gap-2">
          <Link to="/reseller/customers" className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors font-medium">
            <Plus className="w-4 h-4" />
            Add Customer
          </Link>
          <Link to="/app/marketplace" className="flex items-center gap-1.5 text-sm bg-violet-600 text-white px-3 py-2 rounded-xl hover:bg-violet-700 transition-colors font-medium">
            Browse & Order
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Customers" value={d.total_customers ?? 0} icon={Users} color="bg-violet-50 text-violet-600" to="/reseller/customers" />
        <KpiCard label="Active Subscriptions" value={d.active_subscriptions ?? 0} icon={CreditCard} color="bg-indigo-50 text-indigo-600" to="/reseller/subscriptions" />
        <KpiCard label="This Month Sales" value={`₹${(d.month_revenue ?? 0).toLocaleString('en-IN')}`} icon={ScrollText} color="bg-blue-50 text-blue-600" to="/reseller/orders" />
        <KpiCard label="This Month Profit" value={`₹${(d.month_profit ?? 0).toLocaleString('en-IN')}`} sub="Your margin earned" icon={TrendingUp} color="bg-emerald-50 text-emerald-600" to="/reseller/profit" />
      </div>

      {/* Profit Chart */}
      {profitChart && profitChart.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Sales & Profit — last 30 days</h2>
            <Link to="/reseller/profit" className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
              Full report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={profitChart}>
              <defs>
                <linearGradient id="rSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
              <Area type="monotone" dataKey="revenue" name="Sales" stroke="#7c3aed" strokeWidth={2} fill="url(#rSales)" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fill="url(#rProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick action grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Manage Customers', desc: `${d.total_customers ?? 0} customers`, to: '/reseller/customers', icon: Users, color: 'text-violet-600 bg-violet-50' },
          { label: 'View Wallet', desc: `₹${(d.wallet_balance ?? 0).toLocaleString('en-IN')} available`, to: '/reseller/wallet', icon: Wallet, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Profit Report', desc: 'Detailed breakdown', to: '/reseller/profit', icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' },
        ].map(({ label, desc, to, icon: Icon, color }) => (
          <Link key={to} to={to} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium text-slate-900 group-hover:text-violet-600 transition-colors text-sm">{label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}
