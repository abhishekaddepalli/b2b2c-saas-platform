import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package, Search, ShoppingBag, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, Eye, ExternalLink, X, FileText
} from 'lucide-react';
import { ordersApi } from '../../api';
import FulfillmentCard from '../../components/fulfillment/FulfillmentCard';
import TaxInvoiceModal from '../../components/common/TaxInvoiceModal';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function CustomerOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customer', 'orders', search, statusFilter],
    queryFn: () => ordersApi.list({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const orders: any[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-600" />
            My Orders & Purchases
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your purchased software licenses, keys, and receipts.
          </p>
        </div>

        <Link
          to="/app/marketplace"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0"
        >
          <ShoppingBag className="w-4 h-4" /> Browse Marketplace
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number or items…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <span className="text-xs text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 rounded-lg shrink-0">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
        </div>

        {/* Quick Filter Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Quick Filter:</span>
          {[
            { label: 'All', val: '' },
            { label: 'Paid & Active', val: 'paid' },
            { label: 'Completed', val: 'completed' },
            { label: 'Processing', val: 'processing' },
            { label: 'Pending', val: 'pending' },
            { label: 'Cancelled', val: 'cancelled' },
          ].map(pill => {
            const active = statusFilter === pill.val;
            return (
              <button
                key={pill.val}
                type="button"
                onClick={() => setStatusFilter(pill.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            );
          })}

          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 shrink-0 px-2 py-0.5"
            >
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading order history…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No orders placed yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't made any purchases. Explore tools and services in the Marketplace.
            </p>
            <Link
              to="/app/marketplace"
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Items Purchased</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                      {o.order_number || o.id.substring(0, 8)}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{o.items?.length || 1} Item(s)</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">
                        {o.items?.map((i: any) => i.name || 'Digital Item').join(', ') || 'Software License'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                      ₹{Number(o.total_amount ?? o.grand_total ?? 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[o.status || 'paid'] ?? 'bg-slate-100 text-slate-600'}`}>
                        <span className="capitalize">{o.status || 'paid'}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(o.placed_at || o.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvoiceOrder(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                          title="View & Print Tax Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Order Details</span>
                <h3 className="font-mono font-bold text-slate-900 text-base">
                  {selectedOrder.order_number || selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Purchased Products & Licenses ({selectedOrder.items?.length || 1}):</span>
                <span className="text-[10px] text-indigo-600 font-semibold">Instant Access & License Keys</span>
              </div>

              {(selectedOrder.items && selectedOrder.items.length > 0) ? (
                selectedOrder.items.map((it: any) => (
                  <div key={it.id || it.name} className="space-y-2">
                    <FulfillmentCard item={it} />
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-center">
                  Total Paid: ₹{Number(selectedOrder.total_amount ?? selectedOrder.grand_total ?? 0).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Total Paid:</span>
              <span className="text-base font-black text-slate-900">
                ₹{Number(selectedOrder.total_amount ?? selectedOrder.grand_total ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInvoiceOrder(selectedOrder)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                <FileText className="w-4 h-4" />
                <span>View Tax Invoice</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Tax Invoice Modal */}
      <TaxInvoiceModal
        invoice={invoiceOrder}
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
}
