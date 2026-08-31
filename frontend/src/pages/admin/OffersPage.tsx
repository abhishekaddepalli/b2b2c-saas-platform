import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Tag } from 'lucide-react';
import { adminApi } from '../../api';

export default function AdminOffers() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'offers'],
    queryFn: () => adminApi.offers().then(r => r.data),
  });

  const offers: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offers & Coupons</h1>
          <p className="text-sm text-slate-500 mt-0.5">Promotional discounts, coupons & advertisement banners</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No offers or coupons created yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Campaign Code', 'Type', 'Discount', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {offers.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-600">{o.code || o.name}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">{o.type || 'coupon'}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-900">{o.discount_amount ? `₹${o.discount_amount}` : `${o.discount_pct}%`}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      {o.status || 'active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
