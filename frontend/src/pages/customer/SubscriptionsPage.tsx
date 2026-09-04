import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CreditCard, Search, ShoppingBag, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, Layers, Clock, AlertCircle, X,
  ExternalLink, Key, Eye, EyeOff, Copy, Check, Server,
  Globe, Sparkles, RefreshCw, LayoutGrid, Table, Calendar,
  ArrowRight, ShieldCheck, Terminal
} from 'lucide-react';
import { subscriptionsApi } from '../../api';

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  trial: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  suspended: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
  expired: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function CustomerSubscriptions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedSubForCredentials, setSelectedSubForCredentials] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['customer', 'subscriptions', search, statusFilter],
    queryFn: () => subscriptionsApi.list({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const subscriptions: any[] = data?.data ?? [];

  // Summary Metrics
  const totalSubs = subscriptions.length;
  const activeSubs = subscriptions.filter(s => s.status === 'active').length;
  const totalMonthlySpend = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      const amt = Number(s.amount ?? s.service_plan?.price ?? 1499);
      return sum + (s.billing_interval === 'yearly' ? Math.round(amt / 12) : amt);
    }, 0);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to extract metadata safely
  const getSubMeta = (s: any) => {
    let meta: any = {};
    if (typeof s.metadata === 'object' && s.metadata !== null) {
      meta = s.metadata;
    } else if (typeof s.metadata === 'string') {
      try {
        meta = JSON.parse(s.metadata);
      } catch {
        meta = {};
      }
    }
    const service = s.service_plan?.service;
    const srvMeta = typeof service?.metadata === 'object' && service?.metadata !== null
      ? service.metadata
      : (typeof service?.metadata === 'string' ? (JSON.parse(service.metadata || '{}')) : {});

    return {
      service_name: service?.name || meta.service_name || s.name || 'Cloud SaaS Service',
      service_image: service?.image_url || service?.thumbnail_url || meta.image_url || null,
      plan_name: s.service_plan?.name || meta.plan_name || 'Standard Plan',
      access_url: meta.access_url || meta.portal_url || meta.login_url || srvMeta.access_url || srvMeta.login_url || 'https://app.infiniforge.cloud',
      portal_url: meta.portal_url || meta.access_url || srvMeta.portal_url || 'https://app.infiniforge.cloud',
      username: meta.username || meta.login_username || 'customer@infiniforge.cloud',
      password: meta.password || meta.login_password || 'AutoSecured@123',
      server_ip: meta.server_ip || srvMeta.server_ip || null,
      port: meta.port || srvMeta.port || null,
      license_key: meta.license_key || null,
      instructions: meta.instructions || srvMeta.instructions || 'Use the provided credentials to log into your cloud dashboard.',
      admin_notes: meta.admin_notes || null,
    };
  };

  // Helper to compute expiry bar details
  const getExpiryProgress = (s: any) => {
    const now = Date.now();
    const startDate = s.current_period_start ? new Date(s.current_period_start).getTime() : (now - 5 * 86400000);
    const endDate = s.current_period_end ? new Date(s.current_period_end).getTime() : (s.next_billing_at ? new Date(s.next_billing_at).getTime() : (now + 25 * 86400000));
    const totalDuration = Math.max(1, endDate - startDate);
    const elapsed = Math.max(0, now - startDate);
    const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

    let barColor = 'bg-emerald-500';
    let textColor = 'text-emerald-700';
    let statusText = `${daysRemaining} days left`;

    if (daysRemaining <= 0 || s.status === 'expired') {
      barColor = 'bg-rose-500';
      textColor = 'text-rose-700';
      statusText = 'Expired';
    } else if (daysRemaining <= 5) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-700';
      statusText = `${daysRemaining} days left (Expiring soon)`;
    }

    return {
      percentElapsed,
      daysRemaining,
      barColor,
      textColor,
      statusText,
      startDate: new Date(startDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
      endDate: new Date(endDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            My SaaS & Cloud Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your active cloud subscriptions, view launch links, credentials, and track billing cycle expiry bars.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/app/marketplace"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Services</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Services</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeSubs}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{totalSubs} Total Subscribed</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Monthly Commitment</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{totalMonthlySpend.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Automated Active Billing</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Cloud Provisioning</div>
            <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Instant Access Ready</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Credentials & Console Available</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search services by plan name, service or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs">Loading active cloud services…</span>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center space-y-3">
          <Layers className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No subscriptions found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any active cloud service subscriptions yet. Visit the Marketplace to subscribe.
          </p>
          <Link
            to="/app/marketplace"
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Browse Cloud & SaaS Services
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* Rich Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subscriptions.map(s => {
            const meta = getSubMeta(s);
            const expiry = getExpiryProgress(s);
            const sc = statusColors[s.status || 'active'] ?? statusColors.active;

            return (
              <div
                key={s.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Section */}
                <div className="p-5 space-y-4">
                  {/* Service Image / Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {meta.service_image ? (
                        <img
                          src={meta.service_image}
                          alt={meta.service_name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                          {meta.service_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {meta.service_name}
                        </h3>
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                          <span>{meta.plan_name}</span>
                          <span>•</span>
                          <span className="capitalize">{s.billing_interval || 'Monthly'}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${sc.bg} ${sc.text} ${sc.border}`}>
                      {s.status || 'active'}
                    </span>
                  </div>

                  {/* Price & Renewal Info */}
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Recurring Price</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        ₹{Number(s.amount ?? s.service_plan?.price ?? 1499).toLocaleString('en-IN')}
                        <span className="text-[11px] font-normal text-slate-400"> / {s.billing_interval === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Renews On</div>
                      <div className="text-xs font-semibold text-slate-700 mt-0.5">{expiry.endDate}</div>
                    </div>
                  </div>

                  {/* Visual Expiry Progress Bar */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Billing Cycle Progress
                      </span>
                      <strong className={`font-bold ${expiry.textColor}`}>
                        {expiry.statusText}
                      </strong>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${expiry.barColor}`}
                        style={{ width: `${expiry.percentElapsed}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Started: {expiry.startDate}</span>
                      <span>Next: {expiry.endDate}</span>
                    </div>
                  </div>

                  {/* Fast Server / IP Quick Peek */}
                  {meta.server_ip && (
                    <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-indigo-50/50 border border-indigo-100/60 text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Server className="w-3.5 h-3.5 text-indigo-500" />
                        <span>IP: {meta.server_ip}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(meta.server_ip, `ip-${s.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold"
                      >
                        {copiedKey === `ip-${s.id}` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubForCredentials(s)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Access Credentials</span>
                  </button>

                  <a
                    href={meta.access_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch Console</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Service & Plan</th>
                  <th className="px-5 py-3.5">Billing Term</th>
                  <th className="px-5 py-3.5">Recurring Price</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Billing Expiry</th>
                  <th className="px-5 py-3.5 text-right">Console / Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subscriptions.map(s => {
                  const meta = getSubMeta(s);
                  const expiry = getExpiryProgress(s);
                  const sc = statusColors[s.status || 'active'] ?? statusColors.active;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{meta.service_name}</div>
                        <div className="text-[11px] text-slate-400">{meta.plan_name} • ID: {s.id?.substring(0, 8)}</div>
                      </td>

                      <td className="px-5 py-3.5 capitalize font-medium text-slate-600">
                        {s.billing_interval || 'Monthly'}
                      </td>

                      <td className="px-5 py-3.5 font-black text-slate-900 text-sm">
                        ₹{Number(s.amount ?? s.service_plan?.price ?? 1499).toLocaleString('en-IN')}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${sc.bg} ${sc.text} ${sc.border}`}>
                          {s.status || 'active'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 min-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-semibold">{expiry.endDate}</span>
                            <span className={`font-bold ${expiry.textColor}`}>{expiry.statusText}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${expiry.barColor}`}
                              style={{ width: `${expiry.percentElapsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSubForCredentials(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" /> Credentials
                          </button>
                          <a
                            href={meta.access_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Launch
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Access Credentials & Service Details Modal */}
      {selectedSubForCredentials && (() => {
        const meta = getSubMeta(selectedSubForCredentials);
        const expiry = getExpiryProgress(selectedSubForCredentials);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center">
                    <Key className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">{meta.service_name}</h2>
                    <p className="text-xs text-indigo-300">Access Credentials & Cloud Console Details</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubForCredentials(null);
                    setShowPassword(false);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 text-xs text-slate-700">
                {/* Status & Expiry Bar Snapshot */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Service Status:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {selectedSubForCredentials.status || 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Renewal Countdown:</span>
                    <span className={`font-bold ${expiry.textColor}`}>{expiry.statusText} ({expiry.endDate})</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${expiry.barColor}`}
                      style={{ width: `${expiry.percentElapsed}%` }}
                    />
                  </div>
                </div>

                {/* Credentials Fields */}
                <div className="space-y-3.5">
                  {/* Portal / Access URL */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Service Portal / Launch URL
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 truncate select-all">
                        {meta.access_url}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(meta.access_url, 'access_url')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Copy URL"
                      >
                        {copiedKey === 'access_url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={meta.access_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Username / Login Email
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 truncate select-all">
                        {meta.username}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(meta.username, 'username')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Copy Username"
                      >
                        {copiedKey === 'username' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Password / Access Key
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 truncate select-all">
                        {showPassword ? meta.password : '••••••••••••••••'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(meta.password, 'password')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Copy Password"
                      >
                        {copiedKey === 'password' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Server IP & Port (if present) */}
                  {meta.server_ip && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Server IP Address
                        </label>
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl text-xs font-mono text-slate-800">
                          <span className="truncate">{meta.server_ip}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(meta.server_ip, 'server_ip')}
                            className="ml-auto text-slate-400 hover:text-slate-600"
                          >
                            {copiedKey === 'server_ip' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Port / Protocol
                        </label>
                        <div className="bg-slate-100 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 truncate">
                          {meta.port || '443 / HTTPS'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* License Key (if present) */}
                  {meta.license_key && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Digital License Key / Token
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 px-3 py-2 rounded-xl text-xs font-mono text-indigo-700 font-bold truncate select-all">
                          {meta.license_key}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(meta.license_key, 'license_key')}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Copy License Key"
                        >
                          {copiedKey === 'license_key' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Super Admin Instructions & Notes */}
                  {meta.instructions && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                      <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Setup & Connection Instructions:</span>
                      </div>
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        {meta.instructions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Launch Button Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Configured by Cloud Administrator
                  </span>
                  <a
                    href={meta.access_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <span>Launch Service Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
