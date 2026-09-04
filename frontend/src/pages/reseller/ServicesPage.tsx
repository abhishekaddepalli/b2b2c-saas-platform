import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Loader2, Server, Search, ShoppingBag, TrendingUp,
  ShieldCheck, RefreshCw, UserPlus, Users, CheckCircle2,
  AlertCircle, X, Check, IndianRupee, Sparkles, ArrowRight
} from 'lucide-react';
import { resellerApi, marketplaceApi } from '../../api';
import type { Service } from '../../types';

export default function ResellerServices() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  // Active Assignment / Purchase Modal State
  const [activeService, setActiveService] = useState<any | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<'customer' | 'self'>('customer');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Categories Query
  const { data: categoriesResponse } = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: () => marketplaceApi.categories().then(r => r.data?.data ?? []),
  });
  const categories: any[] = categoriesResponse ?? [];

  // Queries
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['reseller', 'services', search, selectedCategory],
    queryFn: () => resellerApi.services({
      search,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      per_page: 50
    }).then(r => r.data),
  });

  const { data: walletData } = useQuery({
    queryKey: ['reseller', 'wallet'],
    queryFn: () => resellerApi.wallet().then(r => r.data?.data),
  });

  const { data: customersData } = useQuery({
    queryKey: ['reseller', 'customers-dropdown'],
    queryFn: () => resellerApi.customers({ per_page: 50 }).then(r => r.data?.data ?? []),
  });

  const services: any[] = servicesData?.data ?? [];
  const customers: any[] = customersData ?? [];
  const walletBalance = Number(walletData?.available_balance ?? 0);

  const openProvisionModal = (service: any, mode: 'customer' | 'self' = 'customer') => {
    setActiveService(service);
    setPurchaseMode(mode);
    setSelectedPlanId(service.plans?.[0]?.id || '');
    setSelectedCustomerId(customers[0]?.id || '');
    setBillingInterval('monthly');
    setModalMessage(null);
  };

  const handleConfirmAssignment = async () => {
    if (!activeService) return;
    setIsSubmitting(true);
    setModalMessage(null);

    try {
      const payload = {
        customer_id: purchaseMode === 'customer' ? selectedCustomerId : null,
        service_id: activeService.id,
        service_plan_id: selectedPlanId || activeService.plans?.[0]?.id,
        billing_interval: billingInterval,
      };

      const res = await resellerApi.assignService(payload);

      queryClient.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
      queryClient.invalidateQueries({ queryKey: ['reseller', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['reseller', 'services'] });

      setModalMessage({
        type: 'success',
        text: res.data?.message || 'Service successfully provisioned and assigned!',
      });
    } catch (err: any) {
      setModalMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to provision service. Please check wallet balance.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Wallet Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Server className="w-6 h-6 text-indigo-600" />
            Wholesale Recurring Services Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision recurring cloud services, assign subscriptions directly to client accounts, or procure wholesale for your organization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-2xl shadow-2xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
              ₹
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Wallet Balance</div>
              <div className="text-sm font-black text-slate-900 font-mono">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <Link
            to="/reseller/wallet"
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors"
          >
            + Top-up
          </Link>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search cloud services, compute, CRM, automation…"
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

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full sm:w-48 px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 cursor-pointer shrink-0"
            >
              <option value="all">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id || cat.slug} value={cat.slug || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700">{services.length} Services</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              <CheckCircle2 className="w-3.5 h-3.5" /> 25% Guaranteed Reseller Margin
            </span>
          </div>
        </div>

        {/* Quick Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Browse:</span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.slice(0, 8).map((cat: any) => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
            return (
              <button
                key={cat.id || cat.slug}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : (cat.slug || cat.id))}
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

          {(search || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 shrink-0 px-2 py-0.5"
            >
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-3">
            <Server className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No services found matching your search</p>
            <p className="text-xs text-slate-400">Services configured in Super Admin appear automatically here.</p>
          </div>
        ) : (
          services.map(s => {
            const pricing = s.pricing as any;
            const yourPrice = Number(pricing?.your_price ?? 999);
            const customerPrice = Number(pricing?.customer_price ?? 1499);
            const profit = Number(pricing?.your_profit ?? (customerPrice - yourPrice));
            const categoryName = typeof s.category === 'object' && s.category?.name
              ? s.category.name
              : (categories.find((c: any) => c.id === s.category_id || c.slug === s.category_id || c.slug === s.category)?.name || (typeof s.category === 'string' && s.category ? s.category : 'Cloud Service'));

            return (
              <div
                key={s.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                      {categoryName}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <RefreshCw className="w-3 h-3" /> Auto-Renewable
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {s.short_description || s.description || 'Enterprise managed cloud infrastructure with automated backups and 99.9% uptime SLA.'}
                  </p>

                  {/* Included Plans Chip if multiple */}
                  {s.plans && s.plans.length > 1 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold">Tiers:</span>
                      {s.plans.slice(0, 3).map((pl: any) => (
                        <span key={pl.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {pl.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-3 border-t border-slate-100">
                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Cost</div>
                      <div className="text-sm font-black text-indigo-700 font-mono mt-0.5">₹{yourPrice.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">MSRP Bill</div>
                      <div className="text-sm font-black text-slate-800 font-mono mt-0.5">₹{customerPrice.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Margin</div>
                      <div className="text-sm font-black text-emerald-600 font-mono mt-0.5">+₹{profit.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openProvisionModal(s, 'customer')}
                      className="py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign Client</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openProvisionModal(s, 'self')}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Order (Self)</span>
                    </button>
                  </div>

                  <div className="text-center">
                    <Link
                      to={`/reseller/services/${s.slug}`}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      View Specifications & Plans →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PROVISION & ASSIGN MODAL */}
      {activeService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 text-xs max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Provision Recurring Service</h3>
                  <p className="text-[11px] text-slate-400">Atomic wallet debit & automated subscription scheduling</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveService(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Alert */}
            {modalMessage && (
              <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2.5 ${
                modalMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {modalMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
                  <span>{modalMessage.text}</span>
                </div>
                {modalMessage.type === 'success' && (
                  <Link to="/reseller/subscriptions" className="text-emerald-700 underline font-bold shrink-0">
                    View Subscriptions →
                  </Link>
                )}
              </div>
            )}

            {/* Service Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-600 uppercase font-bold">
                  {typeof activeService.category === 'object' ? activeService.category?.name : (activeService.category || 'Cloud')}
                </span>
                <div className="font-bold text-slate-900 text-sm">{activeService.name}</div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>

            {/* Purchase Mode Toggle */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Select Beneficiary</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseMode('customer')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center gap-2 ${
                    purchaseMode === 'customer'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="text-xs">Client Account</div>
                    <div className="text-[10px] text-slate-400 font-normal">Assign & bill customer</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPurchaseMode('self')}
                  className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center gap-2 ${
                    purchaseMode === 'self'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="text-xs">Self (Reseller)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Internal org usage</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Customer Dropdown if customer mode */}
            {purchaseMode === 'customer' && (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 flex items-center justify-between">
                  <span>Target Customer Account:</span>
                  <Link to="/reseller/customers" className="text-[10px] text-indigo-600 hover:underline">
                    + Add New Customer
                  </Link>
                </label>
                {customers.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-center justify-between">
                    <span>No registered customers found.</span>
                    <Link to="/reseller/customers" className="underline font-bold">Create Customer →</Link>
                  </div>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email}) {c.company ? `— ${c.company}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Plan Tier Selector if multiple plans */}
            {activeService.plans && activeService.plans.length > 1 && (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Choose Plan Tier</label>
                <div className="grid grid-cols-1 gap-2">
                  {activeService.plans.map((plan: any) => (
                    <label
                      key={plan.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedPlanId === plan.id
                          ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="service_plan"
                          value={plan.id}
                          checked={selectedPlanId === plan.id}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{plan.name}</div>
                          <div className="text-[10px] text-slate-500">{plan.description || 'Full feature access'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-indigo-700">₹{Number(plan.pricing?.your_price ?? plan.price * 0.75).toLocaleString('en-IN')}</div>
                        <div className="text-[9px] text-slate-400">wholesale/mo</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Billing Frequency Selector */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Billing Cycle Term</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'monthly', label: 'Monthly', factor: 1 },
                  { key: 'quarterly', label: 'Quarterly (3m)', factor: 3 },
                  { key: 'yearly', label: 'Annual (12m)', factor: 12 },
                ].map(freq => (
                  <button
                    key={freq.key}
                    type="button"
                    onClick={() => setBillingInterval(freq.key as any)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      billingInterval === freq.key
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Calculations Calculation */}
            {(() => {
              const pricing = activeService.pricing as any;
              const months = billingInterval === 'yearly' ? 12 : billingInterval === 'quarterly' ? 3 : 1;
              const unitWholesale = Number(pricing?.your_price ?? 999);
              const unitRetail = Number(pricing?.customer_price ?? 1499);
              const totalWholesale = unitWholesale * months;
              const totalRetail = unitRetail * months;
              const totalProfit = (unitRetail - unitWholesale) * months;
              const remainingWallet = walletBalance - totalWholesale;

              return (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Wholesale Cost ({months} month{months > 1 ? 's' : ''}):</span>
                      <span className="font-mono font-black text-indigo-900 text-sm">₹{totalWholesale.toLocaleString('en-IN')}</span>
                    </div>
                    {purchaseMode === 'customer' && (
                      <>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Customer Invoice Total:</span>
                          <span className="font-mono text-slate-800">₹{totalRetail.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-indigo-100">
                          <span>Your Net Margin:</span>
                          <span className="font-mono text-sm">+₹{totalProfit.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Wallet Check */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-slate-500">Available Wallet: </span>
                      <strong className="text-slate-900 font-mono">₹{walletBalance.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Remaining Balance: </span>
                      <strong className={`font-mono ${remainingWallet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{remainingWallet.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {remainingWallet < 0 && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
                      <span>Insufficient wallet balance.</span>
                      <Link to="/reseller/wallet" className="underline font-bold text-red-900">
                        Top-up ₹{Math.abs(remainingWallet).toLocaleString('en-IN')} →
                      </Link>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveService(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || remainingWallet < 0}
                      onClick={handleConfirmAssignment}
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Confirm & Debit ₹{totalWholesale.toLocaleString('en-IN')}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
