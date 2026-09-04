import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Package, Server, Search, Star, Heart, ArrowUpDown,
  Filter, ShoppingCart, Zap, Check, AlertCircle,
  Loader2, ShieldCheck, IndianRupee, Sparkles, X, CheckCircle2, User,
  ExternalLink, Key, Truck, Download, Box, Globe
} from 'lucide-react';
import { marketplaceApi, resellerApi, ordersApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type {
  Product, Service, AdminPricing, ResellerPricing, CustomerPricing
} from '../../types';

function PriceDisplay({ pricing, role }: { pricing?: any; role: string }) {
  if (!pricing) return null;

  if (role === 'superadmin' || role === 'admin') {
    const p = pricing as AdminPricing;
    return (
      <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>Cost Price:</span>
          <span className="font-semibold text-slate-200">₹{p.cost_price}</span>
        </div>
        <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-1">
          <span>Retail Price:</span>
          <span className="text-white text-sm">₹{p.customer_price}</span>
        </div>
        <div className="text-[11px] text-emerald-400 font-semibold text-right">
          Platform Margin: +₹{p.platform_margin}
        </div>
      </div>
    );
  }

  if (role === 'reseller') {
    const p = pricing as ResellerPricing;
    return (
      <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-400 text-[11px]">Wholesale Cost:</span>
          <span className="text-base font-black text-violet-400">₹{p.your_price}</span>
        </div>
        <div className="flex justify-between text-slate-400 text-[11px]">
          <span>Customer Retail:</span>
          <span className="font-semibold text-slate-200">₹{p.customer_price}</span>
        </div>
        <div className="text-[11px] text-emerald-400 font-bold text-right pt-0.5 border-t border-slate-800/60">
          Your Profit: +₹{p.your_profit}
        </div>
      </div>
    );
  }

  const p = pricing as CustomerPricing;
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xl font-black text-white">₹{p.price}</span>
      {p.tax_inclusive && <span className="text-[10px] text-slate-400 font-normal">incl. tax</span>}
    </div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const role = user?.pricing_role ?? 'customer';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const isReseller = role === 'reseller';
  const basePath = isReseller ? '/reseller' : location.pathname.startsWith('/app') ? '/app' : '';

  const [tab, setTab] = useState<'all' | 'products' | 'services'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick Order / Provision Modal State
  const [activeModalItem, setActiveModalItem] = useState<{ type: 'product' | 'service'; item: any } | null>(null);
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderInterval, setOrderInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderAlert, setOrderAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Categories Query
  const { data: categoriesResponse } = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: () => marketplaceApi.categories().then(r => r.data?.data ?? []),
  });
  const categories: any[] = categoriesResponse ?? [];

  // Queries
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['marketplace', 'products', search, sort, selectedCategory],
    queryFn: () => marketplaceApi.products({
      search,
      sort,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      per_page: 50
    }).then(r => r.data),
  });

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['marketplace', 'services', search, sort, selectedCategory],
    queryFn: () => marketplaceApi.services({
      search,
      sort,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      per_page: 50
    }).then(r => r.data),
  });

  const { data: recData } = useQuery({
    queryKey: ['marketplace', 'recommendations'],
    queryFn: () => marketplaceApi.recommendations().then(r => r.data?.data),
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['marketplace', 'wishlist'],
    queryFn: () => marketplaceApi.wishlist().then(r => r.data?.data),
    enabled: !!user,
  });

  // Reseller-specific data
  const { data: customersData } = useQuery({
    queryKey: ['reseller', 'customers-list'],
    queryFn: () => resellerApi.customers({ per_page: 50 }).then(r => r.data?.data ?? []),
    enabled: isReseller,
  });

  const { data: walletData } = useQuery({
    queryKey: ['reseller', 'wallet'],
    queryFn: () => resellerApi.wallet().then(r => r.data?.data),
    enabled: isReseller,
  });

  const customers: any[] = customersData ?? [];
  const walletBalance = Number(walletData?.available_balance ?? 0);

  const wishlistIds = new Set((Array.isArray(wishlistData) ? wishlistData : []).map((w: any) => w.product_id || w.service_id));

  const wishlistMutation = useMutation({
    mutationFn: (data: { product_id?: string; service_id?: string }) => marketplaceApi.toggleWishlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'wishlist'] });
    },
  });

  const products: Product[] = productsData?.data ?? [];
  const services: Service[] = servicesData?.data ?? [];
  const recProducts = recData?.recommended_products ?? [];

  const getCategoryDisplayName = (item: any, fallback: string = 'Digital') => {
    if (item?.category && typeof item.category === 'object' && item.category.name) {
      return item.category.name;
    }
    if (item?.category_id) {
      const match = categories.find((c: any) => c.id === item.category_id || c.slug === item.category_id);
      if (match) return match.name;
    }
    if (typeof item?.category === 'string') {
      const match = categories.find((c: any) => c.slug === item.category || c.id === item.category);
      if (match) return match.name;
      return item.category;
    }
    return fallback;
  };

  const handleOpenOrderModal = (type: 'product' | 'service', item: any, defaultBeneficiary: 'customer' | 'self' = 'customer') => {
    setActiveModalItem({ type, item });
    setOrderCustomerId(defaultBeneficiary === 'customer' ? (customers[0]?.id || 'customer') : '');
    setOrderQuantity(1);
    setOrderInterval('monthly');
    setOrderAlert(null);
  };

  const handleConfirmOrder = async () => {
    if (!activeModalItem) return;
    setIsSubmittingOrder(true);
    setOrderAlert(null);

    try {
      if (activeModalItem.type === 'product') {
        const payload: any = {
          items: [{ product_id: activeModalItem.item.id, quantity: orderQuantity }],
          payment_method: 'wallet',
        };
        if (orderCustomerId) payload.customer_id = orderCustomerId;

        if (isReseller) {
          await resellerApi.createOrder(payload);
          queryClient.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
          queryClient.invalidateQueries({ queryKey: ['reseller', 'orders'] });
        } else {
          await ordersApi.create(payload);
        }

        setOrderAlert({
          type: 'success',
          message: `Wholesale order placed successfully! ${orderQuantity} digital license key(s) provisioned immediately.`,
        });
      } else {
        const payload: any = {
          items: [{ service_id: activeModalItem.item.id, interval: orderInterval }],
          payment_method: 'wallet',
        };
        if (orderCustomerId) payload.customer_id = orderCustomerId;

        if (isReseller) {
          await resellerApi.createOrder(payload);
          queryClient.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
          queryClient.invalidateQueries({ queryKey: ['reseller', 'subscriptions'] });
        } else {
          await ordersApi.create(payload);
        }

        setOrderAlert({
          type: 'success',
          message: `Cloud subscription activated successfully for ${activeModalItem.item.name}!`,
        });
      }
    } catch (err: any) {
      setOrderAlert({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to complete order. Please check wallet balance.',
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl p-4 sm:p-6 lg:p-8 space-y-8 border border-slate-800/80 shadow-2xl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 p-6 sm:p-8 border border-indigo-500/20">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Marketplace & SaaS Distribution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Enterprise Product Catalog & Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isReseller
              ? 'Purchase digital licenses at wholesale pricing, assign immediately to your customer accounts, and settle automatically via your prepaid wallet.'
              : 'Browse high-performance digital tools, enterprise security licenses, and managed cloud infrastructure.'}
          </p>
        </div>

        {isReseller && (
          <div className="mt-4 pt-4 border-t border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Your Prepaid Wallet:</span>
              <span className="text-emerald-400 font-bold font-mono">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <Link
              to="/reseller/wallet"
              className="text-indigo-400 hover:text-indigo-300 font-bold underline text-xs"
            >
              + Top-up Wallet Funds
            </Link>
          </div>
        )}
      </div>

      {/* Recommended Items */}
      {recProducts.length > 0 && (
        <section className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Recommended For Your Business
            </h2>
            <span className="text-xs font-bold text-slate-400">Featured Curated Selection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recProducts.map((p: any) => (
              <Link
                key={p.id}
                to={`${basePath}/products/${p.slug}`}
                className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 hover:border-indigo-500/40 hover:bg-slate-900 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="text-[11px] text-indigo-400 font-bold mb-1 uppercase tracking-wider">
                    {getCategoryDisplayName(p, 'Featured')}
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-1 mb-1 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{p.short_description}</p>
                </div>
                <PriceDisplay pricing={p.pricing} role={role} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category Pills Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Browse by Category</h2>
          </div>
          <span className="text-xs text-slate-400">
            {categories.length} Categories Available
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/25 scale-[1.02]'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <span>All Catalog</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-slate-300 font-semibold">
              {products.length + services.length}
            </span>
          </button>

          {categories.map((cat: any) => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
            return (
              <button
                key={cat.id || cat.slug}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : (cat.slug || cat.id))}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-500/25 scale-[1.02]'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search & Category Quick Select */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search software, digital products, licenses & services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-800 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0"
          >
            <option value="all">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id || cat.slug} value={cat.slug || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            {(['all', 'products', 'services'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-200 text-xs"
            >
              <option value="newest" className="bg-slate-900">Sort: Newest</option>
              <option value="popular" className="bg-slate-900">Sort: Popularity</option>
              <option value="name" className="bg-slate-900">Sort: Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Tags */}
      {(search || selectedCategory !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 animate-in fade-in">
          <span>Active filters:</span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-[11px] font-medium">
              Category: {categories.find((c: any) => c.slug === selectedCategory || c.id === selectedCategory)?.name || selectedCategory}
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="hover:text-white ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
              Query: "{search}"
              <button
                type="button"
                onClick={() => setSearch('')}
                className="hover:text-white ml-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
            }}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold ml-1 cursor-pointer"
          >
            Reset all
          </button>
        </div>
      )}

      {/* Main Listings */}
      {loadingProducts || loadingServices ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Products Section */}
          {(tab === 'all' || tab === 'products') && (
            <section className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-indigo-400" /> Products Catalog ({products.length})
                </h2>
                <span className="text-xs text-slate-400 font-medium">Digital licenses, keys & downloads</span>
              </div>

              {products.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                  No products found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map(p => {
                    const inWishlist = wishlistIds.has(p.id);
                    const categoryName = getCategoryDisplayName(p, 'Digital');

                    return (
                      <div
                        key={p.id}
                        className="group bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
                      >
                        <Link to={`${basePath}/products/${p.slug}`} className="block">
                          <div className="aspect-video bg-slate-950 relative overflow-hidden">
                            {p.images?.[0] ? (
                              <img src={p.images[0].path} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-950 via-slate-900 to-violet-950 p-4 text-center">
                                <Package className="w-10 h-10 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest">{categoryName}</span>
                              </div>
                            )}

                            {/* Wishlist Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                wishlistMutation.mutate({ product_id: p.id });
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-sm hover:bg-slate-800 transition-colors"
                            >
                              <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                            </button>
                          </div>

                          <div className="p-5 space-y-2.5">
                            <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">{categoryName}</span>
                              <div className="flex items-center gap-1.5">
                                {p.type === 'physical' || (p as any).is_shippable ? (
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 inline-flex items-center gap-1">
                                    <Truck className="w-2.5 h-2.5" /> Physical
                                  </span>
                                ) : p.type === 'digital' ? (
                                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30 inline-flex items-center gap-1">
                                    <Download className="w-2.5 h-2.5" /> Digital
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30 inline-flex items-center gap-1">
                                    <Key className="w-2.5 h-2.5" /> License Key
                                  </span>
                                )}
                                <span className="flex items-center gap-0.5 text-amber-400 font-bold text-[11px]">
                                  <Star className="w-3 h-3 fill-current" /> 4.9
                                </span>
                              </div>
                            </div>

                            <h3 className="font-bold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {p.name}
                            </h3>

                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {p.short_description || p.full_description}
                            </p>
                          </div>
                        </Link>

                        <div className="p-5 pt-0 space-y-3">
                          <PriceDisplay pricing={p.pricing} role={role} />

                          {(p as any).metadata?.live_preview_url && (
                            <a
                              href={(p as any).metadata.live_preview_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-full py-1.5 px-2 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 font-bold text-[11px] rounded-xl border border-indigo-500/30 transition-all flex items-center justify-center gap-1.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Live Preview / Demo</span>
                            </a>
                          )}

                          {isReseller ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenOrderModal('product', p, 'customer')}
                                className="py-2.5 px-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-[11px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <User className="w-3.5 h-3.5" />
                                <span>For Client</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenOrderModal('product', p, 'self')}
                                className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>For Self</span>
                              </button>
                            </div>
                          ) : (
                            <Link
                              to={`${basePath}/products/${p.slug}`}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Order License</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Services Section */}
          {(tab === 'all' || tab === 'services') && (
            <section className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  <Server className="w-5 h-5 text-indigo-400" /> Services Catalog ({services.length})
                </h2>
                <span className="text-xs text-slate-400 font-medium">Cloud compute, SSL & recurring SaaS</span>
              </div>

              {services.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-xs">
                  No recurring services found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {services.map(s => {
                    const inWishlist = wishlistIds.has(s.id);
                    const categoryName = getCategoryDisplayName(s, 'Recurring Service');

                    return (
                      <div
                        key={s.id}
                        className="group bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
                      >
                        <Link to={`${basePath}/services/${s.slug}`} className="block">
                          <div className="aspect-video bg-slate-950 relative overflow-hidden">
                            {s.image_url ? (
                              <img src={s.image_url} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-violet-950 via-slate-900 to-indigo-950 p-4 text-center">
                                <Server className="w-10 h-10 text-violet-400 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-mono text-violet-300 uppercase tracking-widest">{categoryName}</span>
                              </div>
                            )}

                            {/* Wishlist Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                wishlistMutation.mutate({ service_id: s.id });
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-sm hover:bg-slate-800 transition-colors"
                            >
                              <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                            </button>
                          </div>

                          <div className="p-5 space-y-2.5">
                            <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">{categoryName}</span>
                              <div className="flex items-center gap-1.5">
                                {(s as any).metadata?.architecture_type === 'bundle' ? (
                                  <span className="text-[10px] font-bold text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded border border-violet-500/30 inline-flex items-center gap-1">
                                    <Box className="w-2.5 h-2.5" /> SaaS Suite
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 inline-flex items-center gap-1">
                                    <Server className="w-2.5 h-2.5" /> Cloud App
                                  </span>
                                )}
                                <span className="flex items-center gap-0.5 text-amber-400 font-bold text-[11px]">
                                  <Star className="w-3 h-3 fill-current" /> 5.0
                                </span>
                              </div>
                            </div>

                            <h3 className="font-bold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {s.name}
                            </h3>

                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {s.short_description || s.full_description}
                            </p>

                            {Array.isArray((s as any).metadata?.bundled_apps) && (s as any).metadata.bundled_apps.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {(s as any).metadata.bundled_apps.slice(0, 3).map((app: string, idx: number) => (
                                  <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                                    ✓ {app}
                                  </span>
                                ))}
                                {(s as any).metadata.bundled_apps.length > 3 && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                                    +{(s as any).metadata.bundled_apps.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="p-5 pt-0 space-y-3">
                          <PriceDisplay pricing={(s as any).pricing ?? s.plans?.[0]?.pricing} role={role} />

                          {(s as any).metadata?.live_preview_url && (
                            <a
                              href={(s as any).metadata.live_preview_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-full py-1.5 px-2 bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 font-bold text-[11px] rounded-xl border border-violet-500/30 transition-all flex items-center justify-center gap-1.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Live Interactive Demo</span>
                            </a>
                          )}

                          {isReseller ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenOrderModal('service', s, 'customer')}
                                className="py-2.5 px-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-[11px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <User className="w-3.5 h-3.5" />
                                <span>Assign Client</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenOrderModal('service', s, 'self')}
                                className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>For Self</span>
                              </button>
                            </div>
                          ) : (
                            <Link
                              to={`${basePath}/services/${s.slug}`}
                              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Subscribe Service</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* QUICK PROVISION & ASSIGN MODAL FOR RESELLERS */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-950 text-slate-100 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-indigo-500/40 space-y-5 text-xs max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  {activeModalItem.type === 'product' ? <Package className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {activeModalItem.type === 'product' ? 'Wholesale License Provisioning' : 'Provision Cloud Subscription'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Instantly debit wallet & assign to client account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Box if present */}
            {orderAlert && (
              <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2.5 ${
                orderAlert.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' : 'bg-red-500/20 border-red-500/40 text-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {orderAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                  <span>{orderAlert.message}</span>
                </div>
                {orderAlert.type === 'success' && (
                  <Link to="/reseller/orders" className="text-white underline font-bold hover:text-emerald-300 shrink-0">
                    View Orders →
                  </Link>
                )}
              </div>
            )}

            {/* Item Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                  {getCategoryDisplayName(activeModalItem.item, activeModalItem.type === 'service' ? 'Recurring Service' : 'Digital')}
                </span>
                <h4 className="font-bold text-white text-sm mt-0.5">{activeModalItem.item.name}</h4>
              </div>
              <Link
                to={`${basePath}/${activeModalItem.type === 'product' ? 'products' : 'services'}/${activeModalItem.item.slug}`}
                className="text-[11px] font-semibold text-indigo-400 hover:underline shrink-0"
              >
                Full Specs →
              </Link>
            </div>

            {/* Pricing Calculations */}
            {(() => {
              const pricing = activeModalItem.item.pricing as any;
              const unitWholesale = Number(pricing?.your_price ?? pricing?.wholesale_price ?? activeModalItem.item.price ?? 999);
              const unitRetail = Number(pricing?.customer_price ?? activeModalItem.item.retail_price ?? unitWholesale * 1.25);
              const unitProfit = Number(pricing?.your_profit ?? Math.max(0, unitRetail - unitWholesale));

              const totalWholesale = unitWholesale * (activeModalItem.type === 'product' ? orderQuantity : (orderInterval === 'yearly' ? 10 : 1));
              const totalRetail = unitRetail * (activeModalItem.type === 'product' ? orderQuantity : (orderInterval === 'yearly' ? 10 : 1));
              const totalProfit = unitProfit * (activeModalItem.type === 'product' ? orderQuantity : (orderInterval === 'yearly' ? 10 : 1));
              const remainingWallet = walletBalance - totalWholesale;

              return (
                <div className="space-y-4">
                  {/* Financial Breakdown */}
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Total Wholesale Cost (Debited from Wallet):</span>
                      <span className="font-mono font-black text-white text-sm">₹{totalWholesale.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Customer Retail Bill:</span>
                      <span className="font-mono text-slate-200">₹{totalRetail.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold pt-1.5 border-t border-indigo-900/60">
                      <span>Your Net Margin Earned:</span>
                      <span className="font-mono text-sm">+₹{totalProfit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Quantity or Billing Interval Selector */}
                  {activeModalItem.type === 'product' ? (
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-300">Quantity of Licenses</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 5, 10].map(q => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setOrderQuantity(q)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              orderQuantity === q
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-300">Billing Cycle</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setOrderInterval('monthly')}
                          className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                            orderInterval === 'monthly'
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          Monthly Billing
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderInterval('yearly')}
                          className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                            orderInterval === 'yearly'
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          Annual (Save 17%)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Beneficiary Selector */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300">Procurement Beneficiary</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderCustomerId(customers[0]?.id || 'customer')}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center gap-2 ${
                          orderCustomerId !== ''
                            ? 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <User className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <div className="text-xs">Client Account</div>
                          <div className="text-[10px] text-slate-400 font-normal">Assign & bill customer</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderCustomerId('')}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center gap-2 ${
                          orderCustomerId === ''
                            ? 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <div className="text-xs">Self (Reseller)</div>
                          <div className="text-[10px] text-slate-400 font-normal">Internal org inventory</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Assign to Customer Selector if Client mode */}
                  {orderCustomerId !== '' && (
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-300 flex items-center justify-between">
                        <span>Target Customer Account:</span>
                        <Link to="/reseller/customers" className="text-[10px] text-indigo-400 hover:underline">
                          + New Customer
                        </Link>
                      </label>
                      <select
                        value={orderCustomerId}
                        onChange={e => setOrderCustomerId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email}) {c.company ? `— ${c.company}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Wallet Check Footer */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-slate-400">Available Wallet: </span>
                      <strong className="text-white font-mono">₹{walletBalance.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Balance After: </span>
                      <strong className={`font-mono ${remainingWallet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ₹{remainingWallet.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {remainingWallet < 0 && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 flex items-center justify-between">
                      <span>Insufficient wallet balance for this order.</span>
                      <Link to="/reseller/wallet" className="underline font-bold text-white hover:text-red-300">
                        Top-up ₹{Math.abs(remainingWallet).toLocaleString('en-IN')} →
                      </Link>
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(null)}
                      className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingOrder || remainingWallet < 0}
                      onClick={handleConfirmOrder}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {isSubmittingOrder ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                      <span>Confirm & Debit Wallet</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
