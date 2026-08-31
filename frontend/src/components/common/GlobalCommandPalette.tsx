import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, User, Building2, Package, ScrollText, FileText, CreditCard, X, Loader2, Command } from 'lucide-react';
import { adminApi } from '../../api';

export default function GlobalCommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['admin', 'global-search', query],
    queryFn: () => adminApi.globalSearch(query).then(r => r.data?.data),
    enabled: isOpen && query.trim().length >= 2,
  });

  if (!isOpen) return null;

  const results = searchResults ?? { users: [], resellers: [], products: [], orders: [], invoices: [], subscriptions: [] };
  const hasResults =
    results.users.length > 0 ||
    results.resellers.length > 0 ||
    results.products.length > 0 ||
    results.orders.length > 0 ||
    results.invoices.length > 0 ||
    results.subscriptions.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search users, resellers, products, orders, invoices, subscriptions... (Ctrl+K)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-base font-medium text-slate-900 focus:outline-none placeholder:text-slate-400"
          />
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 shrink-0" />
          ) : (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {query.trim().length < 2 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              Type at least 2 characters to search across platform records...
            </div>
          ) : !hasResults && !isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {results.users.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" /> Users ({results.users.length})
                  </div>
                  <div className="space-y-1">
                    {results.users.map((u: any) => (
                      <Link
                        key={u.id}
                        to={`/admin/users`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-900 transition-colors"
                      >
                        <span>{u.name}</span>
                        <span className="text-xs font-normal text-slate-400">{u.email}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.resellers.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-violet-500" /> Resellers ({results.resellers.length})
                  </div>
                  <div className="space-y-1">
                    {results.resellers.map((r: any) => (
                      <Link
                        key={r.id}
                        to={`/admin/organizations`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-900 transition-colors"
                      >
                        <span>{r.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600">{r.status}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.products.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-500" /> Products ({results.products.length})
                  </div>
                  <div className="space-y-1">
                    {results.products.map((p: any) => (
                      <Link
                        key={p.id}
                        to={`/admin/products`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-900 transition-colors"
                      >
                        <span>{p.name}</span>
                        <span className="text-xs font-normal text-slate-400 capitalize">{p.type}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.orders.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ScrollText className="w-3.5 h-3.5 text-amber-500" /> Orders ({results.orders.length})
                  </div>
                  <div className="space-y-1">
                    {results.orders.map((o: any) => (
                      <Link
                        key={o.id}
                        to={`/admin/orders`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-900 transition-colors"
                      >
                        <span>{o.order_number}</span>
                        <span className="text-xs font-bold text-indigo-600">₹{o.grand_total}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
