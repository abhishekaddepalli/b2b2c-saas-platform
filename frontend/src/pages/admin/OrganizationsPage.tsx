import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, Search, CheckCircle, ShieldAlert,
  Loader2, DollarSign, Layers,
  Wallet, Sparkles, X, ChevronRight,
  TrendingUp, Users, ArrowUpRight
} from 'lucide-react';
import { adminApi } from '../../api';
import type { Organization } from '../../types';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

const tierColors: Record<string, string> = {
  standard: 'bg-slate-100 text-slate-700',
  vip: 'bg-violet-100 text-violet-700 font-semibold',
  enterprise: 'bg-amber-100 text-amber-800 font-bold',
  custom: 'bg-indigo-100 text-indigo-700',
};

export default function AdminOrganizations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals & Drawers state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'margin' | 'plan' | 'services' | 'wallet' | 'details'>('margin');

  // Form states for Create Modal
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    type: 'reseller' as 'reseller' | 'platform',
    pricing_tier: 'standard',
    margin_percentage: 15,
    saas_plan: 'pro',
    credit_limit: 0,
    initial_wallet_balance: 0,
    owner_name: '',
    owner_email: '',
    owner_password: '',
    brand_name: '',
  });

  // Edit / Drawer states
  const [editMargin, setEditMargin] = useState<number>(15);
  const [editPricingTier, setEditPricingTier] = useState<string>('standard');
  const [editCreditLimit, setEditCreditLimit] = useState<number>(0);
  const [editPlan, setEditPlan] = useState<string>('pro');
  const [assignedServices, setAssignedServices] = useState<string[]>([]);
  const [walletAdjustment, setWalletAdjustment] = useState<number>(0);
  const [walletNote, setWalletNote] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Fetch Organizations
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['admin', 'organizations', search, statusFilter, typeFilter],
    queryFn: () => adminApi.organizations({ search, status: statusFilter, type: typeFilter, per_page: 50 }).then(r => r.data),
  });

  // Fetch Services & Plans for Assignment
  const { data: servicesData } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => adminApi.services().then(r => r.data),
    staleTime: 60000,
  });

  const { data: plansData } = useQuery({
    queryKey: ['admin', 'saas-plans'],
    queryFn: () => adminApi.saasPlans().then(r => r.data),
    staleTime: 60000,
  });

  const orgs: Organization[] = orgsData?.data ?? [];
  const allServices: any[] = servicesData?.data ?? [];
  const availablePlans: any[] = plansData?.data ?? [
    { slug: 'starter', name: 'Starter Tier' },
    { slug: 'pro', name: 'Professional Tier' },
    { slug: 'enterprise', name: 'Enterprise Master' },
  ];

  // Stats calculation
  const totalOrgs = orgs.length;
  const activeResellers = orgs.filter(o => o.type === 'reseller' && o.status === 'active').length;
  const totalWalletBalances = orgs.reduce((acc, o) => acc + Number(o.wallet?.available_balance || o.wallet?.balance || 0), 0);
  const pendingApprovals = orgs.filter(o => o.status === 'pending').length;

  // Open Drawer and populate state
  const openManageDrawer = (org: Organization, tab: 'margin' | 'plan' | 'services' | 'wallet' | 'details' = 'margin') => {
    setSelectedOrg(org);
    setActiveTab(tab);
    setEditMargin(org.metadata?.margin_percentage ?? 15);
    setEditPricingTier(org.pricing_tier ?? 'standard');
    setEditCreditLimit(org.credit_limit ?? 0);
    setEditPlan(org.metadata?.saas_plan ?? 'pro');
    setAssignedServices(org.metadata?.assigned_services ?? []);
    setEditStatus(org.status);
    setWalletAdjustment(0);
    setWalletNote('');
    setActionSuccess('');
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createOrganization(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        slug: '',
        type: 'reseller',
        pricing_tier: 'standard',
        margin_percentage: 15,
        saas_plan: 'pro',
        credit_limit: 0,
        initial_wallet_balance: 0,
        owner_name: '',
        owner_email: '',
        owner_password: '',
        brand_name: '',
      });
    },
  });

  // Adjust Margin Mutation
  const adjustMarginMutation = useMutation({
    mutationFn: (payload: { id: string; margin_percentage: number; pricing_tier: string; credit_limit: number }) =>
      adminApi.updateOrganization(payload.id, {
        margin_percentage: payload.margin_percentage,
        pricing_tier: payload.pricing_tier,
        credit_limit: payload.credit_limit,
      }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      setSelectedOrg(res.data?.data);
      setActionSuccess('Reseller margin & pricing tier saved successfully!');
    },
  });

  // Change Plan Mutation
  const changePlanMutation = useMutation({
    mutationFn: (payload: { id: string; saas_plan: string }) =>
      adminApi.assignOrgPlan(payload.id, { saas_plan: payload.saas_plan }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      setSelectedOrg(res.data?.data);
      setActionSuccess('SaaS subscription plan updated successfully!');
    },
  });

  // Assign Services Mutation
  const assignServicesMutation = useMutation({
    mutationFn: (payload: { id: string; assigned_services: string[] }) =>
      adminApi.assignOrgServices(payload.id, { assigned_services: payload.assigned_services }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      setSelectedOrg(res.data?.data);
      setActionSuccess('Assigned services and products saved!');
    },
  });

  // Wallet Adjustment Mutation
  const walletMutation = useMutation({
    mutationFn: (payload: { id: string; wallet_adjustment: number; note?: string }) =>
      adminApi.updateOrganization(payload.id, {
        wallet_adjustment: payload.wallet_adjustment,
        wallet_note: payload.note,
      }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      setSelectedOrg(res.data?.data);
      setWalletAdjustment(0);
      setActionSuccess('Wallet balance updated successfully!');
    },
  });

  // Status Change
  const handleStatusChange = async (id: string, newStatus: string) => {
    await adminApi.updateOrgStatus(id, newStatus);
    qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Organizations & Reseller Tenants
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete master control: create resellers, adjust margins, allocate SaaS plans, and assign services.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Reseller Organization
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Organizations</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalOrgs}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Resellers</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{activeResellers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Wallet Capital</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{totalWalletBalances.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Pending Approvals</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{pendingApprovals}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, slug, brand, or email…"
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
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Types</option>
          <option value="reseller">Reseller Only</option>
          <option value="platform">Platform Master</option>
        </select>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading reseller organizations...</span>
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Building2 className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No organizations found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Create your first reseller tenant to get started with margins and service allocation.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Reseller Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Organization / Reseller</th>
                  <th className="px-4 py-3.5">Commercials</th>
                  <th className="px-4 py-3.5">SaaS Plan</th>
                  <th className="px-4 py-3.5">Wallet Balance</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orgs.map(org => {
                  const marginPct = org.metadata?.margin_percentage ?? 15;
                  const saasPlan = org.metadata?.saas_plan ?? 'pro';
                  const walletBal = Number(org.wallet?.balance ?? 0);

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{org.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              /{org.slug} • <span className="capitalize">{org.type}</span>
                            </div>
                            {org.users && org.users.length > 0 && (
                              <div className="text-[11px] text-indigo-600 flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3" /> {org.users[0].email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${tierColors[org.pricing_tier || 'standard']}`}>
                            {org.pricing_tier || 'standard'}
                          </span>
                          <div className="text-xs font-semibold text-emerald-700">
                            +{marginPct}% Margin
                          </div>
                          {org.credit_limit ? (
                            <div className="text-[10px] text-slate-400">
                              Credit: ₹{Number(org.credit_limit).toLocaleString('en-IN')}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-[11px] border border-indigo-100">
                          <Layers className="w-3 h-3" />
                          <span className="capitalize font-bold">{saasPlan}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">
                          ₹{walletBal.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {org.wallet_enabled ? 'Wallet Active' : 'Wallet Disabled'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[org.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {org.status === 'active' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <ShieldAlert className="w-3 h-3 text-amber-500" />}
                          <span className="capitalize">{org.status}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openManageDrawer(org, 'margin')}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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

      {/* CREATE RESELLER ORGANIZATION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create Reseller Organization</h2>
                  <p className="text-xs text-slate-500">Provision a new white-label tenant with margin & SaaS plan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(createForm);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reseller Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Cloud Solutions"
                    value={createForm.name}
                    onChange={e => {
                      const name = e.target.value;
                      setCreateForm(f => ({
                        ...f,
                        name,
                        slug: f.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unique Slug / Domain Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. apex-cloud"
                    value={createForm.slug}
                    onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Owner Info */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" /> Reseller Admin Login Account
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Admin Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="reseller@apexcloud.com"
                      value={createForm.owner_email}
                      onChange={e => setCreateForm(f => ({ ...f, owner_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Initial Password</label>
                    <input
                      type="text"
                      placeholder="Default: Reseller@1234"
                      value={createForm.owner_password}
                      onChange={e => setCreateForm(f => ({ ...f, owner_password: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Commercials & Margins */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reseller Margin Markup %</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={createForm.margin_percentage}
                      onChange={e => setCreateForm(f => ({ ...f, margin_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8 font-bold text-emerald-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pricing Tier</label>
                  <select
                    value={createForm.pricing_tier}
                    onChange={e => setCreateForm(f => ({ ...f, pricing_tier: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="vip">VIP Tier</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SaaS Plan</label>
                  <select
                    value={createForm.saas_plan}
                    onChange={e => setCreateForm(f => ({ ...f, saas_plan: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                  >
                    <option value="starter">Starter Plan</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise Plan</option>
                  </select>
                </div>
              </div>

              {/* Initial Capital */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.credit_limit}
                    onChange={e => setCreateForm(f => ({ ...f, credit_limit: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Wallet Balance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.initial_wallet_balance}
                    onChange={e => setCreateForm(f => ({ ...f, initial_wallet_balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Create Reseller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE RESELLER FULL DRAWER / MODAL */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {selectedOrg.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">{selectedOrg.name}</h2>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[selectedOrg.status]}`}>
                      {selectedOrg.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Slug: /{selectedOrg.slug} • Type: {selectedOrg.type}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrg(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Banner */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {actionSuccess}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-100 text-xs font-semibold gap-1">
              {[
                { id: 'margin', label: 'Margin & Pricing', icon: DollarSign },
                { id: 'plan', label: 'SaaS Plan', icon: Layers },
                { id: 'services', label: 'Assigned Services', icon: ArrowUpRight },
                { id: 'wallet', label: 'Wallet Capital', icon: Wallet },
                { id: 'details', label: 'Governance', icon: ShieldAlert },
              ].map(t => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(t.id as any);
                      setActionSuccess('');
                    }}
                    className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: MARGIN & PRICING */}
            {activeTab === 'margin' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500">
                  Configure default profit margin markups and credit facilities applied to this reseller tenant.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="font-bold text-slate-800">Reseller Markup Margin Percentage</label>
                      <span className="text-base font-black text-indigo-600">{editMargin}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editMargin}
                      onChange={e => setEditMargin(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Reseller will purchase products at wholesale cost and receive a {editMargin}% profit margin markup.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200/60">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pricing Tier</label>
                      <select
                        value={editPricingTier}
                        onChange={e => setEditPricingTier(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="standard">Standard Tier (Default)</option>
                        <option value="vip">VIP Tier (Discounted Cost)</option>
                        <option value="enterprise">Enterprise Tier (Wholesale Lowest)</option>
                        <option value="custom">Custom Contract</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Overdraft / Credit Limit (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editCreditLimit}
                        onChange={e => setEditCreditLimit(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={adjustMarginMutation.isPending}
                  onClick={() =>
                    adjustMarginMutation.mutate({
                      id: selectedOrg.id,
                      margin_percentage: editMargin,
                      pricing_tier: editPricingTier,
                      credit_limit: editCreditLimit,
                    })
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {adjustMarginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Margin & Pricing Settings
                </button>
              </div>
            )}

            {/* TAB 2: SAAS PLAN ALLOCATION */}
            {activeTab === 'plan' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500">
                  Select and upgrade the SaaS platform subscription plan allocated to this tenant.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {availablePlans.map((plan: any) => {
                    const isSelected = editPlan === plan.slug;
                    return (
                      <div
                        key={plan.slug}
                        onClick={() => setEditPlan(plan.slug)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm capitalize text-slate-900">{plan.name || plan.slug}</span>
                          {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          Tier: <span className="font-mono font-bold uppercase">{plan.slug}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={changePlanMutation.isPending}
                  onClick={() =>
                    changePlanMutation.mutate({
                      id: selectedOrg.id,
                      saas_plan: editPlan,
                    })
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {changePlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Assign Selected SaaS Plan
                </button>
              </div>
            )}

            {/* TAB 3: ASSIGNED SERVICES & PRODUCTS */}
            {activeTab === 'services' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500">
                    Control which services & products this reseller is permitted to sell in their catalog.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignedServices(allServices.map(s => s.id))}
                      className="text-[11px] text-indigo-600 font-bold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAssignedServices([])}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 p-2 space-y-1">
                  {allServices.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      No platform services currently published in catalog.
                    </div>
                  ) : (
                    allServices.map((service: any) => {
                      const isAssigned = assignedServices.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={e => {
                                if (e.target.checked) {
                                  setAssignedServices([...assignedServices, service.id]);
                                } else {
                                  setAssignedServices(assignedServices.filter(id => id !== service.id));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{service.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">/{service.slug}</div>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {service.billing_type || 'Catalog Item'}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  disabled={assignServicesMutation.isPending}
                  onClick={() =>
                    assignServicesMutation.mutate({
                      id: selectedOrg.id,
                      assigned_services: assignedServices,
                    })
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {assignServicesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Assigned Catalog Items
                </button>
              </div>
            )}

            {/* TAB 4: WALLET BALANCE CONTROL */}
            {activeTab === 'wallet' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 text-xs font-medium">Current Reseller Wallet Balance</div>
                    <div className="text-2xl font-black mt-0.5">
                      ₹{Number(selectedOrg.wallet?.balance ?? 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <Wallet className="w-8 h-8 text-indigo-400 opacity-75" />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <label className="block font-bold text-slate-800">
                    Direct Balance Adjustment (+ Credit / - Debit)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. +5000 or -1500"
                      value={walletAdjustment || ''}
                      onChange={e => setWalletAdjustment(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Reason / Reference Note (optional)"
                    value={walletNote}
                    onChange={e => setWalletNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Entering a positive number credits the reseller wallet. Negative number deducts funds immediately.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={walletAdjustment === 0 || walletMutation.isPending}
                  onClick={() =>
                    walletMutation.mutate({
                      id: selectedOrg.id,
                      wallet_adjustment: walletAdjustment,
                      note: walletNote,
                    })
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {walletMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Apply Balance Adjustment
                </button>
              </div>
            )}

            {/* TAB 5: GOVERNANCE & DETAILS */}
            {activeTab === 'details' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Tenant Operational Status</div>
                      <div className="text-[11px] text-slate-500">Enable or suspend reseller portal operations</div>
                    </div>
                    <div className="flex gap-2">
                      {selectedOrg.status !== 'active' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await handleStatusChange(selectedOrg.id, 'active');
                            setSelectedOrg({ ...selectedOrg, status: 'active' });
                            setActionSuccess('Tenant approved and activated!');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Activate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            await handleStatusChange(selectedOrg.id, 'suspended');
                            setSelectedOrg({ ...selectedOrg, status: 'suspended' });
                            setActionSuccess('Tenant suspended.');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 text-center py-2 text-[11px]">
                  Created at {new Date(selectedOrg.created_at || Date.now()).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
