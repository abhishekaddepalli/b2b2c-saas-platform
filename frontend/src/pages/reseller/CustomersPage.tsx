import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Plus, Search, Users } from 'lucide-react';
import { resellerApi } from '../../api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

export default function ResellerCustomers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['reseller', 'customers', search],
    queryFn: () => resellerApi.customers({ search, per_page: 30 }).then(r => r.data),
  });

  const customers: Customer[] = data?.data ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await resellerApi.createCustomer(form);
      qc.invalidateQueries({ queryKey: ['reseller', 'customers'] });
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', company: '', notes: '' });
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors ?? {};
      const flat: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]) => { flat[k] = (v as string[])[0]; });
      setErrors(flat);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search customers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">No customers yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first customer to get started</p>
            <button onClick={() => setShowAdd(true)}
              className="mt-4 text-sm text-violet-600 font-medium hover:text-violet-700">
              + Add customer
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Customer', 'Email', 'Phone', 'Status', 'Since', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{c.email}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{c.phone ?? '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/reseller/customers/${c.id}`} className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-bold text-slate-900 mb-5">Add New Customer</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { field: 'name', label: 'Full Name', required: true },
                { field: 'email', label: 'Email', required: true, type: 'email' },
                { field: 'phone', label: 'Phone', required: false },
                { field: 'company', label: 'Company', required: false },
              ].map(({ field, label, required, type }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}{!required && <span className="text-slate-400 font-normal"> (optional)</span>}
                  </label>
                  <input
                    type={type ?? 'text'}
                    value={(form as any)[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    required={required}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {errors[field] && <p className="text-xs text-red-600 mt-1">{errors[field]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-violet-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
