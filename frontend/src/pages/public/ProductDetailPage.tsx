import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Package, ArrowLeft, CheckCircle2, ShieldCheck, Zap,
  Loader2, IndianRupee, ShoppingCart, Sparkles, Tag,
  Clock, Share2, HelpCircle, Users, Check
} from 'lucide-react';
import { marketplaceApi, ordersApi, resellerApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isReseller, isSuperAdmin, isAuthenticated } = useAuth();

  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Determine back link based on current path
  const isResellerPath = location.pathname.startsWith('/reseller');
  const isCustomerPath = location.pathname.startsWith('/app');
  const backLink = isResellerPath ? '/reseller/marketplace' : isCustomerPath ? '/app/marketplace' : '/marketplace';

  const { data: productData, isLoading } = useQuery({
    queryKey: ['marketplace', 'product', slug],
    queryFn: () => marketplaceApi.product(slug!).then(r => r.data?.data ?? r.data),
    enabled: !!slug,
  });

  // Fetch reseller's customers if reseller
  const { data: customersData } = useQuery({
    queryKey: ['reseller', 'customers-dropdown'],
    queryFn: () => resellerApi.customers({ per_page: 50 }).then(r => r.data?.data ?? []),
    enabled: isReseller(),
  });

  const customers: any[] = customersData ?? [];
  const product = productData;

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${location.pathname}`);
      return;
    }

    try {
      setOrdering(true);
      if (isReseller()) {
        const payload: any = {
          items: [{ product_id: product.id, quantity }],
          payment_method: 'wallet',
        };
        if (selectedCustomerId) {
          payload.customer_id = selectedCustomerId;
        }
        await resellerApi.createOrder(payload);
        qc.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
        qc.invalidateQueries({ queryKey: ['reseller', 'orders'] });
      } else {
        await ordersApi.create({
          items: [{ product_id: product.id, quantity }],
          payment_method: 'wallet',
        });
        qc.invalidateQueries({ queryKey: ['customer', 'orders'] });
      }
      setOrderSuccess(`Order placed successfully! ${quantity} license key(s) provisioned.`);
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
        <Link to={backLink} className="inline-block px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // Safe category string resolution (never render raw objects)
  const categoryName = typeof product?.category === 'object'
    ? (product?.category?.name || 'Digital Software')
    : (product?.category || 'Digital Software');

  // Safe pricing resolution
  const pricing = product?.pricing as any;
  const retailPrice = Number(pricing?.customer_price ?? pricing?.price ?? product?.retail_price ?? product?.price ?? 999);
  const wholesalePrice = Number(pricing?.your_price ?? pricing?.wholesale_price ?? product?.reseller_price ?? product?.cost_price ?? Math.round(retailPrice * 0.8));
  const unitProfit = Number(pricing?.your_profit ?? Math.max(0, retailPrice - wholesalePrice));

  const totalWholesale = wholesalePrice * quantity;
  const totalRetail = retailPrice * quantity;
  const totalProfit = unitProfit * quantity;

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-800/80 shadow-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-xs">
        <Link
          to={backLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-indigo-400 font-medium capitalize">{categoryName}</span>
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{orderSuccess}</span>
          </div>
          {isReseller() && (
            <Link to="/reseller/orders" className="text-white underline font-bold hover:text-emerald-300">
              View in Orders →
            </Link>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Product Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {categoryName}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Instant Digital Delivery
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {product.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description || product.short_description || 'Enterprise-grade digital license and cloud utility designed for high-availability production workloads.'}
            </p>
          </div>

          {/* Key Specifications */}
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

        {/* Right: Checkout & Provisioning Box */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Order Pricing</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ₹{isReseller() ? totalWholesale.toLocaleString('en-IN') : totalRetail.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {isReseller() ? 'wholesale total' : 'retail total'}
                </span>
              </div>
            </div>

            {/* Reseller Wholesale Profit Callout */}
            {(isReseller() || isSuperAdmin()) && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-1.5 text-xs">
                <div className="flex justify-between text-indigo-200">
                  <span>Unit Wholesale Cost:</span>
                  <span className="font-bold text-white">₹{wholesalePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Customer Bill Price:</span>
                  <span className="font-semibold text-slate-200">₹{retailPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-indigo-900/60">
                  <span>Your Net Margin:</span>
                  <span>+₹{totalProfit.toLocaleString('en-IN')} Profit</span>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Quantity of Licenses</label>
              <div className="flex items-center gap-2">
                {[1, 2, 5, 10].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      quantity === q
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Reseller Customer Assignment Dropdown */}
            {isReseller() && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Assign License to Client:</span>
                  <Link to="/reseller/customers" className="text-[10px] text-indigo-400 hover:underline">
                    + New Client
                  </Link>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Self / Reseller Organization Inventory</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) {c.company ? `— ${c.company}` : ''}
                    </option>
                  ))}
                </select>
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
              <span>{isReseller() ? 'Confirm & Debit Wallet' : 'Purchase & Provision License'}</span>
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
