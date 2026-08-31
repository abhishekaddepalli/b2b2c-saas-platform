import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Loader2, Search } from 'lucide-react';
import { adminApi } from '../../api';
import type { Subscription } from '../../types';

export default function AdminSubscriptions() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions', search],
    queryFn: () => adminApi.subscriptions({ search, per_page: 25 }).then(r => r.data),
  });

  const subs: Subscription[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions Registry</h1>
          <p className="text-sm text-slate-500 mt-0.5">Active recurring SaaS subscriptions & billing periods</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscription ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : subs.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No subscriptions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['ID', 'Status', 'Interval', 'Amount', 'Period Start', 'Period End'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subs.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600 truncate max-w-xs">{s.id}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">{s.billing_interval}</td>
                  <td className="px-4 py-3.5 text-xs font-bold text-slate-900">₹{Number(s.amount ?? s.recurring_amount ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(s.current_period_start || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(s.current_period_end || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
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
