import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Filter, Heart, Loader2, Package, Search, Server,
  Sparkles, Star, Zap, ArrowUpDown, SlidersHorizontal,
  Layers, X, CheckCircle2, ArrowRight, ShoppingCart,
  Check, ShieldCheck
} from 'lucide-react';
import { marketplaceApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminPricing, CustomerPricing, Product, ResellerPricing, Service } from '../../types';

// ─── Role-aware price component ─────────────────────────────────────────────
function PriceDisplay({ pricing, role }: { pricing: any; role: string }) {
  if (!pricing) return <span className="text-slate-500 text-xs">Price on request</span>;

  if (role === 'admin') {
    const p = pricing as AdminPricing;
    return (
      <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Cost Price:</span>
          <span className="font-semibold text-slate-300">₹{p.cost_price}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Reseller Price:</span>
          <span className="font-semibold text-violet-400">₹{p.reseller_price}</span>
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

  const [tab, setTab] = useState<'all' | 'products' | 'services'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  // Queries
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['marketplace', 'products', search, sort],
    queryFn: () => marketplaceApi.products({ search, sort, per_page: 20 }).then(r => r.data),
  });

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['marketplace', 'services', search, sort],
    queryFn: () => marketplaceApi.services({ search, sort, per_page: 20 }).then(r => r.data),
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

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl p-4 sm:p-6 lg:p-8 space-y-10 border border-slate-800/80 shadow-2xl">
      {/* Hero & Sponsored Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 border border-indigo-500/20 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Commercial Cloud Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Enterprise Digital Products & Recurring Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {role === 'admin' && 'Super Admin Mode — Real-time cost price, wholesale reseller pricing, and platform margins.'}
            {role === 'reseller' && 'Reseller Mode — Exclusive wholesale rates with instant profit markups.'}
            {role === 'customer' && 'Discover premium SaaS tools, digital licenses, and managed cloud recurring services.'}
          </p>
        </div>
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
                to={`/products/${p.slug}`}
                className="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 hover:border-indigo-500/40 hover:bg-slate-900 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="text-[11px] text-indigo-400 font-bold mb-1 uppercase tracking-wider">{p.category?.name || 'Featured'}</div>
                  <h3 className="font-bold text-white text-sm line-clamp-1 mb-1 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{p.short_description}</p>
                </div>
                <PriceDisplay pricing={p.pricing} role={role} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search, Filter & Sort Bar */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search digital products, licenses & services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            {(['all', 'products', 'services'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
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

                    return (
                      <div
                        key={p.id}
                        className="group bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
                      >
                        <Link to={`/products/${p.slug}`} className="block">
                          <div className="aspect-video bg-slate-950 relative overflow-hidden">
                            {p.images?.[0] ? (
                              <img src={p.images[0].path} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-950 via-slate-900 to-violet-950 p-4 text-center">
                                <Package className="w-10 h-10 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest">{p.category?.name || 'Digital SaaS'}</span>
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
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">{p.category?.name || 'Digital'}</span>
                              <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                                <Star className="w-3 h-3 fill-current" /> 4.9
                              </span>
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

                          <Link
                            to={`/products/${p.slug}`}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{role === 'reseller' ? 'Wholesale Order' : 'Order License'}</span>
                          </Link>
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

                    return (
                      <div
                        key={s.id}
                        className="group bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
                      >
                        <Link to={`/services/${s.slug}`} className="block">
                          <div className="aspect-video bg-slate-950 relative overflow-hidden">
                            {s.image_url ? (
                              <img src={s.image_url} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-violet-950 via-slate-900 to-indigo-950 p-4 text-center">
                                <Server className="w-10 h-10 text-violet-400 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-mono text-violet-300 uppercase tracking-widest">{s.category?.name || 'Cloud Managed'}</span>
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
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">{s.category?.name || 'Recurring Service'}</span>
                              <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                                <Star className="w-3 h-3 fill-current" /> 5.0
                              </span>
                            </div>

                            <h3 className="font-bold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {s.name}
                            </h3>

                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {s.short_description || s.full_description}
                            </p>
                          </div>
                        </Link>

                        <div className="p-5 pt-0 space-y-3">
                          <PriceDisplay pricing={(s as any).pricing ?? s.plans?.[0]?.pricing} role={role} />

                          <Link
                            to={`/services/${s.slug}`}
                            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{role === 'reseller' ? 'Provision Service' : 'Subscribe Service'}</span>
                          </Link>
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
    </div>
  );
}
