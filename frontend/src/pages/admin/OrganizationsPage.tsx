import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle, Loader2, Search, ShieldAlert } from 'lucide-react';
import { adminApi } from '../../api';
import type { Organization } from '../../types';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  suspended: 'bg-red-50 text-red-700',
};

export default function AdminOrganizations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'organizations', search, statusFilter, typeFilter],
    queryFn: () => adminApi.organizations({ search, status: statusFilter, type: typeFilter, per_page: 25 }).then(r => r.data),
  });

  const orgs: Organization[] = data?.data ?? [];

  const handleStatusChange = async (id: string, newStatus: string) => {
    await adminApi.updateOrgStatus(id, newStatus);
    qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage reseller tenants & platform HQ</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search organization…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All types</option>
          <option value="reseller">Reseller</option>
          <option value="platform_hq">Platform HQ</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No organizations found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Organization', 'Slug', 'Type', 'Status', 'Currency', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orgs.map(org => (
                <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{org.name}</div>
                        <div className="text-xs text-slate-400">{org.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{org.slug}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">{org.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[org.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {org.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{org.currency}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(org.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {org.status !== 'active' && (
                        <button
                          onClick={() => handleStatusChange(org.id, 'active')}
                          className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {org.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(org.id, 'suspended')}
                          className="flex items-center gap-1 text-xs text-red-600 font-medium hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                    </div>
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
