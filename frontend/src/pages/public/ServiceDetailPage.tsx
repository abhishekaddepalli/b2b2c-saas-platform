import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Zap, ArrowLeft, CheckCircle2, ShieldCheck, Server,
  Loader2, IndianRupee, Sparkles, Clock, RefreshCw,
  Layers, ChevronRight, Check
} from 'lucide-react';
import { marketplaceApi, ordersApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isReseller, isSuperAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['marketplace', 'service', slug],
    queryFn: () => marketplaceApi.service(slug!).then(r => r.data?.data ?? r.data),
    enabled: !!slug,
  });

  const service = serviceData;

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/services/${slug}`);
      return;
    }
    try {
      setOrdering(true);
      await ordersApi.create({
        items: [{ service_id: service.id, interval: selectedInterval }],
        payment_method: 'wallet',
      });
      setOrderSuccess('Subscription activated successfully! Your managed service is live.');
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
        <Link to="/marketplace" className="inline-block px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const basePrice = Number(service.plans?.[0]?.price ?? service.price ?? 1999);
  const multiplier = selectedInterval === 'yearly' ? 10 : 1;
  const currentPrice = basePrice * multiplier;

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-800/80 shadow-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-xs">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-indigo-400 font-medium capitalize">Recurring Managed Services</span>
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{orderSuccess}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Service Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-400/30">
                Managed Cloud Service
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Auto-Renewable
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {service.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {service.description || 'High-performance managed cloud infrastructure with guaranteed 99.9% uptime, automated backups, and 24/7 technical monitoring.'}
            </p>
          </div>

          {/* Billing Cycle Selector */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Choose Billing Frequency
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedInterval('monthly')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedInterval === 'monthly'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Monthly Billing</div>
                <div className="text-lg font-black text-white mt-1">₹{basePrice.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/mo</span></div>
                <div className="text-[10px] text-slate-400 mt-1">Cancel anytime</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInterval('yearly')}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  selectedInterval === 'yearly'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  Save 17%
                </div>
                <div className="font-bold text-xs">Annual Billing</div>
                <div className="text-lg font-black text-white mt-1">₹{(basePrice * 10).toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/yr</span></div>
                <div className="text-[10px] text-emerald-400 mt-1">2 months free</div>
              </button>
            </div>
          </div>

          {/* SLA & Features */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Service Level Guarantee (SLA)
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 99.95% Network & Hardware Uptime</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Automated Daily Cloud Snapshots</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> DDoS Protection Included</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Dedicated IP Address Provisioning</li>
            </ul>
          </div>
        </div>

        {/* Right: Checkout Box */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Plan Summary</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 font-medium">/{selectedInterval}</span>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={ordering}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {ordering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isReseller() ? 'Provision Subscription (Prepaid)' : 'Subscribe & Launch Service'}</span>
            </button>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Enterprise Tier ISO-certified cloud infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated setup completed within 15 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
