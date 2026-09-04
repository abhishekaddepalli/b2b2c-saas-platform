import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Zap, ArrowRight, Mail, Phone, MessageSquare, MapPin, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { adminApi } from '../../api';
import LiveChatWidget from '../chat/LiveChatWidget';

export default function PublicLayout() {
  const { isAuthenticated, isSuperAdmin, isReseller } = useAuth();
  const { openCart, itemCount } = useCart();
  const location = useLocation();

  // Fetch Public SiteCMS Data
  const { data: cmsData } = useQuery({
    queryKey: ['public', 'cms'],
    queryFn: () => adminApi.cms().then(r => r.data?.data),
    staleTime: 60000,
  });

  const dashboardPath = isSuperAdmin() ? '/admin' : isReseller() ? '/reseller' : '/app/dashboard';

  const hero = cmsData?.hero || {
    announcement_active: true,
    announcement_text: '🚀 Launch Offer: Zero setup fees on all annual reseller plans this month!',
    announcement_link: '/#pricing',
  };

  const branding = cmsData?.branding || {
    company_name: 'Infiniforge Cloud Solutions',
    brand_tagline: 'Enterprise B2B2C Reseller Engine',
    copyright_text: '© 2026 Infiniforge Cloud. All rights reserved.',
  };

  const contact = cmsData?.pages?.contact || {
    email: 'support@infiniforge.cloud',
    phone: '+91 9876543210',
    whatsapp: '+91 9876543210',
    address: 'Infiniforge Cloud HQ, Level 7, Cyber Tower, Tech Hub, India',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans flex flex-col">
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
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
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
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <a href="/#features" className="hover:text-white transition-colors">Features</a>
            <a href="/#ecosystem" className="hover:text-white transition-colors">Architecture</a>
            <Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <a href="/#pricing" className="hover:text-white transition-colors">Plans & Pricing</a>
            <a href="/#about" className="hover:text-white transition-colors">About</a>
            <a href="/#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 text-[10px] font-black text-white flex items-center justify-center shadow-md animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT (OUTLET) */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 4. WORLD-CLASS UNIFIED FOOTER */}
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
                <li><a href="/#features" className="hover:text-white transition-colors">Prepaid Wallet Engine</a></li>
                <li><a href="/#ecosystem" className="hover:text-white transition-colors">White-Label Portals</a></li>
                <li><a href="/#features" className="hover:text-white transition-colors">Multi-Gateway Core</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Operator Sign In</Link></li>
              </ul>
            </div>

            {/* Col 3: SaaS Monetization */}
            <div className="space-y-3">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">Plans & Pricing</span>
              <ul className="space-y-2">
                <li><a href="/#pricing" className="hover:text-white transition-colors">Starter Tier (₹999/mo)</a></li>
                <li><a href="/#pricing" className="hover:text-white transition-colors">Business Pro (₹2,999/mo)</a></li>
                <li><a href="/#pricing" className="hover:text-white transition-colors">Enterprise Suite (₹7,999/mo)</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">14-Day Free Trial</Link></li>
              </ul>
            </div>

            {/* Col 4: Corporate Contact Desk */}
            <div className="space-y-3">
              <span className="font-bold text-white text-xs uppercase tracking-wider block">Helpdesk & Contact</span>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{contact.email}</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{contact.phone}</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>WhatsApp: {contact.whatsapp}</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400 text-[11px] pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{contact.address}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              Protected by TLS 1.3 Bank-Grade Encryption & PCI-DSS Gateway Tokenization.
            </div>
            <div className="flex items-center gap-4">
              <a href="/#about" className="hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="/#about" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="/#about" className="hover:text-slate-300 transition-colors">Refund Policy</a>
              <a href="/#about" className="hover:text-slate-300 transition-colors">SLA Guarantees</a>
            </div>
          </div>
        </div>
      </footer>
      <LiveChatWidget />
    </div>
  );
}
