import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutTemplate, Save, CheckCircle, AlertCircle, Loader2,
  Sparkles, Globe, FileText, Plus, Trash2, Edit3, Eye,
  Shield, Layers, Star, TrendingUp, DollarSign, Phone,
  Mail, MapPin, ExternalLink, RefreshCw, X, MessageSquare
} from 'lucide-react';
import { adminApi } from '../../api';

export default function AdminCms() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'hero' | 'plans' | 'pages' | 'branding' | 'seo'>('hero');
  const [activeLegalPage, setActiveLegalPage] = useState<'about' | 'terms' | 'privacy' | 'refund' | 'contact'>('about');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Plan modal state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState<any>({
    name: '',
    slug: '',
    monthly_price: 999,
    yearly_price: 9990,
    reseller_limit: 10,
    customer_limit: 100,
    products_limit: 50,
    services_limit: 25,
    wallet_limit: 50000,
    trial_days: 14,
    storage_mb: 2048,
    api_rate_limit: 60,
    white_label_available: true,
  });

  // Fetch CMS Content
  const { data: cmsData, isLoading: loadingCms } = useQuery({
    queryKey: ['admin', 'cms'],
    queryFn: () => adminApi.cms().then(r => r.data?.data),
  });

  // Fetch SaaS Plans
  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['admin', 'saas-plans'],
    queryFn: () => adminApi.saasPlans().then(r => r.data),
  });

  const [form, setForm] = useState<any>({
    hero: {
      badge: '⚡ All-in-One B2B2C Cloud Infrastructure',
      title: 'Launch Your White-Label SaaS & Reseller Marketplace',
      subtitle: 'Empower resellers to distribute your cloud services, digital products, and subscriptions with real-time margins, automated wallets, and branded tenant portals.',
      cta_primary_text: 'Explore Reseller Plans',
      cta_primary_link: '/pricing',
      cta_secondary_text: 'Browse Marketplace',
      cta_secondary_link: '/marketplace',
      announcement_active: true,
      announcement_text: '🚀 Launch Offer: Zero setup fees on all annual reseller plans this month!',
      announcement_link: '/pricing',
    },
    stats: [
      { label: 'Active Reseller Stores', value: '10,000+', description: 'Across 40+ countries' },
      { label: 'Total Processed GMV', value: '₹50Cr+', description: 'Secured via Razorpay & Stripe' },
      { label: 'Infrastructure SLA', value: '99.99%', description: 'Multi-region failover' },
      { label: 'Reseller Margin Avg.', value: '24.5%', description: 'Direct automated payouts' },
    ],
    features: [
      {
        title: 'Turnkey White-Label Portals',
        description: 'Every reseller gets their own custom domain, custom logo, branding colors, and client dashboard.',
        badge: 'Custom Branding',
        icon: 'Palette',
      },
      {
        title: 'Automated Prepaid Wallets & Credit Lines',
        description: 'Zero financial risk with instant ledger settlements, automated debits on order fulfillment, and overdraft lines.',
        badge: 'Instant Ledger',
        icon: 'Wallet',
      },
      {
        title: 'Dynamic Tiered Margins & Catalog Rules',
        description: 'Assign custom markups, bundle subscriptions, and control product availability per reseller tier.',
        badge: 'Profit Engine',
        icon: 'TrendingUp',
      },
      {
        title: 'Multi-Gateway Razorpay & Stripe Integration',
        description: 'Support UPI, Netbanking, Cards, Wallets, and international payments with auto-reconciled webhooks.',
        badge: 'Payment Core',
        icon: 'CreditCard',
      },
    ],
    pages: {
      about: {
        title: 'About Our Platform',
        subtitle: 'Pioneering the Next-Generation Multi-Tenant B2B2C SaaS Ecosystem',
        content: 'We build state-of-the-art cloud distribution platforms that empower technology providers and agencies to scale seamlessly.',
        mission: 'To democratize software distribution by giving every agency and reseller enterprise-grade SaaS infrastructure.',
        vision: 'Connecting 1 million software creators with regional resellers globally.',
      },
      terms: {
        title: 'Terms of Service',
        last_updated: 'September 2026',
        content: 'Welcome to the B2B2C SaaS Platform. By using our services, you agree to comply with our commercial terms and acceptable use policies.',
      },
      privacy: {
        title: 'Privacy Policy',
        last_updated: 'September 2026',
        content: 'Your data privacy and tenant isolation are our utmost priorities. We strictly safeguard all client information.',
      },
      refund: {
        title: 'Refund & Cancellation Policy',
        last_updated: 'September 2026',
        content: 'Transparent, equitable commercial operations. SaaS plan subscriptions can be cancelled before the next renewal.',
      },
      contact: {
        title: 'Contact & Support Desk',
        email: 'support@infiniforge.cloud',
        phone: '+91 9876543210',
        whatsapp: '+91 9876543210',
        address: 'Infiniforge Cloud HQ, Level 7, Cyber Tower, Tech Hub, India',
        business_hours: 'Monday – Friday, 9:00 AM – 7:00 PM IST',
        support_url: 'https://resell.infiniforge.cloud/support',
      },
    },
    branding: {
      company_name: 'Infiniforge Cloud Solutions',
      brand_tagline: 'Enterprise B2B2C Reseller Engine',
      copyright_text: '© 2026 Infiniforge Cloud. All rights reserved.',
      social_links: {
        twitter: 'https://twitter.com/infiniforge',
        linkedin: 'https://linkedin.com/company/infiniforge',
        github: 'https://github.com/infiniforge',
        discord: 'https://discord.gg/infiniforge',
      },
    },
    seo: {
      meta_title: 'Resell Cloud — Enterprise B2B2C SaaS & Reseller Platform',
      meta_description: 'Launch your white-label SaaS marketplace. Distribute cloud software with automated reseller margins, prepaid wallets, and instant billing.',
      meta_keywords: 'B2B2C, SaaS, Reseller, Marketplace, White-label, Cloud Software, Razorpay Billing',
    },
  });

  useEffect(() => {
    if (cmsData) {
      setForm((prev: any) => ({ ...prev, ...cmsData }));
    }
  }, [cmsData]);

  // Update Mutation
  const updateCmsMutation = useMutation({
    mutationFn: (payload: any) => adminApi.updateCms(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'cms'] });
      setSuccessMsg('Site CMS content published live across all landing and public pages!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to update CMS content.');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });

  // Create / Update Plan Mutation
  const savePlanMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingPlan) {
        return adminApi.updateSaasPlan(editingPlan.id, payload);
      }
      return adminApi.createSaasPlan(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'saas-plans'] });
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      setSuccessMsg(editingPlan ? 'Plan updated successfully!' : 'New SaaS plan created successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to save SaaS plan.');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });

  // Delete Plan Mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSaasPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'saas-plans'] });
      setSuccessMsg('SaaS plan removed.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
  });

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateCmsMutation.mutate(form);
  };

  const updateNested = (section: string, field: string, val: any) => {
    setForm((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: val,
      },
    }));
  };

  const updatePageField = (pageKey: string, field: string, val: any) => {
    setForm((prev: any) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: {
          ...prev.pages[pageKey],
          [field]: val,
        },
      },
    }));
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      reseller_limit: plan.reseller_limit ?? 10,
      customer_limit: plan.customer_limit ?? 100,
      products_limit: plan.products_limit ?? 50,
      services_limit: plan.services_limit ?? 25,
      wallet_limit: plan.wallet_limit ?? 50000,
      trial_days: plan.trial_days ?? 14,
      storage_mb: plan.storage_mb ?? 2048,
      api_rate_limit: plan.api_rate_limit ?? 60,
      white_label_available: Boolean(plan.white_label_available),
    });
    setIsPlanModalOpen(true);
  };

  const openNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      slug: '',
      monthly_price: 999,
      yearly_price: 9990,
      reseller_limit: 10,
      customer_limit: 100,
      products_limit: 50,
      services_limit: 25,
      wallet_limit: 50000,
      trial_days: 14,
      storage_mb: 2048,
      api_rate_limit: 60,
      white_label_available: true,
    });
    setIsPlanModalOpen(true);
  };

  const plansList = plansData?.data ?? [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <LayoutTemplate className="w-7 h-7 text-indigo-600" />
            Site Content & CMS Management (siteCMS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time management for landing page copy, hero sections, pricing tiers, legal policies, and SEO metadata.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </a>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={updateCmsMutation.isPending}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {updateCmsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publish CMS Changes
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2 overflow-x-auto">
        {[
          { id: 'hero', label: 'Landing & Hero Copy', icon: Sparkles },
          { id: 'plans', label: 'SaaS Monetization Plans', icon: DollarSign },
          { id: 'pages', label: 'Legal & Company Pages', icon: FileText },
          { id: 'branding', label: 'Header & Footer Branding', icon: Globe },
          { id: 'seo', label: 'SEO & Meta Tags', icon: Shield },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loadingCms ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* TAB 1: LANDING & HERO CMS */}
          {activeTab === 'hero' && (
            <div className="space-y-5 text-xs">
              {/* Top Announcement Bar Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Top Site Announcement Ticker</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hero?.announcement_active}
                      onChange={e => updateNested('hero', 'announcement_active', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-700">Display Announcement</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Announcement Copy</label>
                    <input
                      type="text"
                      value={form.hero?.announcement_text}
                      onChange={e => updateNested('hero', 'announcement_text', e.target.value)}
                      placeholder="e.g. 🚀 Special Launch Offer: Zero setup fees..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Link URL</label>
                    <input
                      type="text"
                      value={form.hero?.announcement_link}
                      onChange={e => updateNested('hero', 'announcement_link', e.target.value)}
                      placeholder="/pricing"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Main Hero Copy Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                  Hero Headline & Call to Action (CTA)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Hero Pill Badge</label>
                    <input
                      type="text"
                      value={form.hero?.badge}
                      onChange={e => updateNested('hero', 'badge', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Main Headline H1</label>
                    <input
                      type="text"
                      value={form.hero?.title}
                      onChange={e => updateNested('hero', 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Subheadline / Pitch</label>
                    <textarea
                      rows={3}
                      value={form.hero?.subtitle}
                      onChange={e => updateNested('hero', 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary CTA Button Text</label>
                    <input
                      type="text"
                      value={form.hero?.cta_primary_text}
                      onChange={e => updateNested('hero', 'cta_primary_text', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary CTA Button Link</label>
                    <input
                      type="text"
                      value={form.hero?.cta_primary_link}
                      onChange={e => updateNested('hero', 'cta_primary_link', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Secondary CTA Button Text</label>
                    <input
                      type="text"
                      value={form.hero?.cta_secondary_text}
                      onChange={e => updateNested('hero', 'cta_secondary_text', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Secondary CTA Button Link</label>
                    <input
                      type="text"
                      value={form.hero?.cta_secondary_link}
                      onChange={e => updateNested('hero', 'cta_secondary_link', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Counters Grid */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                  Live Social Proof & Counter Metrics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(form.stats || []).map((st: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div>
                        <label className="block font-bold text-[11px] text-slate-500 mb-0.5">Stat #{idx + 1} Label</label>
                        <input
                          type="text"
                          value={st.label}
                          onChange={e => {
                            const updated = [...form.stats];
                            updated[idx].label = e.target.value;
                            setForm((prev: any) => ({ ...prev, stats: updated }));
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[11px] text-slate-500 mb-0.5">Highlighted Value</label>
                        <input
                          type="text"
                          value={st.value}
                          onChange={e => {
                            const updated = [...form.stats];
                            updated[idx].value = e.target.value;
                            setForm((prev: any) => ({ ...prev, stats: updated }));
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-black text-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[11px] text-slate-500 mb-0.5">Caption</label>
                        <input
                          type="text"
                          value={st.description}
                          onChange={e => {
                            const updated = [...form.stats];
                            updated[idx].description = e.target.value;
                            setForm((prev: any) => ({ ...prev, stats: updated }));
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAAS MONETIZATION PLANS CMS */}
          {activeTab === 'plans' && (
            <div className="space-y-5 text-xs">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Reseller SaaS Monetization Plans</h3>
                    <p className="text-slate-500 text-[11px]">Manage subscriber plans, pricing, margins, customer limits, and white-label permissions.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openNewPlan}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Plan
                  </button>
                </div>

                {loadingPlans ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : plansList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No SaaS plans configured yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plansList.map((plan: any) => (
                      <div
                        key={plan.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-xs relative flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 text-base">{plan.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {plan.slug}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">₹{Number(plan.monthly_price).toLocaleString('en-IN')}</span>
                            <span className="text-slate-400 text-[11px]">/month</span>
                            <span className="text-slate-400 text-[11px] ml-2">(₹{Number(plan.yearly_price).toLocaleString('en-IN')}/yr)</span>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Customer Limit:</span>
                              <span className="font-bold">{plan.customer_limit} customers</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Products Limit:</span>
                              <span className="font-bold">{plan.products_limit} products</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Services Limit:</span>
                              <span className="font-bold">{plan.services_limit} services</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">White-Label:</span>
                              <span className={`font-bold ${plan.white_label_available ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {plan.white_label_available ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Trial Period:</span>
                              <span className="font-bold">{plan.trial_days} Days</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                          <button
                            type="button"
                            onClick={() => openEditPlan(plan)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Edit Plan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete plan "${plan.name}"?`)) {
                                deletePlanMutation.mutate(plan.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LEGAL & COMPANY PAGES CMS */}
          {activeTab === 'pages' && (
            <div className="space-y-5 text-xs">
              <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                {[
                  { key: 'about', label: 'About Us' },
                  { key: 'terms', label: 'Terms of Service' },
                  { key: 'privacy', label: 'Privacy Policy' },
                  { key: 'refund', label: 'Refund & Cancellation' },
                  { key: 'contact', label: 'Contact & Helpdesk' },
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActiveLegalPage(p.key as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      activeLegalPage === p.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Legal Page Editor */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 capitalize">
                  Edit {activeLegalPage} Page Content
                </h3>

                {activeLegalPage === 'contact' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Corporate Support Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={form.pages?.contact?.email}
                          onChange={e => updatePageField('contact', 'email', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Support Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={form.pages?.contact?.phone}
                          onChange={e => updatePageField('contact', 'phone', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">WhatsApp Support</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input
                          type="text"
                          value={form.pages?.contact?.whatsapp}
                          onChange={e => updatePageField('contact', 'whatsapp', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Support Desk URL</label>
                      <div className="relative">
                        <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={form.pages?.contact?.support_url}
                          onChange={e => updatePageField('contact', 'support_url', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Registered Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <textarea
                          rows={2}
                          value={form.pages?.contact?.address}
                          onChange={e => updatePageField('contact', 'address', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Page Title</label>
                      <input
                        type="text"
                        value={form.pages?.[activeLegalPage]?.title}
                        onChange={e => updatePageField(activeLegalPage, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>

                    {form.pages?.[activeLegalPage]?.subtitle !== undefined && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Page Subtitle</label>
                        <input
                          type="text"
                          value={form.pages?.[activeLegalPage]?.subtitle}
                          onChange={e => updatePageField(activeLegalPage, 'subtitle', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Main Body Copy & Provisions</label>
                      <textarea
                        rows={10}
                        value={form.pages?.[activeLegalPage]?.content}
                        onChange={e => updatePageField(activeLegalPage, 'content', e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BRANDING, HEADER & FOOTER */}
          {activeTab === 'branding' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                Global Header, Footer & Social Branding
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Legal Entity Name</label>
                  <input
                    type="text"
                    value={form.branding?.company_name}
                    onChange={e => updateNested('branding', 'company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={form.branding?.brand_tagline}
                    onChange={e => updateNested('branding', 'brand_tagline', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Footer Copyright Notice</label>
                  <input
                    type="text"
                    value={form.branding?.copyright_text}
                    onChange={e => updateNested('branding', 'copyright_text', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Twitter / X URL</label>
                  <input
                    type="text"
                    value={form.branding?.social_links?.twitter}
                    onChange={e => {
                      const updated = { ...form.branding?.social_links, twitter: e.target.value };
                      updateNested('branding', 'social_links', updated);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={form.branding?.social_links?.linkedin}
                    onChange={e => {
                      const updated = { ...form.branding?.social_links, linkedin: e.target.value };
                      updateNested('branding', 'social_links', updated);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discord Community URL</label>
                  <input
                    type="text"
                    value={form.branding?.social_links?.discord}
                    onChange={e => {
                      const updated = { ...form.branding?.social_links, discord: e.target.value };
                      updateNested('branding', 'social_links', updated);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GitHub / Code Repository URL</label>
                  <input
                    type="text"
                    value={form.branding?.social_links?.github}
                    onChange={e => {
                      const updated = { ...form.branding?.social_links, github: e.target.value };
                      updateNested('branding', 'social_links', updated);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SEO & SEARCH METADATA */}
          {activeTab === 'seo' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                Search Engine Optimization & Social Sharing
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={form.seo?.meta_title}
                    onChange={e => updateNested('seo', 'meta_title', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Recommended length: 50–60 characters.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta Description</label>
                  <textarea
                    rows={3}
                    value={form.seo?.meta_description}
                    onChange={e => updateNested('seo', 'meta_description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Recommended length: 140–160 characters.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={form.seo?.meta_keywords}
                    onChange={e => updateNested('seo', 'meta_keywords', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                {/* Google SERP Preview Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Google Search Result Preview</span>
                  <div className="text-xs text-emerald-700 font-mono">https://resell.infiniforge.cloud</div>
                  <div className="text-sm font-bold text-blue-800 hover:underline cursor-pointer">{form.seo?.meta_title || 'Platform Title'}</div>
                  <div className="text-xs text-slate-600 line-clamp-2">{form.seo?.meta_description || 'Platform description...'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updateCmsMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {updateCmsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Publish All Site CMS Changes
            </button>
          </div>
        </form>
      )}

      {/* Plan Add / Edit Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPlan ? `Edit SaaS Plan: ${editingPlan.name}` : 'Create New SaaS Monetization Plan'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                savePlanMutation.mutate(planForm);
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. Business Pro"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Slug (Identifier)</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingPlan)}
                    value={planForm.slug}
                    onChange={e => setPlanForm({ ...planForm, slug: e.target.value.toLowerCase() })}
                    placeholder="e.g. business-pro"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.monthly_price}
                    onChange={e => setPlanForm({ ...planForm, monthly_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Yearly Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.yearly_price}
                    onChange={e => setPlanForm({ ...planForm, yearly_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Quota Limit</label>
                  <input
                    type="number"
                    required
                    value={planForm.customer_limit}
                    onChange={e => setPlanForm({ ...planForm, customer_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Products Quota Limit</label>
                  <input
                    type="number"
                    required
                    value={planForm.products_limit}
                    onChange={e => setPlanForm({ ...planForm, products_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Services Quota Limit</label>
                  <input
                    type="number"
                    required
                    value={planForm.services_limit}
                    onChange={e => setPlanForm({ ...planForm, services_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trial Period (Days)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.trial_days}
                    onChange={e => setPlanForm({ ...planForm, trial_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.white_label_available}
                      onChange={e => setPlanForm({ ...planForm, white_label_available: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800">Allow White-Label Reseller Portal & Custom Domains</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savePlanMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {savePlanMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingPlan ? 'Save Plan Updates' : 'Publish New Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
