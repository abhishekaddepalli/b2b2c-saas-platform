import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, ArrowUpRight, CheckCircle2, CreditCard, Globe, IndianRupee,
  Package, RefreshCw, Server, Shield, Tag, Users, Wallet,
  Zap, Sparkles, Star, ChevronDown, ChevronUp, Mail,
  Phone, MapPin, MessageSquare, TrendingUp, ShieldCheck, Check, Building2
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
  const { data: plansData, isLoading: loadingPlans } = useQuery({
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
  };

  const stats = cmsData?.stats || [
    { label: 'Active Reseller Stores', value: '10,000+', description: 'Across 40+ countries' },
    { label: 'Total Processed GMV', value: '₹50Cr+', description: 'Secured via Razorpay & Stripe' },
    { label: 'Infrastructure SLA', value: '99.99%', description: 'Multi-region failover' },
    { label: 'Reseller Margin Avg.', value: '24.5%', description: 'Direct automated payouts' },
  ];

  const legalPages = cmsData?.pages || {};

  const plans = Array.isArray(plansData) ? plansData : [];

  const faqs = [
    {
      q: 'How does the white-label reseller engine work?',
      a: 'Each reseller organization can configure their custom brand logo, primary colors, custom domain, and retail margin markups. When their customers order, the reseller wallet is atomically debited at cost price while retail profit is recorded instantly in real-time.'
    },
    {
      q: 'How are wallet balances and overdrafts managed?',
      a: 'Resellers top up prepaid funds via Razorpay, Stripe, PhonePe, or manual bank IMPS. Transactions are atomic and backed by an immutable ledger. Administrators can grant optional credit lines with strict limit enforcement.'
    },
    {
      q: 'Can I customize SaaS subscription plans in the Super Admin panel?',
      a: 'Yes! Using the Site CMS and SaaS Monetization module in the Super Admin panel (/admin/cms), you can create, modify, or delete subscription plans with custom quotas, trial durations, and pricing in ₹ INR.'
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
    <div className="overflow-x-hidden">
      {/* 1. HERO SECTION WITH REACT FLOW ANIMATION */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-28">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{hero.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                {hero.title.split('&')[0]} &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400">
                  {hero.title.split('&')[1] || 'Reseller Marketplace'}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {hero.subtitle}
              </p>

              {/* Call to Actions */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <a
                  href={hero.cta_primary_link || '#pricing'}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 hover:scale-[1.02]"
                >
                  <span>{hero.cta_primary_text || 'Explore Reseller Plans'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  to={hero.cta_secondary_link || '/marketplace'}
                  className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all flex items-center gap-2"
                >
                  <span>{hero.cta_secondary_text || 'Browse Marketplace'}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Razorpay & Stripe Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Atomic Ledger Wallets</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>14-Day Free Trial</span>
                </div>
              </div>
            </div>

            {/* Right Side: Interactive React Flow Ecosystem Animation */}
            <div className="lg:col-span-5 flex justify-center w-full overflow-hidden">
              <EcosystemFlowAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC LIVE STATS STRIP */}
      <section className="border-y border-slate-800/80 bg-slate-900/60 py-8">
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

      {/* 3. ARCHITECTURE & HOW IT WORKS (#ecosystem) */}
      <section id="ecosystem" className="py-20 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Commercial Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              How the Multi-Tenant Ecosystem Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A 4-step commercial pipeline connecting wholesale suppliers, branded reseller stores, and paying customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: '01',
                title: 'Catalog Onboarding',
                desc: 'Super Admin configures core SaaS software, cloud subscriptions, and digital services with base cost pricing in ₹ INR.',
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
                <div key={i} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3.5 relative group">
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

      {/* 4. FEATURES GRID (#features) */}
      <section id="features" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Everything Included
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Enterprise Features Built for Scale
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Not a demo — every single component is architected for production reliability, financial integrity, and auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* 5. LIVE INTERACTIVE PRICING SECTION (#pricing) */}
      <section id="pricing" className="py-20 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" /> Flexible SaaS Monetization
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Simple, Predictable Plans for Every Stage
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Scale your reseller distribution network with transparent monthly or annual pricing in ₹ INR. All plans include automated wallet management.
            </p>

            {/* Monthly / Yearly Billing Toggle */}
            <div className="pt-3 flex items-center justify-center gap-3">
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
          {plans.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800 p-8 max-w-md mx-auto space-y-3">
              <Tag className="w-10 h-10 text-indigo-400 mx-auto" />
              <h3 className="font-bold text-white text-base">Custom Tailored Plans</h3>
              <p className="text-xs text-slate-400">Contact our enterprise sales desk or configure your plans in SiteCMS.</p>
              <Link to="/register" className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
                Register for Free Trial
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan: any) => {
                const isPopular = plan.slug === 'business' || plan.slug === 'pro';
                const price = billingInterval === 'yearly' ? Math.round(plan.yearly_price / 12) : plan.monthly_price;
                const yearlyTotal = plan.yearly_price;
                const isUnlimitedCust = plan.customer_limit === -1 || plan.customer_limit >= 99999;
                const isUnlimitedProd = plan.products_limit === -1 || plan.products_limit >= 99999;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-6 sm:p-7 border relative flex flex-col justify-between transition-all duration-300 ${
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

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white">{plan.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{plan.short_description || 'Full platform capabilities with dedicated quotas.'}</p>
                      </div>

                      {/* Price Block */}
                      <div className="flex items-baseline gap-1.5 pt-1">
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
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Included Features:</span>
                        {(plan.features || ['Prepaid Wallet Engine', 'Role-Aware Pricing', 'SSL Support']).map((feat: string, fIdx: number) => (
                          <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-5">
                      <Link
                        to={`/register?plan=${plan.slug}&interval=${billingInterval}`}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
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
          )}
        </div>
      </section>

      {/* 6. ABOUT US / MISSION SECTION (#about) */}
      <section id="about" className="py-20 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" /> About The Platform
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {legalPages?.about?.title || 'Pioneering the Next-Generation SaaS Ecosystem'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {legalPages?.about?.subtitle || 'We build enterprise cloud distribution platforms empowering technology providers to scale through automated reseller channels.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-left">
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

      {/* 7. FAQ ACCORDION */}
      <section className="py-16 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
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

      {/* 8. CALL TO ACTION BANNER */}
      <section className="py-16 bg-gradient-to-b from-indigo-950/60 to-slate-950 border-t border-indigo-900/40 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Launch Your White-Label SaaS Reseller Hub Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Zero setup fees. Immediate access to the multi-gateway catalog, automated wallet engine, and customizable client portals.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-xs sm:text-sm px-7 py-3 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>Get Started Free (14-Day Trial)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
