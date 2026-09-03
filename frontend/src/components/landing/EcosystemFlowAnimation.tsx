import React, { useState, useEffect } from 'react';
import {
  Server, Users, Wallet, CreditCard, ShieldCheck,
  Package, Zap, CheckCircle2, ArrowRight, ArrowUpRight,
  TrendingUp, Globe, Sparkles, Building2
} from 'lucide-react';

export default function EcosystemFlowAnimation() {
  const [pulseIndex, setPulseIndex] = useState(0);
  const [activeTransaction, setActiveTransaction] = useState(0);

  const transactions = [
    { text: 'Order #4921 fulfilled — ₹4,500 (Reseller Profit: ₹675)', badge: 'Instant Settlement', color: 'emerald' },
    { text: 'Razorpay Webhook verified: ₹15,000 wallet recharge', badge: 'Auto Reconciled', color: 'indigo' },
    { text: 'New Reseller Onboarded: CloudPeak Labs (Custom Domain Synced)', badge: 'White-Label', color: 'violet' },
    { text: 'Subscription Auto-Renewed: 100% wallet debit execution', badge: 'Zero Overdraft', color: 'amber' },
  ];

  useEffect(() => {
    const tInterval = setInterval(() => {
      setActiveTransaction(prev => (prev + 1) % transactions.length);
    }, 3800);

    const pInterval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % 6);
    }, 1200);

    return () => {
      clearInterval(tInterval);
      clearInterval(pInterval);
    };
  }, []);

  const nodes = [
    { id: 'resellers', label: 'Reseller Portals', sub: 'Custom Domains & Branding', icon: Building2, x: '18%', y: '20%', color: 'from-blue-500 to-indigo-600' },
    { id: 'customers', label: 'End Customers', sub: 'Instant Checkout & Invoices', icon: Users, x: '82%', y: '20%', color: 'from-violet-500 to-purple-600' },
    { id: 'gateways', label: 'Razorpay & Stripe', sub: 'UPI, Cards & Webhooks', icon: CreditCard, x: '88%', y: '68%', color: 'from-emerald-500 to-teal-600' },
    { id: 'wallets', label: 'Prepaid Wallets', sub: 'Real-Time Ledger & Margin', icon: Wallet, x: '14%', y: '70%', color: 'from-amber-500 to-orange-600' },
    { id: 'catalog', label: 'Service & Product Catalog', sub: 'Fixed & % Tiered Pricing', icon: Package, x: '50%', y: '90%', color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="relative w-full h-[520px] rounded-3xl bg-slate-950/70 border border-indigo-500/20 shadow-2xl backdrop-blur-xl overflow-hidden flex items-center justify-center p-4">
      {/* Background Decorative Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b18_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b18_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-72 h-72 rounded-full bg-violet-600/15 blur-3xl pointer-events-none -bottom-10 -right-10" />

      {/* SVG Connecting Curves & Flow Particles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="curveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="curveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Lines connecting center (50%, 48%) to satellite nodes */}
        {/* Node 1: Resellers */}
        <path d="M 50% 48% Q 30% 32% 18% 22%" fill="none" stroke="url(#curveGrad1)" strokeWidth="2" strokeDasharray="6 6" className="opacity-40 animate-pulse" />
        {/* Node 2: Customers */}
        <path d="M 50% 48% Q 70% 32% 82% 22%" fill="none" stroke="url(#curveGrad1)" strokeWidth="2" strokeDasharray="6 6" className="opacity-40 animate-pulse" />
        {/* Node 3: Gateways */}
        <path d="M 50% 48% Q 72% 62% 88% 68%" fill="none" stroke="url(#curveGrad2)" strokeWidth="2" strokeDasharray="6 6" className="opacity-40 animate-pulse" />
        {/* Node 4: Wallets */}
        <path d="M 50% 48% Q 28% 62% 14% 70%" fill="none" stroke="url(#curveGrad2)" strokeWidth="2" strokeDasharray="6 6" className="opacity-40 animate-pulse" />
        {/* Node 5: Catalog */}
        <path d="M 50% 48% Q 50% 70% 50% 90%" fill="none" stroke="url(#curveGrad1)" strokeWidth="2" strokeDasharray="6 6" className="opacity-40 animate-pulse" />
      </svg>

      {/* Satellite Nodes */}
      {nodes.map((n, idx) => {
        const Icon = n.icon;
        const isPulsing = pulseIndex === idx;
        return (
          <div
            key={n.id}
            style={{ left: n.x, top: n.y, transform: 'translate(-50%, -50%)' }}
            className={`absolute z-10 flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all duration-500 backdrop-blur-md ${
              isPulsing
                ? 'bg-slate-900/95 border-indigo-400 shadow-lg shadow-indigo-500/20 scale-105'
                : 'bg-slate-900/80 border-slate-800/80 shadow-md scale-100 hover:border-slate-700'
            }`}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${n.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="hidden sm:block text-left pr-1">
              <div className="font-bold text-xs text-white leading-tight">{n.label}</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{n.sub}</div>
            </div>
          </div>
        );
      })}

      {/* Central Core Engine Node */}
      <div className="relative z-20 flex flex-col items-center justify-center p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-indigo-900/90 via-slate-900 to-slate-950 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-600/30 text-center max-w-[210px]">
        {/* Outer Rotating Glow Ring */}
        <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-sm animate-pulse" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg mb-2.5">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Engine
          </div>

          <h4 className="text-xs sm:text-sm font-black text-white tracking-tight leading-snug">
            B2B2C Core SaaS Hub
          </h4>
          <p className="text-[10px] text-indigo-200/70 mt-1 font-medium">
            Multi-Tenant Orchestration
          </p>
        </div>
      </div>

      {/* Floating Dynamic Activity Pill at Bottom */}
      <div className="absolute bottom-3 left-4 right-4 z-30 flex justify-center">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 text-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-200 truncate max-w-[280px] sm:max-w-md">
            {transactions[activeTransaction].text}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            {transactions[activeTransaction].badge}
          </span>
        </div>
      </div>

      {/* Live SLA & Latency Badge at Top Right */}
      <div className="absolute top-3 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>SLA: 99.99% • 14ms API</span>
      </div>
    </div>
  );
}
