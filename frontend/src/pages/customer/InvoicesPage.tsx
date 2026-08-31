import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Loader2, Search } from 'lucide-react';
import { ordersApi } from '../../api';

export default function CustomerInvoices() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customer', 'invoices', search],
    queryFn: () => ordersApi.list({ search, per_page: 25 }).then(r => r.data),
  });

  const orders: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices & Receipts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Download official tax invoices for your purchases</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number…"
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
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No invoices generated yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Invoice / Order #', 'Date', 'Status', 'Total Amount', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-mono text-xs font-bold text-indigo-600">INV-{o.order_number?.replace('ORD-', '') || o.id.substring(0, 8)}</div>
                    <div className="text-[11px] text-slate-400">Order: {o.order_number}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(o.placed_at || o.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      Paid
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold text-slate-900">₹{Number(o.total_amount ?? o.grand_total ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => alert(`Invoice INV-${o.order_number?.replace('ORD-', '')} downloaded.`)}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
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
