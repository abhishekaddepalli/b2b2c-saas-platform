import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Filter,
  Heart,
  Loader2,
  Package,
  Search,
  Server,
  Sparkles,
  Star,
  Zap,
  ArrowUpDown,
  SlidersHorizontal,
  Layers,
  X,
  CheckCircle2,
} from 'lucide-react';
import { marketplaceApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { AdminPricing, CustomerPricing, Product, ResellerPricing, Service } from '../../types';

// ─── Role-aware price component ─────────────────────────────────────────────
function PriceDisplay({ pricing, role }: { pricing: any; role: string }) {
  if (!pricing) return <span className="text-slate-400 text-xs">Price on request</span>;

  if (role === 'admin') {
    const p = pricing as AdminPricing;
    return (
      <div className="space-y-0.5">
        <div className="text-xs text-slate-400">Cost: <span className="font-medium text-slate-600">₹{p.cost_price}</span></div>
        <div className="text-xs text-slate-400">Reseller: <span className="font-medium text-violet-600">₹{p.reseller_price}</span></div>
        <div className="text-base font-bold text-slate-900">₹{p.customer_price}</div>
        <div className="text-xs text-emerald-600 font-medium">Platform margin: ₹{p.platform_margin}</div>
      </div>
    );
  }

  if (role === 'reseller') {
    const p = pricing as ResellerPricing;
    return (
      <div>
        <div className="text-base font-bold text-violet-700">₹{p.your_price} <span className="text-xs font-normal text-slate-400">your price</span></div>
        <div className="text-xs text-slate-500">Customer pays: ₹{p.customer_price}</div>
        <div className="text-xs text-emerald-600 font-medium">Your profit: ₹{p.your_profit}</div>
      </div>
    );
  }

  const p = pricing as CustomerPricing;
  return (
    <div className="text-lg font-bold text-slate-900">
      ₹{p.price}
      {p.tax_inclusive && <span className="text-xs font-normal text-slate-400 ml-1">incl. tax</span>}
    </div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const role = user?.pricing_role ?? 'customer';
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'all' | 'products' | 'services'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [comparedItems, setComparedItems] = useState<any[]>([]);

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

  const toggleCompare = (item: any) => {
    setComparedItems(prev => {
      if (prev.some(i => i.id === item.id)) {
        return prev.filter(i => i.id !== item.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, item];
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Hero & Sponsored Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Commercial Cloud Marketplace
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Enterprise Digital Products & Recurring Services
          </h1>
          <p className="text-sm text-slate-300">
            {role === 'admin' && 'Super Admin Mode — Real-time cost price, reseller pricing, and platform margin exposure.'}
            {role === 'reseller' && 'Reseller Mode — Exclusive partner wholesale pricing and profit margin calculations.'}
            {role === 'customer' && 'Discover premium SaaS tools, digital licenses, and managed recurring infrastructure.'}
          </p>
        </div>
      </div>

      {/* Recommended Items Carousel / Grid */}
      {recProducts.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Recommended For Your Business
            </h2>
            <span className="text-xs font-semibold text-slate-400">Featured Curated Selection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recProducts.map((p: any) => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-all">
                <div className="text-xs text-indigo-600 font-semibold mb-1">{p.category?.name || 'Featured'}</div>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">{p.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.short_description}</p>
                <PriceDisplay pricing={p.pricing} role={role} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search, Filter, Sort, and Comparison Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search digital products, licenses & services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {(['all', 'products', 'services'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${
                  tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="popular">Sort: Popularity</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Listings */}
      {loadingProducts || loadingServices ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Products Section */}
          {(tab === 'all' || tab === 'products') && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" /> Products Catalog ({products.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(p => {
                  const inWishlist = wishlistIds.has(p.id);
                  const isCompared = comparedItems.some(i => i.id === p.id);

                  return (
                    <div
                      key={p.id}
                      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-slate-200 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                          {p.images?.[0] ? (
                            <img src={p.images[0].path} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-slate-300" />
                            </div>
                          )}

                          {/* Wishlist Button */}
                          <button
                            type="button"
                            onClick={() => wishlistMutation.mutate({ product_id: p.id })}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                          </button>
                        </div>

                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-indigo-600 font-semibold">{p.category?.name || 'Digital'}</span>
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-current" /> 4.9
                            </span>
                          </div>

                          <Link to={`/products/${p.slug}`} className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors block">
                            {p.name}
                          </Link>

                          <p className="text-xs text-slate-500 line-clamp-2">{p.short_description}</p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-3">
                        <PriceDisplay pricing={p.pricing} role={role} />

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <Link
                            to={`/products/${p.slug}`}
                            className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                          >
                            View Item
                          </Link>

                          <button
                            type="button"
                            onClick={() => toggleCompare(p)}
                            className={`p-2 rounded-xl border transition-colors ${
                              isCompared ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-400 hover:text-slate-600'
                            }`}
                            title="Compare Product"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Services Section */}
          {(tab === 'all' || tab === 'services') && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-violet-600" /> Recurring Services ({services.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {services.map(s => {
                  const mainPlan = s.plans?.[0];
                  return (
                    <div
                      key={s.id}
                      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-slate-200 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {s.icon && (s.icon.startsWith('http') || s.icon.startsWith('/')) ? (
                          <div className="aspect-video bg-slate-100 relative overflow-hidden">
                            <img src={s.icon || undefined} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        ) : null}

                        <div className="p-5 space-y-3">
                          {(!s.icon || (!s.icon.startsWith('http') && !s.icon.startsWith('/'))) && (
                            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                              <Server className="w-5 h-5 text-violet-600" />
                            </div>
                          )}

                          <div>
                            <div className="text-xs font-semibold text-violet-600 mb-1">{s.category?.name || 'Cloud Service'}</div>
                            <Link to={`/services/${s.slug}`} className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-violet-600 transition-colors block">
                              {s.name}
                            </Link>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2">{s.short_description}</p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 border-t border-slate-100 space-y-3">
                        {mainPlan && <PriceDisplay pricing={mainPlan.pricing} role={role} />}
                        <Link
                          to={`/services/${s.slug}`}
                          className="block text-center bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                        >
                          View Subscription Plans
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Comparison Drawer */}
      {comparedItems.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50">
          <div className="text-xs font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Comparing ({comparedItems.length}/3)
          </div>

          <div className="flex items-center gap-2">
            {comparedItems.map(item => (
              <span key={item.id} className="bg-slate-800 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                {item.name}
                <X className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" onClick={() => toggleCompare(item)} />
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setComparedItems([])}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
