import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, FileText, Loader2, Search, Filter, RefreshCw,
  Eye, Calendar, Globe, User, Server, Layers, ArrowRight,
  CheckCircle, AlertTriangle, X, Terminal, Clock, Copy, Database,
  TrendingUp, Laptop
} from 'lucide-react';
import { adminApi } from '../../api';

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Audit Logs with Pagination & Search
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'audit-logs', search, actionFilter, page],
    queryFn: () => adminApi.auditLogs({ search, action: actionFilter, page, per_page: 20 }).then(r => r.data),
  });

  // Fetch Stats Summary
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'audit-logs-stats'],
    queryFn: () => adminApi.auditLogStats().then(r => r.data?.data),
    staleTime: 30000,
  });

  const logs: any[] = data?.data ?? [];
  const pagination = {
    currentPage: data?.current_page ?? 1,
    lastPage: data?.last_page ?? 1,
    total: data?.total ?? 0,
    from: data?.from ?? 0,
    to: data?.to ?? 0,
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('create') || act.includes('store') || act.includes('approved')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('delete') || act.includes('destroy') || act.includes('suspend') || act.includes('reject')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (act.includes('debit') || act.includes('refund') || act.includes('warning')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  const getEntityIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('user')) return User;
    if (t.includes('service')) return Layers;
    if (t.includes('product')) return Database;
    if (t.includes('wallet')) return TrendingUp;
    if (t.includes('org')) return Server;
    return Globe;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Security & System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable, tamper-evident chronological ledger of all administrative interventions, updates, and transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {/* KPI Intelligence Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Audited Events</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {(statsData?.total_events ?? pagination.total).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Logged Today</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {(statsData?.today_events ?? 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Operators</div>
            <div className="text-xl font-bold text-violet-600 mt-1">
              {(statsData?.active_actors ?? 1).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Unique Client IPs</div>
            <div className="text-xl font-bold text-amber-600 mt-1">
              {(statsData?.unique_ips ?? 1).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by action, resource ID, IP address, or administrator..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
          >
            <option value="">All Action Types</option>
            <option value="user">User & Account Operations</option>
            <option value="service">Services Catalog</option>
            <option value="product">Products Catalog</option>
            <option value="wallet">Wallet Adjustments & Debits</option>
            <option value="organization">Organization & Resellers</option>
            <option value="order">Orders & Billing</option>
            <option value="auth">Authentication & Logins</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Quick Filter:</span>
        {[
          { label: 'All Events', val: '' },
          { label: '💰 Wallet & Financials', val: 'wallet' },
          { label: '📦 Orders & Invoices', val: 'order' },
          { label: '⚡ Cloud & Subscriptions', val: 'subscription' },
          { label: '🏢 Resellers & Orgs', val: 'organization' },
          { label: '👤 Users & Accounts', val: 'user' },
        ].map(pill => (
          <button
            key={pill.val}
            type="button"
            onClick={() => { setActionFilter(pill.val); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              actionFilter === pill.val
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {pill.label}
          </button>
        ))}
        {(search || actionFilter) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setActionFilter(''); setPage(1); }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 ml-auto inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-3" />
            <p className="text-xs font-semibold">Decryption and loading audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No matching audit logs found</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Event & Action</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Operator / Actor</th>
                  <th className="px-4 py-3">Client Network</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map(log => {
                  const EntityIcon = getEntityIcon(log.entity_name || log.resource_type);
                  const formattedDate = new Date(log.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                        {log.organization && (
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                            <Server className="w-3 h-3 text-slate-400" />
                            Tenant: {log.organization.name}
                          </div>
                        )}
                      </td>

                      {/* Target Entity */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <EntityIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">
                              {log.entity_name || 'System Resource'}
                            </span>
                            {log.resource_id && (
                              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <span>{log.resource_id.substring(0, 12)}…</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(log.resource_id, log.id);
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 p-0.5"
                                >
                                  {copiedId === log.id ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actor / Operator */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                            {(log.actor?.name || 'S')[0]}
                          </div>
                          <span>{log.actor?.name || 'System Automated'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 pl-6.5">
                          {log.actor?.email || 'daemon@infiniforge.cloud'}
                        </div>
                      </td>

                      {/* Client Network & Device */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-slate-600 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.ip_address || '127.0.0.1'}</span>
                        </div>
                        {log.user_agent && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5 flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-slate-300 shrink-0" />
                            <span title={log.user_agent}>{log.user_agent.split(' ')[0]}</span>
                          </div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">Recorded Event</div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 font-semibold text-[11px] transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-700">{pagination.from}</span> to{' '}
              <span className="font-bold text-slate-700">{pagination.to}</span> of{' '}
              <span className="font-bold text-slate-700">{pagination.total}</span> audit records
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-700 px-2">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(pagination.lastPage, p + 1))}
                disabled={pagination.currentPage >= pagination.lastPage}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Inspection Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Audit Record Inspection</span>
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${getActionBadge(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {selectedLog.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Event Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-medium">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Operator</span>
                  <span className="text-slate-800 font-semibold">{selectedLog.actor?.name || 'Automated Daemon'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Target Type</span>
                  <span className="text-indigo-600 font-bold">{selectedLog.entity_name || 'System Resource'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Client IP</span>
                  <span className="font-mono text-slate-700">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Recorded At</span>
                  <span className="text-slate-700">{new Date(selectedLog.created_at).toLocaleTimeString('en-IN')}</span>
                </div>
              </div>

              {/* Resource Identification */}
              {selectedLog.resource_id && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Resource UUID</span>
                    <span className="font-mono text-slate-800 font-semibold">{selectedLog.resource_id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedLog.resource_id, 'modal')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50 flex items-center gap-1"
                  >
                    {copiedId === 'modal' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
              )}

              {/* State Diff / Changes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Previous State */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span className="text-red-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Previous State (Before)
                    </span>
                  </div>
                  <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-3 rounded-xl max-h-56 overflow-auto border border-slate-800">
                    <pre>{JSON.stringify(selectedLog.old_values || { message: 'No prior recorded state (Creation event)' }, null, 2)}</pre>
                  </div>
                </div>

                {/* Updated State */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Updated State (After)
                    </span>
                  </div>
                  <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-3 rounded-xl max-h-56 overflow-auto border border-slate-800">
                    <pre>{JSON.stringify(selectedLog.new_values || { message: 'No change payload captured' }, null, 2)}</pre>
                  </div>
                </div>
              </div>

              {/* User Agent / Context Telemetry */}
              {selectedLog.user_agent && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">User Agent Fingerprint</span>
                  <div className="font-mono text-[11px] text-slate-600 break-all">{selectedLog.user_agent}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
