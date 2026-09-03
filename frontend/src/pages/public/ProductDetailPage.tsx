import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package, ArrowLeft, CheckCircle2, ShieldCheck, Zap,
  Loader2, IndianRupee, ShoppingCart, Sparkles, Tag,
  Clock, Share2, HelpCircle
} from 'lucide-react';
import { marketplaceApi, ordersApi, resellerApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isReseller, isSuperAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['marketplace', 'product', slug],
    queryFn: () => marketplaceApi.product(slug!).then(r => r.data?.data ?? r.data),
    enabled: !!slug,
  });

  const product = productData;

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/products/${slug}`);
      return;
    }

    try {
      setOrdering(true);
      if (isReseller()) {
        await resellerApi.createOrder({
          items: [{ product_id: product.id, quantity: 1 }],
          payment_method: 'wallet',
        });
      } else {
        await ordersApi.create({
          items: [{ product_id: product.id, quantity: 1 }],
          payment_method: 'wallet',
        });
      }
      setOrderSuccess('Order placed successfully! Your digital license has been provisioned.');
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to place order. Please check wallet balance.');
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

  if (!product) {
    return (
      <div className="bg-slate-950 text-white p-12 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-12 border border-slate-800">
        <Package className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <p className="text-xs text-slate-400">The product you are looking for does not exist or has been discontinued.</p>
        <Link to="/marketplace" className="inline-block px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const retailPrice = Number(product.retail_price ?? product.price ?? 999);
  const wholesalePrice = Number(product.reseller_price ?? product.cost_price ?? retailPrice * 0.8);
  const profitMargin = Math.max(0, retailPrice - wholesalePrice);

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
        <span className="text-indigo-400 font-medium capitalize">{product.category || 'Digital Software'}</span>
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{orderSuccess}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Product Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {product.category || 'Software'}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Instant Digital Delivery
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {product.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description || 'Enterprise-grade digital license and cloud utility designed for high-availability production workloads.'}
            </p>
          </div>

          {/* Key Features */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Included Specifications & Benefits
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Verified License Authenticity</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Automated Key Delivery via Dashboard</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 24/7 SLA Backed Support</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Official Tax Invoice with GSTIN</li>
            </ul>
          </div>
        </div>

        {/* Right: Checkout Box */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Order Pricing</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ₹{retailPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 font-medium">all inclusive</span>
              </div>
            </div>

            {/* Reseller Profit Callout */}
            {(isReseller() || isSuperAdmin()) && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-1 text-xs">
                <div className="flex justify-between text-indigo-200">
                  <span>Wholesale Base Rate:</span>
                  <span className="font-bold text-white">₹{wholesalePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Reseller Margin:</span>
                  <span>+₹{profitMargin.toLocaleString('en-IN')} Profit</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={ordering}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {ordering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              <span>{isReseller() ? 'Place Reseller Order (Prepaid)' : 'Purchase & Provision License'}</span>
            </button>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Encrypted 256-bit automated license provisioning</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant dispatch to your client dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
