import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Server, Plus, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, X, Edit3, Trash2,
  Sparkles, Layers, Clock, ArrowUpRight, Image as ImageIcon,
  LogIn, ExternalLink, Globe, Key, Box
} from 'lucide-react';
import { adminApi } from '../../api';
import type { Service } from '../../types';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const presetIcons = [
  { label: 'VPS Cloud', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=120&auto=format&fit=crop&q=60' },
  { label: 'Database', url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=120&auto=format&fit=crop&q=60' },
  { label: 'AI Suite', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=120&auto=format&fit=crop&q=60' },
  { label: 'Security Firewall', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=120&auto=format&fit=crop&q=60' },
];

export default function AdminServices() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const emptyForm = {
    name: '',
    slug: '',
    short_description: '',
    full_description: '',
    visibility: 'public',
    status: 'active',
    billing_type: 'recurring',
    billing_interval: 'monthly',
    trial_days: 0,
    plan_name: 'Standard Subscription',
    cost_price: 299,
    reseller_price: 499,
    customer_price: 799,
    featured: false,
    image_url: '',
    architecture_type: 'single',
    bundled_apps: '',
    live_preview_url: '',
    access_portal_url: '',
    default_credentials: '',
    setup_guide: '',
    provisioning_sla: 'Instant Automated Provisioning',
  };

  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'services', search, statusFilter],
    queryFn: () => adminApi.services({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const services: Service[] = data?.data ?? [];

  // Metrics
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === 'active').length;
  const recurringServices = services.filter(s => s.billing_type === 'recurring').length;
  const totalPlans = services.reduce((acc, s) => acc + (s.plans?.length || 1), 0);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      setShowCreate(false);
      setForm(emptyForm);
      setSuccessMsg('Service catalog item created successfully and live in marketplace!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to create service.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminApi.updateService(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      setEditingService(null);
      setSuccessMsg('Service updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to update service.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      setSuccessMsg('Service deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to delete service.');
    },
  });

  const openEditModal = (service: Service) => {
    setEditingService(service);
    const plan = service.plans?.[0];
    const price = (plan as any)?.prices?.[0];
    const meta = (service as any).metadata || {};

    setForm({
      name: service.name,
      slug: service.slug,
      short_description: service.short_description || '',
      full_description: service.full_description || '',
      visibility: service.visibility || 'public',
      status: service.status || 'active',
      billing_type: service.billing_type || 'recurring',
      billing_interval: service.billing_interval || 'monthly',
      trial_days: service.trial_days || 0,
      plan_name: plan?.name || 'Standard Subscription',
      cost_price: price?.cost_price || 0,
      reseller_price: price?.reseller_price || 0,
      customer_price: price?.customer_price || 0,
      featured: service.featured || false,
      image_url: service.icon || meta.image_url || '',
      architecture_type: meta.architecture_type || 'single',
      bundled_apps: Array.isArray(meta.bundled_apps) ? meta.bundled_apps.join(', ') : (meta.bundled_apps || ''),
      live_preview_url: meta.live_preview_url || '',
      access_portal_url: meta.access_portal_url || '',
      default_credentials: meta.default_credentials || '',
      setup_guide: meta.setup_guide || '',
      provisioning_sla: meta.provisioning_sla || 'Instant Automated Provisioning',
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
            <Server className="w-7 h-7 text-indigo-600" />
            Recurring Services & SaaS Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish SaaS tools, cloud infrastructure, and recurring subscription plans for resellers and customers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setForm(emptyForm);
            setErrorMsg('');
          }}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> New Service Plan
        </button>
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
            <div className="text-xs text-slate-500 font-medium">Total Services</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalServices}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Services</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{activeServices}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Recurring Subscriptions</div>
            <div className="text-xl font-bold text-violet-600 mt-1">{recurringServices}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Subscription Plans</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{totalPlans}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search services by title, description, or slug…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-2xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading services catalog...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Server className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No services found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first recurring SaaS service to populate the catalog and show in marketplace.
            </p>
            <button
              onClick={() => {
                setShowCreate(true);
                setForm(emptyForm);
              }}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Service Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Service & Visual Asset</th>
                  <th className="px-4 py-3.5">Billing Cycle</th>
                  <th className="px-4 py-3.5">Cost Price</th>
                  <th className="px-4 py-3.5">Reseller Wholesale</th>
                  <th className="px-4 py-3.5">Retail Price</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {services.map(s => {
                  const plan = s.plans?.[0];
                  const price = (plan as any)?.prices?.[0];
                  const hasCustomImage = s.icon && (s.icon.startsWith('http') || s.icon.startsWith('/'));

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {hasCustomImage ? (
                            <img
                              src={s.icon || undefined}
                              alt={s.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                              {s.name}
                              {s.featured && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                              {(s as any).metadata?.architecture_type === 'bundle' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 inline-flex items-center gap-1">
                                  <Box className="w-3 h-3" /> SaaS Suite ({Array.isArray((s as any).metadata?.bundled_apps) ? (s as any).metadata.bundled_apps.length : 'Bundle'})
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  Single App
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11px] text-slate-400 font-mono">/{s.slug}</span>
                              {(s as any).metadata?.live_preview_url && (
                                <a
                                  href={(s as any).metadata.live_preview_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" /> Demo
                                </a>
                              )}
                              {(s as any).metadata?.access_portal_url && (
                                <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5">
                                  <Globe className="w-2.5 h-2.5" /> Portal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                          {s.billing_interval || 'monthly'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {s.plans?.length || 1} plan(s)
                        </div>
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
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[s.status || 'active']}`}>
                          <span className="capitalize">{s.status || 'active'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Service"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove service "${s.name}" from catalog?`)) {
                                deleteMutation.mutate(s.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete Service"
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

      {/* CREATE / EDIT SERVICE MODAL */}
      {(showCreate || editingService) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingService ? 'Edit Recurring Service' : 'Create Recurring Service Plan'}
                  </h2>
                  <p className="text-xs text-slate-500">Configure catalog service details, imagery, and wholesale tiers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEditingService(null);
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
                    architecture_type: form.architecture_type,
                    bundled_apps: form.bundled_apps ? form.bundled_apps.split(',').map(s => s.trim()).filter(Boolean) : [],
                    live_preview_url: form.live_preview_url,
                    access_portal_url: form.access_portal_url,
                    default_credentials: form.default_credentials,
                    setup_guide: form.setup_guide,
                    provisioning_sla: form.provisioning_sla,
                  }
                };
                if (editingService) {
                  updateMutation.mutate({ id: editingService.id, payload });
                } else {
                  createMutation.mutate(payload);
                }
              }}
              className="space-y-4 text-xs"
            >
              {/* Architecture Type Selector */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <label className="block font-bold text-slate-800">SaaS Architecture Structure</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, architecture_type: 'single' }))}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      form.architecture_type === 'single'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Server className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Single Application</div>
                      <div className="text-[11px] text-slate-400">Standalone SaaS product or server</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, architecture_type: 'bundle' }))}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      form.architecture_type === 'bundle'
                        ? 'bg-violet-50 border-violet-500 text-violet-900 ring-1 ring-violet-500 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Box className="w-4 h-4 text-violet-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Bundled SaaS Suite</div>
                      <div className="text-[11px] text-slate-400">Multiple tools in single recurring plan</div>
                    </div>
                  </button>
                </div>

                {form.architecture_type === 'bundle' && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Included Suite Applications (comma-separated) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CRM Suite, Ticket Helpdesk, Invoicing AI, Analytics Dashboard"
                      value={form.bundled_apps}
                      onChange={e => setForm(f => ({ ...f, bundled_apps: e.target.value }))}
                      className="w-full px-3 py-2 border border-violet-200 bg-violet-50/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Customers will receive unified credentials or account links for all apps in this bundle.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VPS Starter Cloud Server"
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
                  <label className="block font-semibold text-slate-700 mb-1">Billing Interval</label>
                  <select
                    value={form.billing_interval}
                    onChange={e => setForm(f => ({ ...f, billing_interval: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="monthly">Monthly Recurring</option>
                    <option value="quarterly">Quarterly (3 Months)</option>
                    <option value="yearly">Yearly (Annual Plan)</option>
                    <option value="one_time">One-Time License / Fee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="99.9% Uptime with dedicated CPU & RAM"
                  value={form.short_description}
                  onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Service Access & Provisioning Settings */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-600" /> Post-Purchase Access & Provisioning Setup
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Cloud Access Portal URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://app.mysaas.com/login"
                      value={form.access_portal_url}
                      onChange={e => setForm(f => ({ ...f, access_portal_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Provisioning SLA / Lead Time
                    </label>
                    <select
                      value={form.provisioning_sla}
                      onChange={e => setForm(f => ({ ...f, provisioning_sla: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Instant Automated Provisioning">Instant Automated Provisioning</option>
                      <option value="Within 1-2 Hours">Within 1-2 Hours</option>
                      <option value="Within 24 Hours Manual Setup">Within 24 Hours Manual Setup</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Interactive Live Demo / Preview URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://demo.mysaas.com"
                      value={form.live_preview_url}
                      onChange={e => setForm(f => ({ ...f, live_preview_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Documentation / Setup Guide URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://docs.mysaas.com/quickstart"
                      value={form.setup_guide}
                      onChange={e => setForm(f => ({ ...f, setup_guide: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Provisioning Instructions / Note to Buyers
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Account credentials will be provisioned to your registered email upon order approval."
                    value={form.default_credentials}
                    onChange={e => setForm(f => ({ ...f, default_credentials: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Service Image / Icon Option */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" /> Service Image / Icon URL
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Displays on Marketplace & Portal</span>
                </label>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="https://example.com/service-banner.jpg"
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

                {/* Preset Badges */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or choose a preset visual:</div>
                  <div className="flex flex-wrap gap-2">
                    {presetIcons.map((preset) => (
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

              {/* Pricing Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-600" /> 3-Tier Multi-Role Pricing (₹ INR)
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
                    HQ Profit: <span className="font-bold">₹{(form.reseller_price - form.cost_price).toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-violet-100/50 rounded-lg text-violet-900 font-medium">
                    Reseller Margin: <span className="font-bold">₹{(form.customer_price - form.reseller_price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800">Feature this service in marketplace</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setEditingService(null);
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
                  {editingService ? 'Save Changes' : 'Publish Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
