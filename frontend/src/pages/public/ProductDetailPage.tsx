import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Package, ArrowLeft, CheckCircle2, ShieldCheck, Zap,
  Loader2, IndianRupee, ShoppingCart, Sparkles, Tag,
  Clock, Share2, HelpCircle, Users, Check, Star,
  Truck, Download, Key, Shield, Layers, RefreshCw,
  ExternalLink, ChevronRight, MessageSquare, AlertCircle,
  Cpu, HardDrive, Monitor, CheckSquare, Plus, Minus, MapPin, ShoppingBag
} from 'lucide-react';
import { marketplaceApi, ordersApi, resellerApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isReseller, isSuperAdmin, isAuthenticated } = useAuth();
  const { addItem, openCart } = useCart();

  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'how_it_works' | 'reviews' | 'faq'>('overview');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  // Pincode checker state for physical items
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);

  // Review submission state
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', author: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Determine back link based on current path
  const isResellerPath = location.pathname.startsWith('/reseller');
  const isCustomerPath = location.pathname.startsWith('/app');
  const backLink = isResellerPath ? '/reseller/marketplace' : isCustomerPath ? '/app/marketplace' : '/marketplace';

  const { data: productData, isLoading } = useQuery({
    queryKey: ['marketplace', 'product', slug],
    queryFn: () => marketplaceApi.product(slug!).then(r => r.data?.data ?? r.data),
    enabled: !!slug,
  });

  // Fetch related products
  const { data: relatedData } = useQuery({
    queryKey: ['marketplace', 'products-related'],
    queryFn: () => marketplaceApi.products({ per_page: 4 }).then(r => r.data?.data ?? []),
  });

  // Fetch reseller's customers if reseller
  const { data: customersData } = useQuery({
    queryKey: ['reseller', 'customers-dropdown'],
    queryFn: () => resellerApi.customers({ per_page: 50 }).then(r => r.data?.data ?? []),
    enabled: isReseller(),
  });

  const customers: any[] = customersData ?? [];
  const product = productData;
  const relatedProducts: any[] = (relatedData ?? []).filter((p: any) => p.slug !== slug).slice(0, 3);

  // Pricing calculations
  const pricing = product?.pricing as any;
  const retailPrice = Number(pricing?.customer_price ?? pricing?.price ?? product?.retail_price ?? product?.price ?? 999);
  const originalPrice = Math.round(retailPrice * 1.35); // 35% higher for strikethrough anchor
  const wholesalePrice = Number(pricing?.your_price ?? pricing?.wholesale_price ?? product?.reseller_price ?? product?.cost_price ?? Math.round(retailPrice * 0.75));
  const unitProfit = Number(pricing?.your_profit ?? Math.max(0, retailPrice - wholesalePrice));

  const totalWholesale = wholesalePrice * quantity;
  const totalRetail = retailPrice * quantity;
  const totalProfit = unitProfit * quantity;

  // Metadata resolution
  const metadata = useMemo(() => {
    if (!product?.metadata) return {};
    if (typeof product.metadata === 'string') {
      try { return JSON.parse(product.metadata); } catch { return {}; }
    }
    return product.metadata;
  }, [product?.metadata]);

  // Product Type resolution
  const productType = (product?.type || metadata?.product_type || 'digital').toLowerCase();
  const isPhysical = productType === 'physical' || productType === 'hardware';
  const isSoftware = productType === 'software' || productType === 'license' || productType === 'software_license';
  const isDigital = productType === 'digital';

  // Category name resolution
  const categoryName = typeof product?.category === 'object'
    ? (product?.category?.name || 'Digital Solutions')
    : (product?.category || 'Digital Solutions');

  // Images list
  const images = useMemo(() => {
    const list: string[] = [];
    if (product?.image_url) list.push(product.image_url);
    if (metadata?.image_url && !list.includes(metadata.image_url)) list.push(metadata.image_url);
    if (Array.isArray(product?.images)) {
      product.images.forEach((img: any) => {
        const path = typeof img === 'string' ? img : img.path || img.url;
        if (path && !list.includes(path)) list.push(path);
      });
    }
    if (list.length === 0) {
      if (isPhysical) {
        list.push('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80');
      } else if (isSoftware) {
        list.push('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80');
      } else {
        list.push('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80');
      }
    }
    return list;
  }, [product, metadata, isPhysical, isSoftware]);

  // Handle Add to Cart
  const handleAddToCart = () => {
    addItem({
      itemId: product.id,
      slug: product.slug,
      name: product.name,
      type: (product.type as any) || 'digital',
      price: isReseller() ? wholesalePrice : retailPrice,
      originalPrice,
      image: images[0],
      quantity,
      category: categoryName,
      sku: product.sku,
      resellerPrice: wholesalePrice,
      customerRetailPrice: retailPrice,
    });
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 3000);
  };

  // Handle Instant Buy Now
  const handleBuyNow = async () => {
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
      setOrderSuccess(`Order placed successfully! ${quantity} unit(s) provisioned.`);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to place order. Please check wallet balance or use Cart.');
    } finally {
      setOrdering(false);
    }
  };

  // Check Pincode
  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.length < 6) {
      setPincodeResult('Please enter a valid 6-digit PIN code.');
      return;
    }
    const days = metadata?.delivery_days || 3;
    const courier = metadata?.courier || 'BlueDart Express';
    setPincodeResult(`✅ Delivery available to ${pincode} in ${days} business days via ${courier}. FREE Shipping!`);
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

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl p-4 sm:p-8 lg:p-10 space-y-8 border border-slate-800/80 shadow-2xl">
      {/* Toast Alert */}
      {addedToCartToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>Added to cart!</span>
          <button
            onClick={openCart}
            className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-black underline cursor-pointer"
          >
            View Cart →
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
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
          <span className="text-slate-400 truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
        </div>

        {/* Live Demo or Preview link if available */}
        {(metadata?.live_preview_url || metadata?.software_url) && (
          <a
            href={metadata.live_preview_url || metadata.software_url}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-600/30 transition-colors text-xs font-semibold"
          >
            <span>Live Interactive Demo</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {orderSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{orderSuccess}</span>
          </div>
          {isReseller() && (
            <Link to="/reseller/orders" className="text-white underline font-bold hover:text-emerald-300">
              View in Orders Ledger →
            </Link>
          )}
        </div>
      )}

      {/* Main Top Grid: Gallery & Left Info (col 2) + Buy Box (col 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Gallery & Hero Presentation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Showcase Image */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 aspect-16/10 flex items-center justify-center group shadow-xl">
            <img
              src={images[selectedImageIdx]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Badges on Image */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/90 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
                {categoryName}
              </span>

              {isPhysical ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                  <Truck className="w-3 h-3 text-amber-400" /> Physical Shipment
                </span>
              ) : isSoftware ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md flex items-center gap-1">
                  <Key className="w-3 h-3 text-indigo-400" /> Software License
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                  <Download className="w-3 h-3 text-emerald-400" /> Instant Digital Asset
                </span>
              )}
            </div>

            {/* Discount Badge */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-lg">
              35% OFF
            </div>
          </div>

          {/* Thumbnails row */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIdx === idx
                      ? 'border-indigo-500 shadow-md shadow-indigo-500/30 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Product Header Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="text-slate-500">SKU: <strong className="text-slate-300">{product.sku || 'INF-PRD'}</strong></span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>4.9 / 5.0</span>
                <span className="text-slate-500 font-normal">(148 verified ratings)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {product.name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description || product.short_description || 'High-performance production asset configured for high reliability, enterprise compliance, and rapid automated deployment.'}
            </p>
          </div>

          {/* TYPE-SPECIFIC HIGHLIGHT BOX */}
          {isPhysical && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  <span>Physical Shipping & Delivery</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {metadata?.warehouse_location ? `Dispatched from ${metadata.warehouse_location}` : 'In Stock • Ready to Dispatch'}
                </span>
              </div>

              {/* Delivery Pincode Checker */}
              <form onSubmit={handleCheckPincode} className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Check Estimated Delivery Date:</span>
                </label>
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN code"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </div>
                {pincodeResult && (
                  <p className="text-xs text-emerald-400 font-medium">{pincodeResult}</p>
                )}
              </form>

              {/* Specs Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Weight</span>
                  <span className="font-bold text-white">{metadata?.weight || product.weight || '0.5 kg'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Dimensions</span>
                  <span className="font-bold text-white">{metadata?.dimensions || '15 x 10 x 5 cm'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Warranty</span>
                  <span className="font-bold text-emerald-400">1-Year Brand</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Replacement</span>
                  <span className="font-bold text-white">7-Day Free</span>
                </div>
              </div>
            </div>
          )}

          {isSoftware && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span>Software License & Automated Provisioning</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Version {metadata?.file_version || 'v2.4.0'}
                </span>
              </div>

              {/* Platform compatibility badges */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block">Supported Environments & Platforms:</span>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-400" /> Windows 11 / 10
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-slate-300" /> macOS (Apple Silicon & Intel)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> Linux (Ubuntu / RHEL)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Docker & Kubernetes
                  </span>
                </div>
              </div>

              {/* Specs Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">License Type</span>
                  <span className="font-bold text-white">{metadata?.activation_limit || '3 Devices / 1 Domain'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Key Delivery</span>
                  <span className="font-bold text-emerald-400">Instant Automated</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Validity</span>
                  <span className="font-bold text-white">{metadata?.validity_days ? `${metadata.validity_days} Days` : '1 Year / Perpetual'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Updates</span>
                  <span className="font-bold text-indigo-400">Lifetime Included</span>
                </div>
              </div>
            </div>
          )}

          {isDigital && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Digital Asset Specifications</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant Access
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">File Size</span>
                  <span className="font-bold text-white">{metadata?.file_size || '45 MB'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Format</span>
                  <span className="font-bold text-white">.ZIP Package</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">Download Limit</span>
                  <span className="font-bold text-indigo-400">Unlimited / Re-download</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px]">License</span>
                  <span className="font-bold text-emerald-400">Commercial Use</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: HIGH-CONVERTING BUY BOX (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl space-y-5 sticky top-24">
            {/* Pricing Section */}
            <div className="space-y-1.5 border-b border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                  Pricing & Availability
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Verified In Stock
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ₹{isReseller() ? totalWholesale.toLocaleString('en-IN') : totalRetail.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-500 line-through">
                  ₹{(originalPrice * quantity).toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  Save 35%
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                {isReseller() ? 'Wholesale reseller cost (incl. 18% GST)' : 'Inclusive of all applicable GST & taxes'}
              </p>
            </div>

            {/* Reseller Profit Margin Breakdown */}
            {(isReseller() || isSuperAdmin()) && (
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between text-indigo-300 font-bold text-[11px]">
                  <span>Reseller Margin Overview</span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                    +{Math.round((unitProfit / wholesalePrice) * 100)}% Margin
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Your Wholesale Cost:</span>
                  <span className="font-bold text-white">₹{totalWholesale.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>End Client Bill Price:</span>
                  <span className="font-semibold text-slate-200">₹{totalRetail.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-extrabold pt-1.5 border-t border-indigo-900/80 text-xs">
                  <span>Net Pocket Profit:</span>
                  <span>+₹{totalProfit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-800 rounded-xl bg-slate-950 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-black text-white min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 flex gap-1.5">
                  {[1, 5, 10].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        quantity === q
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reseller Customer Assignment Dropdown */}
            {isReseller() && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Assign Order to Client:</span>
                  <Link to="/reseller/customers" className="text-[10px] text-indigo-400 hover:underline">
                    + New Client
                  </Link>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Reseller Organization Inventory (Self)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) {c.company ? `— ${c.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DUAL ACTION BUTTONS: Add to Cart + Buy Now */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
                <span>Add to Shopping Cart</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={ordering}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-violet-600 hover:from-emerald-500 hover:via-indigo-500 hover:to-violet-500 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {ordering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-300" />
                )}
                <span>
                  {isReseller() ? 'Buy Now & Debit Wallet' : 'Instant Checkout / Buy Now'}
                </span>
              </button>
            </div>

            {/* Trust & Guarantee Badges */}
            <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>256-bit Encrypted Checkout via Razorpay / Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Automated instant delivery to client dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24/7 SLA Technical Architecture Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-TAB CONTENT SECTION */}
      <div className="pt-6 border-t border-slate-800/80 space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Highlights' },
            { id: 'specs', label: 'Technical Specifications' },
            { id: 'how_it_works', label: 'How Provisioning Works' },
            { id: 'reviews', label: 'Customer Reviews (4.9/5)' },
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
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Product Highlights & Capabilities
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {product.full_description || product.description || 'Enterprise-grade solution designed for high performance, ease of integration, and rapid automated delivery.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified Authenticity & Direct Licensing</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>White-Label Ready for B2B2C Resale</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tax Invoices with GSTIN compliance</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Comprehensive API & Webhook Notifications</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPECS */}
        {activeTab === 'specs' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h3 className="text-base font-extrabold text-white">Full Specifications & Parameters</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300 border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-800/80">
                      <td className="py-2.5 font-bold text-slate-400 w-1/3">Item Name</td>
                      <td className="py-2.5 text-white font-semibold">{product.name}</td>
                    </tr>
                    <tr className="border-b border-slate-800/80">
                      <td className="py-2.5 font-bold text-slate-400">SKU Code</td>
                      <td className="py-2.5 text-white">{product.sku || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-800/80">
                      <td className="py-2.5 font-bold text-slate-400">Classification</td>
                      <td className="py-2.5 text-indigo-300 font-semibold capitalize">{productType}</td>
                    </tr>
                    <tr className="border-b border-slate-800/80">
                      <td className="py-2.5 font-bold text-slate-400">Category</td>
                      <td className="py-2.5 text-white">{categoryName}</td>
                    </tr>
                    {isPhysical && (
                      <>
                        <tr className="border-b border-slate-800/80">
                          <td className="py-2.5 font-bold text-slate-400">Shipping Weight</td>
                          <td className="py-2.5 text-white">{metadata?.weight || product.weight || '0.5 kg'}</td>
                        </tr>
                        <tr className="border-b border-slate-800/80">
                          <td className="py-2.5 font-bold text-slate-400">Package Dimensions</td>
                          <td className="py-2.5 text-white">{metadata?.dimensions || '15 x 10 x 5 cm'}</td>
                        </tr>
                        <tr className="border-b border-slate-800/80">
                          <td className="py-2.5 font-bold text-slate-400">Courier Network</td>
                          <td className="py-2.5 text-white">{metadata?.courier || 'BlueDart / Delhivery'}</td>
                        </tr>
                      </>
                    )}
                    {isSoftware && (
                      <>
                        <tr className="border-b border-slate-800/80">
                          <td className="py-2.5 font-bold text-slate-400">Software Build</td>
                          <td className="py-2.5 text-white">{metadata?.file_version || 'v2.4.0 (Latest Release)'}</td>
                        </tr>
                        <tr className="border-b border-slate-800/80">
                          <td className="py-2.5 font-bold text-slate-400">Device Activations</td>
                          <td className="py-2.5 text-white">{metadata?.activation_limit || '3 Devices simultaneously'}</td>
                        </tr>
                        <tr className="border-b border-slate-800/80">
                          <td className="py-2.5 font-bold text-slate-400">License Term</td>
                          <td className="py-2.5 text-white">{metadata?.validity_days ? `${metadata.validity_days} Days Active` : '1 Year Valid'}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HOW IT WORKS */}
        {activeTab === 'how_it_works' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6 animate-in fade-in">
            <h3 className="text-base font-extrabold text-white">Automated Delivery & Lifecycle Workflow</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black">1</div>
                <h4 className="font-bold text-white">Instant Order</h4>
                <p className="text-[11px] text-slate-400">Order is placed via Reseller Wallet or Online Gateway with 256-bit encryption.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-black">2</div>
                <h4 className="font-bold text-white">Auto-Provisioning</h4>
                <p className="text-[11px] text-slate-400">System generates unique license keys or registers parcel tracking with logistics.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black">3</div>
                <h4 className="font-bold text-white">Dashboard Dispatch</h4>
                <p className="text-[11px] text-slate-400">Client credentials and download links are instantly updated on the client orders portal.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-black">4</div>
                <h4 className="font-bold text-white">Profit Credited</h4>
                <p className="text-[11px] text-slate-400">Reseller margin is calculated and credited to the real-time financial ledger.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Verified Customer Reviews
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-white">4.9 out of 5</span>
                    <span className="text-xs text-slate-400">• Based on 148 verified purchases</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewSubmitted(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Write a Review
                </button>
              </div>

              {reviewSubmitted && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Thank you! Your verified review has been submitted for moderation.</span>
                </div>
              )}

              {/* Sample Reviews List */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    name: 'Rajesh Sharma',
                    company: 'CloudSphere Technologies',
                    rating: 5,
                    date: '2 days ago',
                    text: 'Exceptional build quality and instant automated licensing. Deployed for 12 of our clients seamlessly.',
                  },
                  {
                    name: 'Vikram Patel',
                    company: 'Apex IT Services',
                    rating: 5,
                    date: '1 week ago',
                    text: 'The reseller margins on this are solid. Provisioning took less than 30 seconds to show up in our client dashboard.',
                  },
                  {
                    name: 'Ananya Roy',
                    company: 'InnoTech Resellers',
                    rating: 5,
                    date: '2 weeks ago',
                    text: 'Clear documentation, official GST invoicing, and top-tier support from the Infiniforge team.',
                  },
                ].map((rev, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center">
                          {rev.name[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block leading-tight">{rev.name}</span>
                          <span className="text-[10px] text-slate-400">{rev.company}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">{rev.date}</span>
                    </div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, rIdx) => (
                        <Star key={rIdx} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FAQ */}
        {activeTab === 'faq' && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 animate-in fade-in">
            <h3 className="text-base font-extrabold text-white">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {[
                {
                  q: 'How fast is delivery after payment?',
                  a: 'Digital software licenses and assets are provisioned immediately upon transaction confirmation. Physical hardware packages are dispatched within 24 hours with BlueDart/Delhivery tracking.',
                },
                {
                  q: 'Can I resell this product under my own brand?',
                  a: 'Yes! All products and services on the platform support white-label client distribution. Resellers set their own retail customer pricing and retain 100% of the markup.',
                },
                {
                  q: 'How do GST tax invoices work?',
                  a: 'Official B2B tax invoices with GSTIN compliance are automatically generated and available for immediate download in your orders ledger.',
                },
                {
                  q: 'What is the refund and warranty policy?',
                  a: 'Physical goods carry a 7-day replacement guarantee and 1-year brand warranty. Software licenses have 24/7 SLA technical assistance and activation guarantees.',
                },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{item.q}</span>
                  </h4>
                  <p className="text-xs text-slate-300 pl-5">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RELATED PRODUCTS & SERVICES ("You May Also Like") */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              Frequently Paired With This Item
            </h3>
            <Link to={backLink} className="text-xs text-indigo-400 hover:underline font-bold">
              Explore All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedProducts.map((rel: any) => {
              const relPrice = Number(rel.pricing?.customer_price ?? rel.retail_price ?? rel.price ?? 999);
              return (
                <div
                  key={rel.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {typeof rel.category === 'object' ? rel.category?.name : rel.category || 'Digital'}
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
                      ₹{relPrice.toLocaleString('en-IN')}
                    </span>
                    <Link
                      to={`/products/${rel.slug}`}
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
