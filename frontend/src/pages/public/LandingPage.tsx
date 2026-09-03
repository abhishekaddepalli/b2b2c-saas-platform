import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Globe,
  IndianRupee,
  Package,
  RefreshCw,
  Server,
  Shield,
  Tag,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

const features = [
  { icon: Package, title: 'Product Marketplace', desc: 'Sell physical, digital, and licensed products with role-aware pricing.' },
  { icon: Server, title: 'Service Management', desc: 'Recurring services with automatic billing, renewals, and grace periods.' },
  { icon: Users, title: 'Reseller Network', desc: 'Onboard resellers who earn margin while you control cost pricing.' },
  { icon: Wallet, title: 'Wallet Engine', desc: 'Atomic wallet transactions with full ledger history and idempotency.' },
  { icon: IndianRupee, title: 'Profit Tracking', desc: 'Platform and reseller profit recorded on every transaction, never estimated.' },
  { icon: RefreshCw, title: 'Auto Renewals', desc: 'Subscription lifecycle with retry logic, grace periods, and suspension.' },
  { icon: Tag, title: 'Offers & Coupons', desc: 'Percentage, fixed, Buy-X-Get-Y, and campaign discounts per audience.' },
  { icon: Globe, title: 'White Label', desc: 'Each reseller gets their own brand, colors, domain, and invoice logo.' },
  { icon: BarChart3, title: 'Real-time Reports', desc: 'Revenue, profit, subscription growth, and wallet activity dashboards.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'RBAC, tenant isolation, audit logs, and idempotent payment webhooks.' },
  { icon: CreditCard, title: 'Multi-gateway Payments', desc: 'Razorpay, PhonePe, Cashfree, Stripe — switch or combine anytime.' },
  { icon: Zap, title: 'Blazing Fast API', desc: 'Laravel 12 + Redis + queue workers. Scales to thousands of customers.' },
];

const pricingTiers = [
  { name: 'Starter', price: '₹2,999', per: '/mo', features: ['Up to 5 resellers', '500 customers', 'Wallet engine', 'Basic reports', 'Email support'] },
  { name: 'Growth', price: '₹7,999', per: '/mo', highlight: true, features: ['Unlimited resellers', '10,000 customers', 'All payment gateways', 'Advanced analytics', 'White label', 'Priority support'] },
  { name: 'Enterprise', price: 'Custom', per: '', features: ['Unlimited everything', 'Custom domain per reseller', 'SLA guarantee', 'Dedicated account manager', 'Custom integrations'] },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Zap className="w-3 h-3" />
              Multi-tenant B2B2C SaaS Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              One Marketplace.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Every Service.
              </span>{' '}
              Every Customer.
            </h1>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl leading-relaxed">
              Manage products, services, resellers, customers, subscriptions, wallets, billing
              and profits from one powerful platform — with role-aware pricing baked in.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                Start Selling
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/marketplace"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl transition-colors border border-white/10"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="bg-slate-900 text-slate-400 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap gap-8 justify-center text-sm font-medium">
          {['Role-aware pricing', 'Atomic wallets', 'Idempotent webhooks', 'Tenant isolation', 'Auto renewals'].map(s => (
            <span key={s} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything built in</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              A complete commercial SaaS — not a demo. Every feature is production-ready with financial integrity guarantees.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 border border-slate-100 rounded-2xl hover:border-indigo-100 hover:shadow-md transition-all group">
                <div className="w-9 h-9 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center mb-3 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How pricing works */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Role-aware pricing, zero leaks</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              The same product shows a different price to each role. Cost price is never exposed to resellers or customers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { role: 'Admin', color: 'from-slate-700 to-slate-900', badge: 'bg-slate-600', fields: ['Cost price: ₹100', 'Reseller price: ₹150', 'Customer price: ₹199', 'Platform margin: ₹50', 'Reseller margin: ₹49'] },
              { role: 'Reseller', color: 'from-violet-600 to-indigo-700', badge: 'bg-violet-500', fields: ['Your price: ₹150', 'Customer price: ₹199', 'Your profit: ₹49'] },
              { role: 'Customer', color: 'from-indigo-600 to-blue-700', badge: 'bg-indigo-500', fields: ['Price: ₹199'] },
            ].map(({ role, color, badge, fields }) => (
              <div key={role} className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white`}>
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${badge} mb-4`}>{role}</span>
                <div className="space-y-2">
                  {fields.map(f => (
                    <div key={f} className="text-sm text-white/90 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white/60 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple pricing</h2>
            <p className="text-lg text-slate-500">Start free, scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map(({ name, price, per, highlight, features: fs }) => (
              <div
                key={name}
                className={`rounded-2xl p-7 border ${highlight ? 'border-indigo-500 bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'border-slate-200 bg-white'}`}
              >
                <div className={`text-sm font-semibold mb-2 ${highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{name}</div>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-bold ${highlight ? 'text-white' : 'text-slate-900'}`}>{price}</span>
                  <span className={`text-sm pb-1 ${highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{per}</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {fs.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${highlight ? 'text-indigo-200' : 'text-emerald-500'}`} />
                      <span className={highlight ? 'text-indigo-100' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to launch your marketplace?</h2>
          <p className="text-indigo-100 text-lg mb-8">
            Join hundreds of resellers already using SaaS Platform to grow their business.
          </p>
          <Link
            to="/register"
            className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold px-8 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2 shadow-lg"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
