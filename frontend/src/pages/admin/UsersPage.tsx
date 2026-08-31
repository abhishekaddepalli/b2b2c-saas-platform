import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Users } from 'lucide-react';
import { adminApi } from '../../api';
import type { User } from '../../types';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, roleFilter],
    queryFn: () => adminApi.users({ search, role: roleFilter, per_page: 25 }).then(r => r.data),
  });

  const users: User[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform accounts, Super Admins, Resellers & Customers</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="RESELLER">Reseller</option>
          <option value="USER">Customer</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['User', 'Email', 'Role(s)', 'Status', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                        {(u.name || u.email || 'U').trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{u.name || u.email || 'User'}</div>
                        <div className="text-xs text-slate-400">{u.phone || 'No phone'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{u.email || '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles ?? []).map((r: any, idx: number) => {
                        const roleName = typeof r === 'string' ? r : (r?.name ?? 'USER');
                        return (
                          <span key={`${roleName}-${idx}`} className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {roleName}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(u.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
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
