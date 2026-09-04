import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package, Search, ShoppingBag, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, Eye, ExternalLink, X, Calendar, Clock,
  User, Tag, ArrowUpRight, Plus, FileText
} from 'lucide-react';
import { resellerApi } from '../../api';
import FulfillmentCard from '../../components/fulfillment/FulfillmentCard';
import ResellerManualOrderModal from '../../components/reseller/ResellerManualOrderModal';
import TaxInvoiceModal from '../../components/common/TaxInvoiceModal';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function ResellerOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reseller', 'orders', search, statusFilter],
    queryFn: () => resellerApi.orders({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const orders: any[] = data?.data ?? [];

  // Metrics Calculation
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount ?? o.grand_total ?? 0), 0);
  const totalWholesaleCost = orders.reduce((sum, o) => {
    const cost = o.items?.reduce((iSum: number, item: any) => iSum + (Number(item.reseller_price_at_purchase ?? item.cost_price_at_purchase ?? 0) * (item.quantity || 1)), 0) || 0;
    return sum + (cost > 0 ? cost : Number(o.total_amount ?? 0) * 0.85);
  }, 0);
  const netProfit = Math.max(0, totalRevenue - totalWholesaleCost);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-600" />
            Orders Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track customer orders, digital license provisioning, and reseller profit splits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowManualOrderModal(true)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Client Order</span>
          </button>
          <Link
            to="/reseller/marketplace"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Marketplace</span>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Orders</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalOrders}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Customer Retail Sales</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Wholesale Cost</div>
            <div className="text-xl font-bold text-slate-700 mt-1">₹{Math.round(totalWholesaleCost).toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Your Realized Profit</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">+₹{Math.round(netProfit).toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders by order number, customer name or items…"
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

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid & Provisioned</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
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
            { label: 'Paid & Provisioned', val: 'paid' },
            { label: 'Processing', val: 'processing' },
            { label: 'Pending', val: 'pending' },
            { label: 'Completed', val: 'completed' },
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

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No orders found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Place orders from the Marketplace catalog on behalf of your customers.
            </p>
            <Link
              to="/reseller"
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Browse Catalog & Order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Order Number</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Retail Price</th>
                  <th className="px-4 py-3.5">Your Profit</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map(o => {
                  const itemsCount = o.items?.length || 1;
                  const retailAmount = Number(o.total_amount ?? o.grand_total ?? 0);
                  const cost = o.items?.reduce((iSum: number, item: any) => iSum + (Number(item.reseller_price_at_purchase ?? item.cost_price_at_purchase ?? 0) * (item.quantity || 1)), 0) || (retailAmount * 0.85);
                  const orderProfit = Math.max(0, retailAmount - cost);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-indigo-600 text-sm">
                          {o.order_number || o.id.substring(0, 8)}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {o.payment_method || 'Prepaid Wallet'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{o.customer?.name || 'Retail Client'}</div>
                        <div className="text-[11px] text-slate-400">{o.customer?.email || 'Direct Checkout'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{itemsCount} Item(s)</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">
                          {o.items?.map((i: any) => i.name || 'Catalog Item').join(', ') || 'Cloud License'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900 text-sm">
                        ₹{retailAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-emerald-600 text-xs">
                        +₹{Math.round(orderProfit).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[o.status || 'paid'] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          <span className="capitalize">{o.status || 'paid'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(o.placed_at || o.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                            title="View & Print Tax Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <span className="text-[10px] font-bold uppercase text-slate-400">Order Invoice Summary</span>
                <h3 className="font-mono font-bold text-slate-900 text-base">
                  {selectedOrder.order_number || selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer info */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="font-bold text-slate-800">Customer Details</div>
              <div className="text-slate-600">{selectedOrder.customer?.name || 'Retail Client'} • {selectedOrder.customer?.email || 'N/A'}</div>
              <div className="text-slate-500 text-[11px]">Placed on: {new Date(selectedOrder.placed_at || selectedOrder.created_at || Date.now()).toLocaleString('en-IN')}</div>
            </div>

            {/* Order Items with Fulfillment Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Provisioned Licenses & Assets ({selectedOrder.items?.length || 1}):</span>
                <span className="text-[10px] text-indigo-600 font-semibold">Active credentials & license keys for client</span>
              </div>

              {(selectedOrder.items && selectedOrder.items.length > 0) ? (
                selectedOrder.items.map((it: any) => (
                  <div key={it.id || it.name} className="space-y-2">
                    <FulfillmentCard item={it} />
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-center">
                  Total Order Value: ₹{Number(selectedOrder.total_amount ?? 0).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Customer Paid:</span>
                <span className="font-bold text-slate-900">₹{Number(selectedOrder.total_amount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-slate-800 capitalize">{selectedOrder.payment_method || 'Prepaid Wallet'}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-indigo-100">
                <span>Your Reseller Profit:</span>
                <span>+₹{Math.round(Number(selectedOrder.total_amount ?? 0) * 0.15).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInvoiceOrder(selectedOrder)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                <FileText className="w-4 h-4" />
                <span>Tax Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs text-xs cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Client Order Modal */}
      <ResellerManualOrderModal
        isOpen={showManualOrderModal}
        onClose={() => setShowManualOrderModal(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['reseller', 'orders'] });
          setSuccessMsg('Client order created and fulfilled successfully!');
          setTimeout(() => setSuccessMsg(''), 5000);
        }}
      />

      {/* Printable Tax Invoice Modal */}
      <TaxInvoiceModal
        invoice={invoiceOrder}
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
}
