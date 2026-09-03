import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, X, Eye, RefreshCw,
  ShoppingBag, Calendar, Clock, CreditCard
} from 'lucide-react';
import { adminApi } from '../../api';
import type { Order } from '../../types';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  payment_processing: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  refunded: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', search, statusFilter],
    queryFn: () => adminApi.orders({ search, status: statusFilter, per_page: 50 }).then(r => r.data),
  });

  const orders: Order[] = data?.data ?? [];

  // Metrics
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'payment_processing').length;
  const totalGrossVolume = orders.reduce((acc, o) => acc + Number(o.total_amount ?? o.grand_total ?? 0), 0);

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateOrderStatus(id, status),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setSelectedOrder(res.data?.data);
      setSuccessMsg('Order status updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  // Refund Mutation
  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.refundOrder(id, reason),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setSelectedOrder(res.data?.data);
      setSuccessMsg('Order marked as refunded!');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-indigo-600" />
            Orders Ledger & Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System-wide multi-tenant order transactions, fulfillment, and refund tracking.
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
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
            <div className="text-xs text-slate-500 font-medium">Completed / Paid</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{completedOrders}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Pending Orders</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{pendingOrders}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Gross Volume</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{totalGrossVolume.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number or customer name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-2xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading orders ledger...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No orders recorded</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Transactions processed across resellers and customers will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Order Reference</th>
                  <th className="px-4 py-3.5">Customer / Tenant</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Payment Method</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map(o => {
                  const customer = (o as any).customer;
                  const org = (o as any).organization;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-indigo-600 text-xs">
                          {o.order_number}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {o.items?.length || 1} line item(s)
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{customer?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{customer?.email || '—'}</div>
                        {org && <div className="text-[10px] text-indigo-600 font-semibold">Tenant: {org.name}</div>}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{Number(o.total_amount ?? o.grand_total ?? 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="capitalize font-semibold text-slate-700">
                          {o.payment_method || 'Wallet / Gateway'}
                        </span>
                        <div className="text-[10px] text-slate-400 capitalize">
                          Paid: {o.payment_status}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          <span className="capitalize">{o.status}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(o.placed_at || o.created_at || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">{selectedOrder.order_number}</h2>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[selectedOrder.status]}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Order ID: {selectedOrder.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800">Order Line Items</span>
              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden text-xs">
                {(selectedOrder.items && selectedOrder.items.length > 0) ? (
                  selectedOrder.items.map((it: any) => (
                    <div key={it.id} className="p-3 flex items-center justify-between bg-white">
                      <div>
                        <div className="font-bold text-slate-900">{it.name || 'Catalog Item'}</div>
                        <div className="text-[11px] text-slate-400">Qty: {it.quantity} × ₹{it.unit_price}</div>
                      </div>
                      <div className="font-bold text-slate-900">
                        ₹{(it.quantity * it.unit_price).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-slate-500">Total Purchase: ₹{Number(selectedOrder.total_amount ?? selectedOrder.grand_total ?? 0).toFixed(2)}</div>
                )}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>₹{Number(selectedOrder.subtotal ?? selectedOrder.total_amount ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax:</span>
                <span>₹{Number(selectedOrder.tax_total ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>₹{Number(selectedOrder.total_amount ?? selectedOrder.grand_total ?? 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex gap-2">
                {selectedOrder.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'completed' })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl"
                  >
                    Mark Completed
                  </button>
                )}
                {selectedOrder.status !== 'refunded' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Issue a refund for this order?')) {
                        refundMutation.mutate({ id: selectedOrder.id });
                      }
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl"
                  >
                    Refund Order
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
