import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2 } from 'lucide-react';
import { adminApi } from '../../api';

export default function AdminAuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => adminApi.auditLogs().then(r => r.data),
  });

  const logs: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-0.5">Immutable audit trail of administrative actions & system events</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No audit logs recorded yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Event / Action', 'Auditable Entity', 'IP Address', 'Timestamp'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-medium text-slate-900">{l.event || l.action || 'System Event'}</div>
                    <div className="text-xs text-slate-400">{l.user?.email || 'System / Automated'}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">{l.auditable_type || l.entity_type} #{l.auditable_id || l.entity_id}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{l.ip_address || '127.0.0.1'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(l.created_at || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
