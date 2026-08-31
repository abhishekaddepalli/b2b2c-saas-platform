import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Package, Search, ShoppingBag, TrendingUp } from 'lucide-react';
import { resellerApi } from '../../api';
import type { Product } from '../../types';

export default function ResellerServices() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reseller', 'services', search],
    queryFn: () => resellerApi.services({ search, per_page: 25 }).then(r => r.data),
  });

  const products: Product[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wholesale Services Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">Browse products and services available at your wholesale reseller price</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search wholesale catalog…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Package className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No wholesale services available right now</p>
          </div>
        ) : (
          products.map(p => {
            const pricing = p.pricing as any;
            const yourPrice = pricing?.your_price ?? pricing?.reseller_price ?? 0;
            const customerPrice = pricing?.customer_price ?? 0;
            const profit = pricing?.your_profit ?? (customerPrice - yourPrice);

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                      {p.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{p.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{p.short_description || 'High demand SaaS product ready for reselling.'}</p>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center bg-slate-50 rounded-xl p-2.5">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Your Price</div>
                      <div className="text-xs font-bold text-violet-700 mt-0.5">₹{yourPrice}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">MSRP</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">₹{customerPrice}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Your Profit</div>
                      <div className="text-xs font-bold text-emerald-600 mt-0.5">₹{profit}</div>
                    </div>
                  </div>

                  <a
                    href={`/app/marketplace`}
                    className="w-full bg-violet-600 text-white text-xs font-medium py-2 rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Order Wholesale
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
