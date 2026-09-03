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
    { text: 'Order #4921 fulfilled — ₹4,500 (Reseller Profit: ₹675)', badge: 'Instant Split' },
    { text: 'Razorpay Webhook: ₹15,000 wallet top-up verified', badge: 'Auto Reconciled' },
    { text: 'New Reseller Onboarded: Apex Digital (Domain Synced)', badge: 'White-Label' },
    { text: 'Subscription Auto-Renewed: 100% wallet debit execution', badge: 'Zero Overdraft' },
  ];

  useEffect(() => {
    const tInterval = setInterval(() => {
      setActiveTransaction(prev => (prev + 1) % transactions.length);
    }, 3800);

    const pInterval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % 4);
    }, 1400);

    return () => {
      clearInterval(tInterval);
      clearInterval(pInterval);
    };
  }, []);

  const nodes = [
    { id: 'resellers', label: 'Reseller Portals', sub: 'Custom Domains', icon: Building2, x: '24%', y: '18%', color: 'from-blue-500 to-indigo-600' },
    { id: 'customers', label: 'End Customers', sub: 'Instant Checkout', icon: Users, x: '76%', y: '18%', color: 'from-violet-500 to-purple-600' },
    { id: 'gateways', label: 'Razorpay & Stripe', sub: 'UPI & Cards', icon: CreditCard, x: '76%', y: '78%', color: 'from-emerald-500 to-teal-600' },
    { id: 'wallets', label: 'Prepaid Wallets', sub: 'Real-Time Ledger', icon: Wallet, x: '24%', y: '78%', color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="relative w-full max-w-[480px] h-[460px] rounded-3xl bg-slate-950/80 border border-indigo-500/25 shadow-2xl backdrop-blur-xl overflow-hidden flex items-center justify-center p-3 mx-auto">
      {/* Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b18_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b18_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute w-56 h-56 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none -top-6 -left-6" />
      <div className="absolute w-56 h-56 rounded-full bg-violet-600/15 blur-3xl pointer-events-none -bottom-6 -right-6" />

      {/* SVG Connecting Curves */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="curveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="curveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Lines connecting center (50%, 48%) to satellite nodes */}
        <path d="M 50% 48% Q 34% 30% 24% 20%" fill="none" stroke="url(#curveGrad1)" strokeWidth="2" strokeDasharray="5 5" className="opacity-40 animate-pulse" />
        <path d="M 50% 48% Q 66% 30% 76% 20%" fill="none" stroke="url(#curveGrad1)" strokeWidth="2" strokeDasharray="5 5" className="opacity-40 animate-pulse" />
        <path d="M 50% 48% Q 66% 66% 76% 76%" fill="none" stroke="url(#curveGrad2)" strokeWidth="2" strokeDasharray="5 5" className="opacity-40 animate-pulse" />
        <path d="M 50% 48% Q 34% 66% 24% 76%" fill="none" stroke="url(#curveGrad2)" strokeWidth="2" strokeDasharray="5 5" className="opacity-40 animate-pulse" />
      </svg>

      {/* Satellite Nodes */}
      {nodes.map((n, idx) => {
        const Icon = n.icon;
        const isPulsing = pulseIndex === idx;
        return (
          <div
            key={n.id}
            style={{ left: n.x, top: n.y, transform: 'translate(-50%, -50%)' }}
            className={`absolute z-10 flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl border transition-all duration-500 backdrop-blur-md max-w-[155px] ${
              isPulsing
                ? 'bg-slate-900/95 border-indigo-400 shadow-lg shadow-indigo-500/25 scale-105 ring-2 ring-indigo-500/20'
                : 'bg-slate-900/80 border-slate-800/80 shadow-md scale-100 hover:border-slate-700'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${n.color} flex items-center justify-center text-white shadow-xs shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-left overflow-hidden">
              <div className="font-bold text-[11px] text-white leading-tight truncate">{n.label}</div>
              <div className="text-[9px] text-slate-400 leading-tight truncate mt-0.5">{n.sub}</div>
            </div>
          </div>
        );
      })}

      {/* Central Core Engine Node */}
      <div className="relative z-20 flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-500/60 shadow-2xl shadow-indigo-600/30 text-center w-[180px]">
        {/* Outer Rotating Glow Ring */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-25 blur-xs animate-pulse" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md mb-2">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-extrabold text-emerald-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Engine
          </div>

          <h4 className="text-xs font-black text-white tracking-tight leading-snug">
            B2B2C SaaS Hub
          </h4>
          <p className="text-[9px] text-indigo-200/70 mt-0.5 font-medium">
            Multi-Tenant Orchestration
          </p>
        </div>
      </div>

      {/* Floating Dynamic Activity Pill at Bottom */}
      <div className="absolute bottom-2.5 left-3 right-3 z-30 flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700/90 shadow-xl backdrop-blur-md text-[10px] sm:text-xs">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-200 truncate max-w-[240px] sm:max-w-xs">
            {transactions[activeTransaction].text}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            {transactions[activeTransaction].badge}
          </span>
        </div>
      </div>

      {/* Live SLA & Latency Badge at Top Right */}
      <div className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>99.99% SLA • 14ms</span>
      </div>
    </div>
  );
}
