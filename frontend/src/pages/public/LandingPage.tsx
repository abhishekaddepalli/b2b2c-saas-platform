import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, ArrowUpRight, CheckCircle2, CreditCard, Globe, IndianRupee,
  Package, RefreshCw, Server, Shield, Tag, Users, Wallet,
  Zap, Sparkles, Star, ChevronDown, ChevronUp, Mail,
  Phone, MapPin, ExternalLink, MessageSquare, Terminal,
  TrendingUp, ShieldCheck, Check, Building2
} from 'lucide-react';
import { adminApi, saasPlansApi } from '../../api';
import EcosystemFlowAnimation from '../../components/landing/EcosystemFlowAnimation';

export default function LandingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Fetch Public CMS Content
  const { data: cmsData } = useQuery({
    queryKey: ['public', 'cms'],
    queryFn: () => adminApi.cms().then(r => r.data?.data),
    staleTime: 60000,
  });

  // Fetch SaaS Plans for Pricing Cards
  const { data: plansData } = useQuery({
    queryKey: ['public', 'saas-plans'],
    queryFn: () => saasPlansApi.list().then(r => r.data?.data),
    staleTime: 60000,
  });

  const hero = cmsData?.hero || {
    badge: '⚡ All-in-One B2B2C Cloud Infrastructure',
    title: 'Launch Your White-Label SaaS & Reseller Marketplace',
    subtitle: 'Empower resellers to distribute your cloud services, digital products, and subscriptions with real-time margins, automated wallets, and branded tenant portals.',
    cta_primary_text: 'Explore Reseller Plans',
    cta_primary_link: '#pricing',
    cta_secondary_text: 'Browse Marketplace',
    cta_secondary_link: '/marketplace',
    announcement_active: true,
    announcement_text: '🚀 Launch Offer: Zero setup fees on all annual reseller plans this month!',
    announcement_link: '#pricing',
  };

  const stats = cmsData?.stats || [
    { label: 'Active Reseller Stores', value: '10,000+', description: 'Across 40+ countries' },
    { label: 'Total Processed GMV', value: '₹50Cr+', description: 'Secured via Razorpay & Stripe' },
    { label: 'Infrastructure SLA', value: '99.99%', description: 'Multi-region failover' },
    { label: 'Reseller Margin Avg.', value: '24.5%', description: 'Direct automated payouts' },
  ];

  const legalPages = cmsData?.pages || {};
  const branding = cmsData?.branding || {
    company_name: 'Infiniforge Cloud Solutions',
    brand_tagline: 'Enterprise B2B2C Reseller Engine',
    copyright_text: '© 2026 Infiniforge Cloud. All rights reserved.',
  };

  const plans = Array.isArray(plansData) && plansData.length > 0 ? plansData : [
    {
      id: 'plan_starter',
      name: 'Starter Plan',
      slug: 'starter',
      monthly_price: 1999,
      yearly_price: 19990,
      customer_limit: 100,
      products_limit: 200,
      services_limit: 50,
      trial_days: 14,
      white_label_available: false,
      features: ['Up to 100 Customers', '200 Product Catalog Items', 'Automated Wallet Billing', 'Standard Support'],
    },
    {
      id: 'plan_business',
      name: 'Business Pro',
      slug: 'business',
      monthly_price: 4999,
      yearly_price: 49990,
      customer_limit: 1000,
      products_limit: 1000,
      services_limit: 200,
      trial_days: 14,
      white_label_available: true,
      features: ['Full White-Label Branding', '1,000 Customers', 'Custom Domain Support', 'Razorpay & Stripe Webhooks', 'Priority 24/7 Support'],
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise Suite',
      slug: 'enterprise',
      monthly_price: 14999,
      yearly_price: 149990,
      customer_limit: -1,
      products_limit: -1,
      services_limit: -1,
      trial_days: 30,
      white_label_available: true,
      features: ['Unlimited Customers & Quotas', 'Unlimited Catalog Items', 'Custom Domain SSL', 'Dedicated Account Manager', '99.99% SLA Guarantee'],
    },
  ];

  const faqs = [
    {
      q: 'How does the white-label reseller engine work?',
      a: 'Each reseller organization can configure their custom brand logo, primary colors, custom domain, and retail margin markups. When their customers order, the reseller wallet is atomically debited at cost price while retail profit is recorded instantly.'
    },
    {
      q: 'How are wallet balances and overdrafts managed?',
      a: 'Resellers top up prepaid funds via Razorpay, Stripe, PhonePe, or manual bank IMPS. Transactions are atomic and backed by an immutable ledger. Administrators can grant optional credit lines with strict limit enforcement.'
    },
    {
      q: 'Can I add custom SaaS subscription plans?',
      a: 'Yes! Using the Site CMS and SaaS Monetization module in the Super Admin panel, you can create, modify, or delete subscription plans with custom quotas, trial durations, and pricing.'
    },
    {
      q: 'What payment gateways are supported for customer checkout?',
      a: 'The platform natively integrates with Razorpay, Stripe, PhonePe, Cashfree, and Bank Transfer with automated webhook verification and instant subscription renewal processing.'
    },
    {
      q: 'Are catalog cost prices visible to resellers or customers?',
      a: 'Never. Our role-aware pricing architecture strictly conceals cost prices from end customers and resellers. Resellers only see their designated wholesale price and profit margins.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      {hero.announcement_active && (
        <div className="bg-gradient-to-r from-indigo-900 via-violet-900 to-indigo-950 border-b border-indigo-500/30 text-xs py-2 px-4 text-center font-medium">
          <span className="text-indigo-200">{hero.announcement_text}</span>{' '}
          {hero.announcement_link && (
            <a href={hero.announcement_link} className="text-white font-bold underline hover:text-indigo-200 ml-1.5 inline-flex items-center gap-1">
              <span>Claim Offer</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* 2. STICKY HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-white text-lg tracking-tight block leading-tight">
                {branding.company_name?.split(' ')[0] || 'Resell'} <span className="text-indigo-400">Cloud</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-none">B2B2C SaaS Engine</span>
            </div>
          </Link>

          {/* Navigation Menu Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ecosystem" className="hover:text-white transition-colors">Architecture</a>
            <Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <a href="#pricing" className="hover:text-white transition-colors">Plans & Pricing</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION WITH REACT FLOW ANIMATION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{hero.badge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                {hero.title.split('&')[0]} &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400">
                  {hero.title.split('&')[1] || 'Reseller Marketplace'}
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {hero.subtitle}
              </p>

              {/* Call to Actions */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <a
                  href={hero.cta_primary_link}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 hover:scale-[1.02]"
                >
                  <span>{hero.cta_primary_text}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  to={hero.cta_secondary_link}
                  className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2"
                >
                  <span>{hero.cta_secondary_text}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Razorpay & Stripe Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Atomic Ledger Wallets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>14-Day Full Free Trial</span>
                </div>
              </div>
            </div>

            {/* Right Side: Interactive React Flow Ecosystem Animation */}
            <div className="lg:col-span-5 flex justify-center">
              <EcosystemFlowAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC LIVE STATS STRIP */}
      <section className="border-y border-slate-800/80 bg-slate-900/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((st: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">
                  {st.value}
                </div>
                <div className="font-bold text-xs text-white">{st.label}</div>
                <div className="text-[11px] text-slate-400">{st.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ARCHITECTURE & HOW IT WORKS (#ecosystem) */}
      <section id="ecosystem" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Commercial Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              How the Multi-Tenant Ecosystem Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A 4-step commercial pipeline connecting wholesale suppliers, branded reseller stores, and paying customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Catalog Onboarding',
                desc: 'Super Admin configures core SaaS software, cloud subscriptions, and digital services with base cost pricing.',
                icon: Package,
                badge: 'Provider Side',
              },
              {
                step: '02',
                title: 'Reseller White-Labeling',
                desc: 'Resellers register, map their custom domain, set profit margins (e.g. 20%), and fund their prepaid wallet balance.',
                icon: Building2,
                badge: 'Tenant Setup',
              },
              {
                step: '03',
                title: 'Customer Checkout',
                desc: 'Clients place orders on the reseller portal via Razorpay, UPI, or cards with automatic subscription creation.',
                icon: Users,
                badge: 'Client Order',
              },
              {
                step: '04',
                title: 'Instant Settlement',
                desc: 'Prepaid wallet is debited at cost price, reseller profit is booked in real-time, and provisioning APIs fire instantly.',
                icon: Wallet,
                badge: 'Atomic Split',
              },
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-2xl text-slate-700 group-hover:text-indigo-400 transition-colors">{st.step}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{st.badge}</span>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">{st.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FEATURES GRID (#features) */}
      <section id="features" className="py-24 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Everything Included
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Enterprise Features Built for Massive Scale
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Not a demo — every single component is architected for production reliability, strict financial integrity, and auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Turnkey White-Label Portals', desc: 'Each reseller organization gets custom domain DNS mapping, custom logos, branded colors, and isolated customer records.', icon: Globe },
              { title: 'Atomic Prepaid Wallets', desc: 'Debits only execute if available funds or credit lines suffice. Every rupee is recorded in an immutable ledger with UUID idempotency.', icon: Wallet },
              { title: 'Dynamic Tiered Margins', desc: 'Assign custom markups per reseller tier (VIP, Standard, Enterprise). Cost prices remain 100% confidential.', icon: TrendingUp },
              { title: 'Razorpay & Stripe Integration', desc: 'Accept credit cards, UPI, netbanking, and recurring mandates with auto-reconciling idempotent webhooks.', icon: CreditCard },
              { title: 'Automated Dunning & Renewals', desc: 'Automated 7d, 3d, and 1d renewal reminders. Grace period state machine with automated service reactivation.', icon: RefreshCw },
              { title: 'Security & Audit Trail', desc: 'Granular RBAC, IP address and User-Agent capture, tamper-evident audit logs, and session management.', icon: ShieldCheck },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-3xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3 shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. LIVE INTERACTIVE PRICING SECTION (#pricing) */}
      <section id="pricing" className="py-24 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" /> Flexible SaaS Monetization
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Simple, Predictable Plans for Every Stage
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Scale your reseller distribution network with transparent monthly or annual pricing. All plans include automated wallet management.
            </p>

            {/* Monthly / Yearly Billing Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingInterval === 'monthly' ? 'text-white' : 'text-slate-500'}`}>
                Monthly Billing
              </span>
              <button
                type="button"
                onClick={() => setBillingInterval(i => (i === 'monthly' ? 'yearly' : 'monthly'))}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 focus:outline-none"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    billingInterval === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${billingInterval === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
                Yearly Billing <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-extrabold">Save 17%</span>
              </span>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan: any) => {
              const isPopular = plan.slug === 'business' || plan.slug === 'pro';
              const price = billingInterval === 'yearly' ? Math.round(plan.yearly_price / 12) : plan.monthly_price;
              const yearlyTotal = plan.yearly_price;
              const isUnlimitedCust = plan.customer_limit === -1 || plan.customer_limit >= 99999;
              const isUnlimitedProd = plan.products_limit === -1 || plan.products_limit >= 99999;

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-7 border relative flex flex-col justify-between transition-all duration-300 ${
                    isPopular
                      ? 'bg-gradient-to-b from-indigo-950/70 to-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-600/20 ring-4 ring-indigo-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Most Popular Tier
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{plan.short_description || 'Full platform capabilities with dedicated quotas.'}</p>
                    </div>

                    {/* Price Block */}
                    <div className="flex items-baseline gap-1.5 pt-2">
                      <span className="text-3xl sm:text-4xl font-black text-white">₹{Number(price).toLocaleString('en-IN')}</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    {billingInterval === 'yearly' && (
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        Billed annually at ₹{Number(yearlyTotal).toLocaleString('en-IN')} / year
                      </div>
                    )}

                    {/* Quota Highlights */}
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customers:</span>
                        <span className="font-bold text-white">{isUnlimitedCust ? '∞ Unlimited' : `${plan.customer_limit} customers`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Catalog Items:</span>
                        <span className="font-bold text-white">{isUnlimitedProd ? '∞ Unlimited' : `${plan.products_limit} items`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">White-Label Branding:</span>
                        <span className={`font-bold ${plan.white_label_available ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {plan.white_label_available ? 'Included' : 'Standard'}
                        </span>
                      </div>
                    </div>

                    {/* Features Checklist */}
                    <div className="space-y-2.5 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Included Features:</span>
                      {(plan.features || ['Prepaid Wallet Engine', 'Role-Aware Pricing', 'SSL Support']).map((feat: string, fIdx: number) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6">
                    <Link
                      to={`/register?plan=${plan.slug}&interval=${billingInterval}`}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                        isPopular
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          : 'bg-white hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. ABOUT US / MISSION SECTION (#about) */}
      <section id="about" className="py-24 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" /> About The Platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {legalPages?.about?.title || 'Pioneering the Next-Generation SaaS Ecosystem'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {legalPages?.about?.subtitle || 'We build enterprise cloud distribution platforms empowering technology providers to scale through automated reseller channels.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase">Our Core Mission</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {legalPages?.about?.mission || 'To democratize software distribution by giving every agency and reseller enterprise-grade SaaS infrastructure.'}
                </p>
              </div>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-violet-400 uppercase">Global Vision</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {legalPages?.about?.vision || 'Connecting 1 million software creators with regional resellers globally with zero financial friction.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION */}
      <section className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Everything you need to know about reseller margins, wallets, and white-labeling.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:bg-slate-900/80 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. CALL TO ACTION BANNER */}
      <section className="py-20 bg-gradient-to-b from-indigo-950/60 to-slate-950 border-t border-indigo-900/40 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Launch Your White-Label SaaS Reseller Hub Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Zero setup fees. Immediate access to the multi-gateway catalog, automated wallet engine, and customizable client portals.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>Get Started Free (14-Day Trial)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 11. WORLD-CLASS FOOTER (#contact) */}
      <footer id="contact" className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
            {/* Col 1: Platform Branding */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-md">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-black text-white text-base tracking-tight">
                  {branding.company_name || 'Resell Cloud'}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                {branding.brand_tagline || 'Enterprise multi-tenant B2B2C distribution infrastructure for software creators, digital service providers, and regional resellers.'}
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                {branding.copyright_text || '© 2026 Infiniforge Cloud. All rights reserved.'}
              </div>
            </div>

            {/* Col 2: Product & Platform */}
            <div className="space-y-3">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">Platform</span>
              <ul className="space-y-2">
                <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace Catalog</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Prepaid Wallet Engine</a></li>
                <li><a href="#ecosystem" className="hover:text-white transition-colors">White-Label Portals</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Multi-Gateway Core</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Operator Sign In</Link></li>
              </ul>
            </div>

            {/* Col 3: SaaS Monetization */}
            <div className="space-y-3">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">Plans & Pricing</span>
              <ul className="space-y-2">
                <li><a href="#pricing" className="hover:text-white transition-colors">Starter Tier (₹1,999/mo)</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Business Pro (₹4,999/mo)</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Enterprise Suite (₹14,999/mo)</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">14-Day Free Trial</Link></li>
              </ul>
            </div>

            {/* Col 4: Corporate Contact Desk */}
            <div className="space-y-3">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">Helpdesk & Contact</span>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{legalPages?.contact?.email || 'support@infiniforge.cloud'}</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{legalPages?.contact?.phone || '+91 9876543210'}</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>WhatsApp: {legalPages?.contact?.whatsapp || '+91 9876543210'}</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400 text-[11px] pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{legalPages?.contact?.address || 'Infiniforge Cloud HQ, Level 7, Cyber Tower, Tech Hub, India'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              Protected by TLS 1.3 Bank-Grade Encryption & PCI-DSS Gateway Tokenization.
            </div>
            <div className="flex items-center gap-4">
              <a href="#about" className="hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="#about" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#about" className="hover:text-slate-300 transition-colors">Refund Policy</a>
              <a href="#about" className="hover:text-slate-300 transition-colors">SLA Guarantees</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
