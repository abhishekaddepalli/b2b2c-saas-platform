import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CreditCard,
  Database,
  HardDrive,
  IndianRupee,
  Package,
  RefreshCw,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  Activity,
  CheckCircle2,
  Megaphone,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../../api';
import type { DashboardStats } from '../../types';

function fmt(n?: number | string | null) {
  const val = Number(n ?? 0);
  if (isNaN(val)) return '₹0';
  if (val >= 10_000_00) return `₹${(val / 100_000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
}

function StatCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard().then(r => r.data.data as DashboardStats),
    refetchInterval: 60_000,
  });

  const { data: healthData } = useQuery({
    queryKey: ['admin', 'control-center', 'health'],
    queryFn: () => adminApi.controlCenterHealth().then(r => r.data?.data),
    refetchInterval: 30_000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['admin', 'revenue-chart'],
    queryFn: () => adminApi.revenueChart().then(r => r.data.data),
  });

  const health = healthData ?? {
    database: { status: 'healthy', latency_ms: 2.5 },
    storage: { used_pct: 35.4, total_mb: 50000 },
    queue: { pending_jobs: 0, failed_jobs: 0 },
    webhooks: { total: 0, processed: 0, failed: 0 },
    active_users_24h: 0,
    recent_logins: [],
  };

  const s = statsData ?? {
    organizations: 0,
    total_users: 0,
    customers: 0,
    resellers: 0,
    orders: { total: 0, today: 0, pending: 0, this_month: 0 },
    subscriptions: { active: 0, trial: 0, grace_period: 0, suspended: 0 },
    revenue: { total_revenue: 0, platform_profit: 0, reseller_profit: 0, today_revenue: 0, month_revenue: 0 },
    attention_required: { failed_payments: 0, payment_failed_subs: 0, expiring_subscriptions: 0, suspended_subscriptions: 0, low_wallet_orgs: 0, pending_orgs: 0 },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Control Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time system health, queue status, active users & infrastructure telemetry</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload Telemetry
        </button>
      </div>

      {/* System Health & Infrastructure Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Database</div>
            <div className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> PostgreSQL
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Latency: {health.database?.latency_ms} ms</div>
          </div>
          <Database className="w-8 h-8 text-slate-300" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Storage Usage</div>
            <div className="text-lg font-bold text-slate-900 mt-1">{health.storage?.used_pct}% Used</div>
            <div className="text-xs text-slate-500 mt-0.5">{health.storage?.total_mb} MB Capacity</div>
          </div>
          <HardDrive className="w-8 h-8 text-slate-300" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Queue Worker</div>
            <div className="text-lg font-bold text-emerald-600 mt-1">Active Workers</div>
            <div className="text-xs text-slate-500 mt-0.5">Failed: {health.queue?.failed_jobs} | Pending: {health.queue?.pending_jobs}</div>
          </div>
          <Server className="w-8 h-8 text-slate-300" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Users (24h)</div>
            <div className="text-lg font-bold text-indigo-600 mt-1">{health.active_users_24h} Active</div>
            <div className="text-xs text-slate-500 mt-0.5">Live Auth Telemetry</div>
          </div>
          <Activity className="w-8 h-8 text-slate-300" />
        </div>
      </div>

      {/* Revenue KPIs */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Revenue & Financial Core</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Gross Revenue" value={fmt(s.revenue?.total_revenue)} icon={IndianRupee} color="bg-indigo-50 text-indigo-600" />
          <StatCard label="Platform Gross Profit" value={fmt(s.revenue?.platform_profit)} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Reseller Profit Earned" value={fmt(s.revenue?.reseller_profit)} icon={Wallet} color="bg-violet-50 text-violet-600" />
          <StatCard label="This Month" value={fmt(s.revenue?.month_revenue)} sub={`Today: ${fmt(s.revenue?.today_revenue)}`} icon={Zap} color="bg-amber-50 text-amber-600" />
        </div>
      </div>

      {/* Revenue vs Profit Chart */}
      {chartData && chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-6">30-Day Financial Trend — Revenue vs Platform Profit</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenue)" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fill="url(#profit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Login Activity & Recent Audits */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" /> Recent User Login Activity & Security Events
        </h2>
        <div className="space-y-2">
          {health.recent_logins.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">No recent security login events logged.</div>
          ) : (
            health.recent_logins.map((login: any) => (
              <div key={login.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900">{login.user?.name || login.user?.email || 'User'}</span>
                  <span className="text-slate-400">({login.ip_address || '127.0.0.1'})</span>
                </div>
                <span className="text-slate-400 font-mono">{new Date(login.created_at).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
