import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Loader2, Package, Plus, Search, Trash2 } from 'lucide-react';
import { adminApi } from '../../api';
import type { Product } from '../../types';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-amber-50 text-amber-700',
  archived: 'bg-slate-100 text-slate-500',
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emptyForm = {
    name: '', sku: '', type: 'digital', status: 'draft', visibility: 'public',
    short_description: '', full_description: '', featured: false,
    pricing_type: 'fixed', cost_price: '', reseller_price: '', customer_price: '',
    tax_rate: '0.18', currency: 'INR',
  };
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', search, statusFilter],
    queryFn: () => adminApi.products({ search, status: statusFilter, per_page: 25 }).then(r => r.data),
  });

  const products: Product[] = data?.data ?? [];

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(v => ({ ...v, [f]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const slug = form.sku ? form.sku.toLowerCase() : form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);
      await adminApi.createProduct({
        ...form,
        slug,
        cost_price: parseFloat(form.cost_price),
        reseller_price: parseFloat(form.reseller_price),
        customer_price: parseFloat(form.customer_price),
        tax_rate: parseFloat(form.tax_rate),
      });
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setShowCreate(false);
      setForm(emptyForm);
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors ?? {};
      const flat: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]) => { flat[k] = (v as string[])[0]; });
      setErrors(flat);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (product: Product) => {
    const next = product.status === 'active' ? 'archived' : 'active';
    await adminApi.updateProductStatus(product.id, next);
    qc.invalidateQueries({ queryKey: ['admin', 'products'] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await adminApi.deleteProduct(id);
    qc.invalidateQueries({ queryKey: ['admin', 'products'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No products found</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-700">
              + Create first product
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Product', 'SKU', 'Type', 'Status', 'Visibility', 'Cost', 'Reseller', 'Customer', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(p => {
                const price = (p as any).prices?.[0];
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0].path} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{p.name}</div>
                          {p.featured && <span className="text-xs text-indigo-600">★ Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{p.sku}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">{p.type}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => handleStatusToggle(p)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 ${statusColors[p.status]}`}>
                        {p.status}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 capitalize">{p.visibility.replace('_', ' ')}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-600">₹{price?.cost_price ?? '—'}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-violet-600">₹{price?.reseller_price ?? '—'}</td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-900">₹{price?.customer_price ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl my-8">
            <h2 className="font-bold text-slate-900 mb-5">Create Product</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Name *</label>
                  <input type="text" value={form.name} onChange={set('name')} required
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                {[
                  { field: 'type', label: 'Type', options: ['digital','physical','license','hardware','software','other'] },
                  { field: 'status', label: 'Status', options: ['draft','active','archived'] },
                  { field: 'visibility', label: 'Visibility', options: ['public','reseller_only','hidden'] },
                ].map(({ field, label, options }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <select value={(form as any)[field]} onChange={set(field)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {options.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
                    </select>
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
                  <input type="text" value={form.short_description} onChange={set('short_description')}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Pricing section */}
              <div className="border-t border-slate-100 pt-4">
                <div className="text-sm font-semibold text-slate-700 mb-3">Pricing</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { field: 'cost_price', label: 'Cost Price ₹', hint: 'Your cost — never shown to resellers' },
                    { field: 'reseller_price', label: 'Reseller Price ₹', hint: 'What resellers pay' },
                    { field: 'customer_price', label: 'Customer Price ₹', hint: 'End customer price' },
                  ].map(({ field, label, hint }) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
                      <input type="number" min="0" step="0.01" value={(form as any)[field]} onChange={set(field)} required
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
                      {errors[field] && <p className="text-xs text-red-600">{errors[field]}</p>}
                    </div>
                  ))}
                </div>
                {form.cost_price && form.reseller_price && form.customer_price && (
                  <div className="mt-3 bg-indigo-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-600">Platform margin: <span className="font-semibold text-indigo-700">₹{(parseFloat(form.reseller_price) - parseFloat(form.cost_price)).toFixed(2)}</span></div>
                    <div className="text-slate-600">Reseller margin: <span className="font-semibold text-violet-700">₹{(parseFloat(form.customer_price) - parseFloat(form.reseller_price)).toFixed(2)}</span></div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm); setErrors({}); }}
                  className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
