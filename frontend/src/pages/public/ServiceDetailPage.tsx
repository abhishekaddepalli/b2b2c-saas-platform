import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Server, ArrowLeft, CheckCircle2, ShieldCheck, Zap,
  Loader2, IndianRupee, ShoppingCart, Sparkles, Tag,
  Clock, Share2, HelpCircle, Users, Check, Star,
  Layers, RefreshCw, ExternalLink, ChevronRight, FileText,
  Calendar, Award, MessageSquare, Plus, Minus
} from 'lucide-react';
import { marketplaceApi, ordersApi, resellerApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isReseller, isSuperAdmin, isAuthenticated } = useAuth();
  const { addItem, openCart } = useCart();

  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'process' | 'reviews' | 'faq'>('overview');
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [clientBrief, setClientBrief] = useState('');

  const isResellerPath = location.pathname.startsWith('/reseller');
  const isCustomerPath = location.pathname.startsWith('/app');
  const backLink = isResellerPath ? '/reseller/marketplace' : isCustomerPath ? '/app/marketplace' : '/marketplace';

  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['marketplace', 'service', slug],
    queryFn: () => marketplaceApi.service(slug!).then(r => r.data?.data ?? r.data),
    enabled: !!slug,
  });

  const { data: relatedServicesData } = useQuery({
    queryKey: ['marketplace', 'services-related'],
    queryFn: () => marketplaceApi.services({ per_page: 4 }).then(r => r.data?.data ?? []),
  });

  const { data: customersData } = useQuery({
    queryKey: ['reseller', 'customers-dropdown'],
    queryFn: () => resellerApi.customers({ per_page: 50 }).then(r => r.data?.data ?? []),
    enabled: isReseller(),
  });

  const customers: any[] = customersData ?? [];
  const service = serviceData;
  const relatedServices = (relatedServicesData ?? []).filter((s: any) => s.slug !== slug).slice(0, 3);

  // Metadata resolution
  const metadata = useMemo(() => {
    if (!service?.metadata) return {};
    if (typeof service.metadata === 'string') {
      try { return JSON.parse(service.metadata); } catch { return {}; }
    }
    return service.metadata;
  }, [service?.metadata]);

  // Pricing calculations
  const plans: any[] = service?.plans ?? [];
  const activePlan = plans[selectedPlanIndex] || plans[0] || null;
  const activePricing = activePlan?.pricing || service?.pricing || null;

  const monthlyWholesale = Number(
    activePricing?.your_price ??
    activePricing?.reseller_price ??
    activePlan?.prices?.[0]?.reseller_price ??
    (activePricing?.customer_price ? activePricing.customer_price * 0.75 : null) ??
    (activePlan?.price ? activePlan.price * 0.75 : null) ??
    (service?.price ? service.price * 0.75 : 450)
  );

  const monthlyRetail = Number(
    activePricing?.customer_price ??
    activePricing?.price ??
    activePlan?.prices?.[0]?.customer_price ??
    activePlan?.price ??
    service?.price ??
    (monthlyWholesale > 0 ? Math.round(monthlyWholesale / 0.75) : 599)
  );

  const isYearly = selectedInterval === 'yearly';
  const wholesalePrice = isYearly ? Math.round(monthlyWholesale * 10) : Math.round(monthlyWholesale);
  const retailPrice = isYearly ? Math.round(monthlyRetail * 10) : Math.round(monthlyRetail);
  const originalPrice = Math.round(retailPrice * 1.3);
  const unitProfit = Math.max(0, retailPrice - wholesalePrice);

  const categoryName = typeof service?.category === 'object'
    ? (service?.category?.name || 'Managed Cloud Service')
    : (service?.category || 'Managed Cloud Service');

  const serviceImageUrl = service?.image_url || metadata?.image_url ||
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80';

  const handleAddToCart = () => {
    addItem({
      itemId: service.id,
      slug: service.slug,
      name: `${service.name}${activePlan ? ` (${activePlan.name})` : ''}`,
      type: 'service',
      price: isReseller() ? wholesalePrice : retailPrice,
      originalPrice,
      image: serviceImageUrl,
      quantity: 1,
      interval: selectedInterval,
      category: categoryName,
      resellerPrice: wholesalePrice,
      customerRetailPrice: retailPrice,
      clientNotes: clientBrief,
      servicePlanId: activePlan?.id,
    });
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 3000);
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${location.pathname}`);
      return;
    }
    try {
      setOrdering(true);
      const payload: any = {
        items: [{
          service_id: service.id,
          service_plan_id: activePlan?.id,
          interval: selectedInterval,
          quantity: 1,
          client_notes: clientBrief,
          customer_price: retailPrice,
          unit_price: isReseller() ? wholesalePrice : retailPrice,
        }],
        payment_method: 'wallet',
      };
      if (isReseller() && selectedCustomerId) {
        payload.customer_id = selectedCustomerId;
      }

      if (isReseller()) {
        await resellerApi.createOrder(payload);
        qc.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
        qc.invalidateQueries({ queryKey: ['reseller', 'subscriptions'] });
        qc.invalidateQueries({ queryKey: ['reseller', 'orders'] });
      } else {
        await ordersApi.create(payload);
        qc.invalidateQueries({ queryKey: ['customer', 'subscriptions'] });
        qc.invalidateQueries({ queryKey: ['customer', 'orders'] });
      }
      setOrderSuccess(`Subscription activated successfully for ${service.name}!`);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to activate service subscription.');
    } finally {
      setOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32 bg-slate-950 text-white min-h-[60vh] rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-slate-950 text-white p-12 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-12 border border-slate-800">
        <Server className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold">Service Not Found</h2>
        <p className="text-xs text-slate-400">The recurring cloud service does not exist or has been modified.</p>
        <Link to={backLink} className="inline-block px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl p-4 sm:p-8 lg:p-10 space-y-8 border border-slate-800/80 shadow-2xl">
      {/* Toast Alert */}
      {addedToCartToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>Service added to cart!</span>
          <button
            onClick={openCart}
            className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-black underline cursor-pointer"
          >
            View Cart →
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Link
            to={backLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-indigo-400 font-semibold capitalize">{categoryName}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 truncate max-w-[180px] sm:max-w-xs">{service.name}</span>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>SLA Turnaround: 48-72h</span>
        </span>
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{orderSuccess}</span>
          </div>
          {isReseller() && (
            <Link to="/reseller/subscriptions" className="text-white underline font-bold hover:text-emerald-300">
              View in Subscriptions →
            </Link>
          )}
        </div>
      )}

      {/* Main Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Showcase Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 aspect-16/10 flex items-center justify-center group shadow-xl">
            <img
              src={serviceImageUrl}
              alt={service.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/90 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                {categoryName}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Managed Cloud SLA
              </span>
            </div>
          </div>

          {/* Service Title and Overview */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>4.95 / 5.0</span>
                <span className="text-slate-500 font-normal">(92 verified enterprise clients)</span>
              </div>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">99.9% Guaranteed Uptime SLA</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {service.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {service.full_description || service.short_description || service.description || 'Enterprise managed service fully supported by certified cloud architects and continuous monitoring.'}
            </p>
          </div>

          {/* Service SLA & Assurance Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Turnaround SLA</span>
              <span className="font-bold text-white">48-72 Hours</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Revisions</span>
              <span className="font-bold text-emerald-400">3 Free Revisions</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Support Tier</span>
              <span className="font-bold text-indigo-400">24/7 Dedicated Desk</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">White-Label</span>
              <span className="font-bold text-white">100% Brandable</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Subscription Card (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl space-y-5 sticky top-24">
            {/* Plan Tier Selector */}
            {plans.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                    Plan Tier
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{plans.length} available</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plans.map((p: any, idx: number) => {
                    const isSelected = selectedPlanIndex === idx;
                    const pWholesale = Number(p.pricing?.your_price ?? p.pricing?.reseller_price ?? (p.price ? p.price * 0.75 : 450));
                    const pRetail = Number(p.pricing?.customer_price ?? p.pricing?.price ?? p.price ?? 599);
                    const displayAmt = isReseller() ? pWholesale : pRetail;
                    return (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={() => setSelectedPlanIndex(idx)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white truncate">{p.name}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>}
                        </div>
                        <div className="text-[11px] font-black text-indigo-300 mt-1">
                          ₹{(selectedInterval === 'yearly' ? displayAmt * 10 : displayAmt).toLocaleString('en-IN')}{selectedInterval === 'yearly' ? '/yr' : '/mo'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Billing Interval Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                  Billing Cycle
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Cancel Anytime
                </span>
              </div>

              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedInterval('monthly')}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    selectedInterval === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInterval('yearly')}
                  className={`py-2 rounded-xl transition-all relative cursor-pointer ${
                    selectedInterval === 'yearly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="ml-1 text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                    2 Mo Free
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="space-y-1 border-b border-slate-800/80 pb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ₹{isReseller() ? wholesalePrice.toLocaleString('en-IN') : retailPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-500 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  / {selectedInterval === 'yearly' ? 'year' : 'month'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isReseller() ? 'Wholesale rate debited to reseller wallet' : 'Inclusive of GST & all cloud infrastructure fees'}
              </p>
            </div>

            {/* Reseller Margin Breakdown */}
            {(isReseller() || isSuperAdmin()) && (
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between text-indigo-300 font-bold text-[11px]">
                  <span>Reseller Retainer Margin</span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                    +{Math.round((unitProfit / wholesalePrice) * 100)}% Margin
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Wholesale COGS:</span>
                  <span className="font-bold text-white">₹{wholesalePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Client Retail Price:</span>
                  <span className="font-semibold text-slate-200">₹{retailPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-extrabold pt-1.5 border-t border-indigo-900/80 text-xs">
                  <span>Recurring Profit / Term:</span>
                  <span>+₹{unitProfit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Client Briefing / Requirement Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Special Instructions / Domain / Scope:
              </label>
              <textarea
                rows={2}
                value={clientBrief}
                onChange={e => setClientBrief(e.target.value)}
                placeholder="e.g. Please deploy on client domain company.com, staging environment required"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Reseller Customer Assignment Dropdown */}
            {isReseller() && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Assign Service to Client:</span>
                  <Link to="/reseller/customers" className="text-[10px] text-indigo-400 hover:underline">
                    + New Client
                  </Link>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Reseller Organization Internal Operations</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) {c.company ? `— ${c.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DUAL ACTION BUTTONS */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
                <span>Add to Shopping Cart</span>
              </button>

              <button
                type="button"
                onClick={handleSubscribe}
                disabled={ordering}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-violet-600 hover:from-emerald-500 hover:via-indigo-500 hover:to-violet-500 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {ordering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-300" />
                )}
                <span>
                  {isReseller() ? 'Activate & Debit Wallet' : 'Subscribe & Provision Now'}
                </span>
              </button>
            </div>

            {/* Guarantee Note */}
            <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Satisfaction SLA with 3 Included Revisions</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Automatic kickoff within 2 hours of order</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-TAB SECTION */}
      <div className="pt-6 border-t border-slate-800/80 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Scope' },
            { id: 'deliverables', label: 'Included Deliverables' },
            { id: 'process', label: 'Step-by-Step Delivery Timeline' },
            { id: 'reviews', label: 'Client Feedback (4.95/5)' },
            { id: 'faq', label: 'Frequently Asked Questions' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 animate-in fade-in">
            <h3 className="text-base font-extrabold text-white">Full Service Architecture & Description</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {service.full_description || service.description || 'Engineered specifically for mission-critical operations, this service provides hands-off architecture management, proactive security auditing, automated backup replication, and zero-downtime scalability.'}
            </p>
          </div>
        )}

        {/* TAB 2: DELIVERABLES */}
        {activeTab === 'deliverables' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 animate-in fade-in">
            <h3 className="text-base font-extrabold text-white">Scope of Deliverables Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Turnkey deployment to your production environment</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SSL / TLS encryption and firewall hardening</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated daily offsite snapshot backups</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>3 Rounds of Post-Delivery Revisions & Tuning</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct Slack / Teams communication bridge</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>White-label handover reports with reseller branding</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROCESS */}
        {activeTab === 'process' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6 animate-in fade-in">
            <h3 className="text-base font-extrabold text-white">Execution Timeline & Delivery Milestones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black">1</div>
                <h4 className="font-bold text-white">Kickoff & Briefing</h4>
                <p className="text-[11px] text-slate-400">Our engineering lead contacts you within 2 hours to confirm requirements.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-black">2</div>
                <h4 className="font-bold text-white">Implementation</h4>
                <p className="text-[11px] text-slate-400">All configurations, provisioning, and API connectors are deployed in staging.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-black">3</div>
                <h4 className="font-bold text-white">QA & Review</h4>
                <p className="text-[11px] text-slate-400">You review the deliverable and request any revisions or adjustments.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black">4</div>
                <h4 className="font-bold text-white">Go-Live & Support</h4>
                <p className="text-[11px] text-slate-400">Final handover to your client with 24/7 SLA monitoring activated.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 animate-in fade-in">
            <h3 className="text-base font-extrabold text-white">Client Success Stories</h3>
            <div className="space-y-3">
              {[
                { name: 'Karthik Raman', role: 'CTO, OmniSaaS India', rating: 5, comment: 'Flawless execution. Saved our internal development team over 60 hours of server setup work.' },
                { name: 'Sneha Sengupta', role: 'Partner, CloudPulse Resellers', rating: 5, comment: 'We package this service with our marketing retainers. High profit margins and very reliable execution.' },
              ].map((rev, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rev.name} — <span className="text-slate-400 font-normal">{rev.role}</span></span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FAQ */}
        {activeTab === 'faq' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 animate-in fade-in">
            <h3 className="text-base font-extrabold text-white">Service FAQ</h3>
            {[
              { q: 'Can I cancel or pause my subscription?', a: 'Yes, subscriptions can be paused, upgraded, or cancelled anytime directly from your dashboard.' },
              { q: 'What happens if we need more revisions?', a: '3 comprehensive revisions are included free. Additional custom revisions can be requested at nominal per-hour rates.' },
              { q: 'Is there a money-back guarantee?', a: 'If we fail to deliver according to the agreed SLA, you receive a 100% full credit refund.' },
            ].map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs text-slate-300 pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <div className="pt-8 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              Complementary Cloud Services
            </h3>
            <Link to={backLink} className="text-xs text-indigo-400 hover:underline font-bold">
              Explore All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedServices.map((rel: any) => {
              const relPrice = Number(
                (isReseller() ? rel.pricing?.your_price : rel.pricing?.customer_price) ??
                rel.pricing?.price ??
                rel.plans?.[0]?.pricing?.customer_price ??
                rel.plans?.[0]?.price ??
                rel.price ??
                599
              );
              const relLink = isResellerPath ? `/reseller/services/${rel.slug}` : isCustomerPath ? `/app/services/${rel.slug}` : `/services/${rel.slug}`;
              return (
                <div
                  key={rel.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                      {typeof rel.category === 'object' ? rel.category?.name : rel.category || 'Service'}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {rel.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {rel.short_description || rel.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-sm font-black text-white">
                      ₹{relPrice.toLocaleString('en-IN')}/mo
                    </span>
                    <Link
                      to={relLink}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
