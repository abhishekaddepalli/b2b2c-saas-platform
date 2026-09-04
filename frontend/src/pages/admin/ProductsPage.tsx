import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Plus, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, X, Edit3, Trash2,
  Sparkles, Layers, ArrowUpRight, Image as ImageIcon,
  LogIn, Truck, Key, Download, Globe, Lock, ExternalLink, Eye,
  ShoppingBag, CheckSquare, Square, Check, FolderInput
} from 'lucide-react';
import { adminApi } from '../../api';
import WooCommerceSyncModal from '../../components/integrations/WooCommerceSyncModal';
import type { Product } from '../../types';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const presetProductImages = [
  { label: 'Software License', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=60' },
  { label: 'Cloud App', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=60' },
  { label: 'Hardware Key', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=60' },
];

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Bulk Selection & WooCommerce Sync
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showWcModal, setShowWcModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const emptyForm = {
    name: '',
    slug: '',
    sku: '',
    category_id: '',
    type: 'license',
    status: 'active',
    visibility: 'public',
    short_description: '',
    full_description: '',
    featured: false,
    cost_price: 199,
    reseller_price: 349,
    customer_price: 599,
    image_url: '',
    live_preview_url: '',

    // Physical fields
    weight: '0.5',
    dimensions: '15 x 10 x 5 cm',
    courier: 'BlueDart Express',
    delivery_days: 4,
    shipping_charge: 0,
    warehouse_location: 'Central Fulfillment Hub, Mumbai',

    // Digital fields
    download_url: '',
    file_size: '50 MB',
    file_version: 'v1.0.0',
    download_limit: 10,

    // Software license fields
    software_url: '',
    login_portal_url: '',
    login_username: '',
    login_password: '',
    access_instructions: '',
    validity_days: 365,
    activation_limit: '3 Devices / 1 Domain',
  };

  const [form, setForm] = useState(emptyForm);

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.categories({ per_page: 100 }).then(r => r.data),
  });
  const categories: any[] = categoriesData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', search, statusFilter, typeFilter, categoryFilter],
    queryFn: () => adminApi.products({ search, status: statusFilter, type: typeFilter, category_id: categoryFilter, per_page: 50 }).then(r => r.data),
  });

  const products: Product[] = data?.data ?? [];

  const handleSyncCatalog = async () => {
    try {
      setIsSyncing(true);
      const res = await adminApi.syncInfiniforgeCatalog();
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setSuccessMsg(res?.data?.message || 'Infiniforge catalog synchronized successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to sync Infiniforge catalog.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === products.length && products.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkAction = async (action: 'delete' | 'update_status' | 'assign_category') => {
    if (selectedIds.size === 0) return;
    if (action === 'delete') {
      const confirmed = window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected products?`);
      if (!confirmed) return;
    }

    try {
      setIsBulkLoading(true);
      const payload: any = {
        action,
        ids: Array.from(selectedIds),
      };
      if (action === 'update_status') payload.status = bulkStatus;
      if (action === 'assign_category') payload.category_id = bulkCategory;

      const res = await adminApi.bulkProducts(payload);
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setSelectedIds(new Set());
      setSuccessMsg(res.data?.message || 'Bulk operation completed successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Bulk operation failed.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Metrics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const digitalProducts = products.filter(p => p.type === 'digital' || p.type === 'software').length;
  const featuredProducts = products.filter(p => p.featured).length;

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createProduct(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setShowCreate(false);
      setForm(emptyForm);
      setSuccessMsg('Product created successfully with visual asset and pricing!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to create product.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminApi.updateProduct(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setEditingProduct(null);
      setSuccessMsg('Product updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to update product.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setSuccessMsg('Product deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to delete product.');
    },
  });

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const price = (p as any).prices?.[0];
    const img = (p as any).images?.[0]?.path || '';
    const meta = typeof p.metadata === 'object' && p.metadata !== null
      ? p.metadata
      : (typeof p.metadata === 'string' ? JSON.parse(p.metadata || '{}') : {});

    setForm({
      name: p.name,
      slug: p.slug,
      sku: p.sku || '',
      category_id: (p as any).category_id || (p as any).category?.id || '',
      type: p.type || 'license',
      status: p.status || 'active',
      visibility: p.visibility || 'public',
      short_description: p.short_description || '',
      full_description: p.full_description || '',
      featured: p.featured || false,
      cost_price: price?.cost_price || 0,
      reseller_price: price?.reseller_price || 0,
      customer_price: price?.customer_price || 0,
      image_url: img,
      live_preview_url: meta.live_preview_url || '',

      // Physical
      weight: p.weight || meta.weight || '0.5',
      dimensions: meta.dimensions || '15 x 10 x 5 cm',
      courier: meta.courier || 'BlueDart Express',
      delivery_days: meta.delivery_days || 4,
      shipping_charge: meta.shipping_charge || 0,
      warehouse_location: meta.warehouse_location || 'Central Fulfillment Hub, Mumbai',

      // Digital
      download_url: meta.download_url || '',
      file_size: meta.file_size || '50 MB',
      file_version: meta.file_version || 'v1.0.0',
      download_limit: meta.download_limit || 10,

      // Software License
      software_url: meta.software_url || '',
      login_portal_url: meta.login_portal_url || '',
      login_username: meta.login_username || '',
      login_password: meta.login_password || '',
      access_instructions: meta.access_instructions || '',
      validity_days: meta.validity_days || 365,
      activation_limit: meta.activation_limit || '3 Devices / 1 Domain',
    });
    setErrorMsg('');
  };

  const handleSessionReset = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login?expired=1';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-600" />
            Products Catalog & Wholesales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage software, licenses, physical assets, and digital products available for resale.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncCatalog}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all shrink-0 border border-slate-700 disabled:opacity-50"
            title="Sync all products & categories from Infiniforge.cloud"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>{isSyncing ? 'Syncing...' : 'Sync Infiniforge'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowWcModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            title="Import & Sync Products from WooCommerce REST API"
          >
            <ShoppingBag className="w-4 h-4 text-purple-200" />
            <span>WooCommerce Sync</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreate(true);
              setForm(emptyForm);
              setErrorMsg('');
            }}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> New Product
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {errorMsg.toLowerCase().includes('unauthenticated') && (
            <button
              type="button"
              onClick={handleSessionReset}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" /> Re-Login Now
            </button>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Products</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalProducts}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Products</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{activeProducts}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Digital & Software</div>
            <div className="text-xl font-bold text-violet-600 mt-1">{digitalProducts}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Featured Items</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{featuredProducts}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar with Search Clear & Category Dropdown */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by title, SKU, or summary…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="digital">Digital Download</option>
              <option value="license">Software License</option>
              <option value="physical">Physical Asset</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <span className="text-xs text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 rounded-lg shrink-0">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
        </div>

        {/* Quick Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Categories:</span>
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              !categoryFilter
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.slice(0, 8).map((cat: any) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(isSelected ? '' : cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}

          {(search || categoryFilter || typeFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setTypeFilter('');
                setStatusFilter('');
              }}
              className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 shrink-0 px-2 py-0.5"
            >
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading products catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first catalog product with an image and wholesale pricing.
            </p>
            <button
              onClick={() => {
                setShowCreate(true);
                setForm(emptyForm);
              }}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Product Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      ref={input => {
                        if (input) {
                          input.indeterminate = selectedIds.size > 0 && selectedIds.size < products.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      title="Select all products"
                    />
                  </th>
                  <th className="px-4 py-3.5">Product & Visual Asset</th>
                  <th className="px-4 py-3.5">Type & SKU</th>
                  <th className="px-4 py-3.5">Cost Price</th>
                  <th className="px-4 py-3.5">Reseller Price</th>
                  <th className="px-4 py-3.5">Retail Price</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map(p => {
                  const isSelected = selectedIds.has(p.id);
                  const price = (p as any).prices?.[0];
                  const primaryImg = (p as any).images?.[0]?.path;

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              {p.name}
                              {p.featured && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400 font-mono">
                                /{p.slug}
                              </span>
                              {((p as any).category?.name || categories.find((c: any) => c.id === (p as any).category_id)?.name) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {(p as any).category?.name || categories.find((c: any) => c.id === (p as any).category_id)?.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                          {p.type}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-500">
                        ₹{price?.cost_price ?? '0.00'}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-violet-700">
                        ₹{price?.reseller_price ?? '0.00'}
                      </td>

                      <td className="px-4 py-3.5 font-black text-slate-900">
                        ₹{price?.customer_price ?? '0.00'}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[p.status || 'active']}`}>
                          <span className="capitalize">{p.status || 'active'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete product "${p.name}"?`)) {
                                deleteMutation.mutate(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-6 z-30 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
              {selectedIds.size}
            </div>
            <div>
              <div className="font-bold text-xs">
                {selectedIds.size} {selectedIds.size === 1 ? 'Product' : 'Products'} Selected
              </div>
              <div className="text-[10px] text-slate-400">Perform bulk status change, category reassignment, or delete</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Status:</span>
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <button
                type="button"
                onClick={() => handleBulkAction('update_status')}
                disabled={isBulkLoading}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Category Assign Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Category:</span>
              <select
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs max-w-[130px] truncate"
              >
                <option value="">Choose...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleBulkAction('assign_category')}
                disabled={isBulkLoading || !bulkCategory}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Move
              </button>
            </div>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={() => handleBulkAction('delete')}
              disabled={isBulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {(showCreate || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                  </h2>
                  <p className="text-xs text-slate-500">Configure catalog product details, image, and wholesale tiers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setErrorMsg('');
                const payload = {
                  ...form,
                  metadata: {
                    live_preview_url: form.live_preview_url,
                    // Physical
                    dimensions: form.dimensions,
                    courier: form.courier,
                    delivery_days: form.delivery_days,
                    shipping_charge: form.shipping_charge,
                    warehouse_location: form.warehouse_location,
                    // Digital
                    download_url: form.download_url,
                    file_size: form.file_size,
                    file_version: form.file_version,
                    download_limit: form.download_limit,
                    // Software License
                    software_url: form.software_url,
                    login_portal_url: form.login_portal_url,
                    login_username: form.login_username,
                    login_password: form.login_password,
                    access_instructions: form.access_instructions,
                    validity_days: form.validity_days,
                    activation_limit: form.activation_limit,
                  }
                };
                if (editingProduct) {
                  updateMutation.mutate({ id: editingProduct.id, payload });
                } else {
                  createMutation.mutate(payload);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JetBrains Ultimate License"
                    value={form.name}
                    onChange={e => {
                      const name = e.target.value;
                      setForm(f => ({
                        ...f,
                        name,
                        slug: f.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Image Option */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" /> Product Image URL
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Displays in Marketplace & Details</span>
                </label>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="https://example.com/product-box.jpg"
                      value={form.image_url}
                      onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs"
                    />
                  </div>
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                  )}
                </div>

                {/* Preset Product Badges */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or select a preset visual:</div>
                  <div className="flex flex-wrap gap-2">
                    {presetProductImages.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, image_url: preset.url }))}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                          form.image_url === preset.url
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-3.5 h-3.5 rounded object-cover" />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="license">Software License Key (Auto-Gen Key)</option>
                    <option value="digital">Digital Product (Downloadable)</option>
                    <option value="physical">Physical Product (Shippable)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="draft">Draft (Unlisted)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Instant delivery software license key with 1-year updates"
                  value={form.short_description}
                  onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Preview / Demo URL */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" /> Interactive Live Preview / Demo URL
                  </span>
                  <span className="text-[10px] text-slate-400">Shown in Marketplace as "Live Preview"</span>
                </label>
                <input
                  type="url"
                  placeholder="https://demo.example.com"
                  value={form.live_preview_url}
                  onChange={e => setForm(f => ({ ...f, live_preview_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              {/* CONDITIONAL SECTION 1: PHYSICAL PRODUCT */}
              {form.type === 'physical' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <Truck className="w-4 h-4 text-emerald-600" /> Physical Product & Shipping Configuration
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      Shippable Asset
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Courier / Shipping Partner</label>
                      <input
                        type="text"
                        placeholder="e.g. BlueDart, Delhivery, DTDC"
                        value={form.courier}
                        onChange={e => setForm(f => ({ ...f, courier: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Estimated Delivery (Days)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 4"
                        value={form.delivery_days}
                        onChange={e => setForm(f => ({ ...f, delivery_days: parseInt(e.target.value) || 4 }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Item Weight (kg)</label>
                      <input
                        type="text"
                        placeholder="e.g. 0.5 kg"
                        value={form.weight}
                        onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Package Dimensions</label>
                      <input
                        type="text"
                        placeholder="e.g. 15 x 10 x 5 cm"
                        value={form.dimensions}
                        onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="col-span-full">
                      <label className="block font-semibold text-slate-700 mb-1">Warehouse / Inventory Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Central Fulfillment Hub, Mumbai"
                        value={form.warehouse_location}
                        onChange={e => setForm(f => ({ ...f, warehouse_location: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CONDITIONAL SECTION 2: DIGITAL DOWNLOAD PRODUCT */}
              {form.type === 'digital' && (
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                    <span className="font-bold text-sky-900 flex items-center gap-1.5 text-xs">
                      <Download className="w-4 h-4 text-sky-600" /> Digital Product & File Delivery
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-800">
                      Downloadable File
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="col-span-full">
                      <label className="block font-semibold text-slate-700 mb-1">Download Asset File URL *</label>
                      <input
                        type="url"
                        placeholder="https://assets.example.com/downloads/setup.zip"
                        value={form.download_url}
                        onChange={e => setForm(f => ({ ...f, download_url: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">File Size</label>
                      <input
                        type="text"
                        placeholder="e.g. 50 MB"
                        value={form.file_size}
                        onChange={e => setForm(f => ({ ...f, file_size: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Current Version</label>
                      <input
                        type="text"
                        placeholder="e.g. v1.0.0"
                        value={form.file_version}
                        onChange={e => setForm(f => ({ ...f, file_version: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Max Download Attempts</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 10"
                        value={form.download_limit}
                        onChange={e => setForm(f => ({ ...f, download_limit: parseInt(e.target.value) || 10 }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CONDITIONAL SECTION 3: SOFTWARE LICENSE PRODUCT */}
              {(form.type === 'license' || form.type === 'software_license') && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                    <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs">
                      <Key className="w-4 h-4 text-indigo-600" /> Software License Key & Login Credentials
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                      Auto-Gen Key + Manual Override
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/80 rounded-xl border border-indigo-100 text-[11px] text-indigo-900">
                    💡 <strong>Automated Delivery:</strong> On purchase, a unique license key (e.g. <code>ABCD-1234-EFGH-5678</code>) and temporary login password are automatically generated and displayed in the user/reseller panel. You can manually edit or update credentials anytime in Orders!
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Software Download / Portal Link</label>
                      <input
                        type="url"
                        placeholder="https://download.mysoftware.com"
                        value={form.software_url}
                        onChange={e => setForm(f => ({ ...f, software_url: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Client Login Portal URL</label>
                      <input
                        type="url"
                        placeholder="https://app.mysoftware.com/login"
                        value={form.login_portal_url}
                        onChange={e => setForm(f => ({ ...f, login_portal_url: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">License Term (Validity Days)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 365"
                        value={form.validity_days}
                        onChange={e => setForm(f => ({ ...f, validity_days: parseInt(e.target.value) || 365 }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Activation Limit</label>
                      <input
                        type="text"
                        placeholder="e.g. 3 Devices / 1 Domain"
                        value={form.activation_limit}
                        onChange={e => setForm(f => ({ ...f, activation_limit: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="col-span-full">
                      <label className="block font-semibold text-slate-700 mb-1">Activation & Setup Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Install the software, launch it, navigate to Help > Enter License Key, and paste your license key."
                        value={form.access_instructions}
                        onChange={e => setForm(f => ({ ...f, access_instructions: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" /> Wholesale & Retail Pricing (₹ INR)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Platform Cost Price ₹</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={form.cost_price}
                      onChange={e => setForm(f => ({ ...f, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Reseller Wholesale Price ₹</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={form.reseller_price}
                      onChange={e => setForm(f => ({ ...f, reseller_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono text-violet-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Retail Customer Price ₹</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={form.customer_price}
                      onChange={e => setForm(f => ({ ...f, customer_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono text-slate-900 font-bold"
                    />
                  </div>
                </div>

                {/* Profit Preview */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-900 font-medium">
                    Platform Profit: <span className="font-bold">₹{(form.reseller_price - form.cost_price).toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-violet-100/50 rounded-lg text-violet-900 font-medium">
                    Reseller Markup: <span className="font-bold">₹{(form.customer_price - form.reseller_price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-800">Featured in platform marketplace</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WooCommerce Sync Modal */}
      <WooCommerceSyncModal
        isOpen={showWcModal}
        onClose={() => setShowWcModal(false)}
        defaultImportAs="product"
        categories={categories}
        onSyncComplete={() => qc.invalidateQueries({ queryKey: ['admin', 'products'] })}
      />
    </div>
  );
}
