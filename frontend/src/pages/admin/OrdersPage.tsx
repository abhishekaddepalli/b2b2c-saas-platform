import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Search, CheckCircle, ShieldAlert,
  Loader2, IndianRupee, X, Eye, RefreshCw,
  ShoppingBag, Calendar, Clock, CreditCard,
  Key, Edit3, Truck, Download, ShieldCheck, Globe, Sparkles,
  Plus, Trash2, Building2, Server, CheckSquare, Square, User, FileText
} from 'lucide-react';
import { adminApi } from '../../api';
import type { Order } from '../../types';
import FulfillmentCard from '../../components/fulfillment/FulfillmentCard';
import ManualOrderModal from '../../components/admin/ManualOrderModal';
import AssignOrderModal from '../../components/admin/AssignOrderModal';
import TaxInvoiceModal from '../../components/common/TaxInvoiceModal';

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
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<any | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [fulfillmentForm, setFulfillmentForm] = useState({
    license_key: '',
    software_url: '',
    login_portal_url: '',
    login_username: '',
    login_password: '',
    expires_at: '',
    validity_days: 365,
    access_instructions: '',
    courier: '',
    tracking_number: '',
    shipping_status: 'shipped',
    download_url: '',
    file_version: 'v1.0.0',
    admin_notes: '',
    live_preview_url: '',
  });

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

  // Fulfillment Update Mutation
  const updateFulfillmentMutation = useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: any }) =>
      adminApi.updateOrderFulfillment(orderId, payload),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setSelectedOrder(res.data?.data);
      setEditingItem(null);
      setSuccessMsg('Fulfillment details, credentials & license keys updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to update fulfillment details.');
    }
  });

  const openEditFulfillment = (item: any) => {
    setEditingItem(item);
    const meta = typeof item?.metadata === 'object' && item?.metadata !== null
      ? item.metadata
      : (typeof item?.metadata === 'string' ? JSON.parse(item.metadata || '{}') : {});
    setFulfillmentForm({
      license_key: meta.license_key || '',
      software_url: meta.software_url || '',
      login_portal_url: meta.login_portal_url || '',
      login_username: meta.login_username || '',
      login_password: meta.login_password || '',
      expires_at: meta.expires_at ? meta.expires_at.split('T')[0] : '',
      validity_days: meta.validity_days || 365,
      access_instructions: meta.access_instructions || '',
      courier: meta.courier || '',
      tracking_number: meta.tracking_number || '',
      shipping_status: meta.shipping_status || 'shipped',
      download_url: meta.download_url || '',
      file_version: meta.file_version || 'v1.0.0',
      admin_notes: meta.admin_notes || '',
      live_preview_url: meta.live_preview_url || '',
    });
  };

  const generateLicenseKey = () => {
    const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `${segment()}-${segment()}-${segment()}-${segment()}`;
    setFulfillmentForm(f => ({ ...f, license_key: newKey }));
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.size === orders.length && orders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(orders.map(o => o.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const updated = new Set(selectedOrderIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedOrderIds(updated);
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedOrderIds.size === 0) return;
    try {
      setIsBulkLoading(true);
      await adminApi.bulkOrders({ action: 'status', ids: Array.from(selectedOrderIds), status });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setSelectedOrderIds(new Set());
      setSuccessMsg(`Status updated to ${status} for selected orders.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Bulk update failed.');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedOrderIds.size} selected order(s)?`)) return;
    try {
      setIsBulkLoading(true);
      await adminApi.bulkOrders({ action: 'delete', ids: Array.from(selectedOrderIds) });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setSelectedOrderIds(new Set());
      setSuccessMsg(`Deleted selected orders successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Bulk delete failed.');
    } finally {
      setIsBulkLoading(false);
    }
  };

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

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Manual Order</span>
        </button>
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
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or items…"
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
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
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
            { label: 'Paid', val: 'paid' },
            { label: 'Completed', val: 'completed' },
            { label: 'Pending', val: 'pending' },
            { label: 'Refunded', val: 'refunded' },
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
                  <th className="w-10 px-3 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {selectedOrderIds.size === orders.length && orders.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
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
                  const isSelected = selectedOrderIds.has(o.id);

                  return (
                    <tr key={o.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/70'}`}>
                      <td className="w-10 px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(o.id)}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

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

                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setAssigningOrder(o)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Assign to Reseller Organization"
                        >
                          <Building2 className="w-3.5 h-3.5 text-violet-600" />
                          <span>Assign</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvoiceOrder(o)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="View & Print Tax Invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Invoice</span>
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

      {/* Floating Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 text-xs animate-in slide-in-from-bottom-4">
          <span className="font-bold bg-indigo-600 px-2.5 py-0.5 rounded-full text-[11px]">
            {selectedOrderIds.size} Selected
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Status:</span>
            {['completed', 'paid', 'processing', 'cancelled'].map(st => (
              <button
                key={st}
                type="button"
                disabled={isBulkLoading}
                onClick={() => handleBulkStatus(st)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-[11px] capitalize cursor-pointer transition-colors"
              >
                {st}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            type="button"
            disabled={isBulkLoading}
            onClick={handleBulkDelete}
            className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <ManualOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
          setSuccessMsg('Manual enterprise order created and provisioned successfully!');
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
      />

      {assigningOrder && (
        <AssignOrderModal
          order={assigningOrder}
          isOpen={!!assigningOrder}
          onClose={() => setAssigningOrder(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
            setAssigningOrder(null);
            setSuccessMsg('Order reassigned to organization successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);
          }}
        />
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto text-xs">
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

            {/* Line Items with Full Fulfillment Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Order Line Items & Provisioned Assets ({selectedOrder.items?.length || 1})
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  Click 'Edit Credentials / Keys' on any item to update
                </span>
              </div>

              {(selectedOrder.items && selectedOrder.items.length > 0) ? (
                selectedOrder.items.map((it: any) => (
                  <div key={it.id} className="space-y-2">
                    <FulfillmentCard
                      item={it}
                      isAdmin={true}
                      onEditClick={() => openEditFulfillment(it)}
                    />
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-500 text-center">
                  Total Purchase: ₹{Number(selectedOrder.total_amount ?? selectedOrder.grand_total ?? 0).toFixed(2)}
                </div>
              )}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FULFILLMENT & CREDENTIALS MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Fulfillment & Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update software keys, access credentials, shipping details, or download assets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedOrder) {
                  updateFulfillmentMutation.mutate({
                    orderId: selectedOrder.id,
                    payload: {
                      item_id: editingItem.id,
                      ...fulfillmentForm,
                    }
                  });
                }
              }}
              className="space-y-4"
            >
              {/* Product Info header */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{editingItem.name || 'Purchased Item'}</div>
                  <div className="text-[11px] text-slate-400">Item ID: {editingItem.id}</div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {editingItem.product_type || 'software_license'}
                </span>
              </div>

              {/* Software License Credentials Section */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-indigo-600" /> Software License & Portal Access
                  </span>
                  <button
                    type="button"
                    onClick={generateLicenseKey}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded-lg border border-indigo-200 shadow-2xs inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Gen Key
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">License Key (Unique Customer Key)</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCD-1234-EFGH-5678"
                    value={fulfillmentForm.license_key}
                    onChange={e => setFulfillmentForm(f => ({ ...f, license_key: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-indigo-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Software Download / App Link</label>
                    <input
                      type="url"
                      placeholder="https://download.software.com/installer.exe"
                      value={fulfillmentForm.software_url}
                      onChange={e => setFulfillmentForm(f => ({ ...f, software_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cloud / Login Portal URL</label>
                    <input
                      type="url"
                      placeholder="https://app.software.com/login"
                      value={fulfillmentForm.login_portal_url}
                      onChange={e => setFulfillmentForm(f => ({ ...f, login_portal_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Login Username / Email</label>
                    <input
                      type="text"
                      placeholder="e.g. client@example.com"
                      value={fulfillmentForm.login_username}
                      onChange={e => setFulfillmentForm(f => ({ ...f, login_username: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
                    <input
                      type="text"
                      placeholder="e.g. SecurePass#2026"
                      value={fulfillmentForm.login_password}
                      onChange={e => setFulfillmentForm(f => ({ ...f, login_password: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">License Expiration Date</label>
                    <input
                      type="date"
                      value={fulfillmentForm.expires_at}
                      onChange={e => setFulfillmentForm(f => ({ ...f, expires_at: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Validity Term (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={fulfillmentForm.validity_days}
                      onChange={e => setFulfillmentForm(f => ({ ...f, validity_days: parseInt(e.target.value) || 365 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Setup Instructions / Access Note</label>
                  <textarea
                    rows={2}
                    placeholder="Instructions for user on activation or license registration..."
                    value={fulfillmentForm.access_instructions}
                    onChange={e => setFulfillmentForm(f => ({ ...f, access_instructions: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Physical Delivery Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-600" /> Physical Shipment & Tracking (If Applicable)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Courier Partner</label>
                    <input
                      type="text"
                      placeholder="e.g. Blue Dart, Delhivery"
                      value={fulfillmentForm.courier}
                      onChange={e => setFulfillmentForm(f => ({ ...f, courier: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      placeholder="e.g. TRK-892348"
                      value={fulfillmentForm.tracking_number}
                      onChange={e => setFulfillmentForm(f => ({ ...f, tracking_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Shipping Status</label>
                    <select
                      value={fulfillmentForm.shipping_status}
                      onChange={e => setFulfillmentForm(f => ({ ...f, shipping_status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="pending">Pending Dispatch</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">In Transit (Shipped)</option>
                      <option value="out_for_delivery">Out For Delivery</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Digital Asset Download & Live Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Download Asset URL (Digital Files)</label>
                  <input
                    type="url"
                    placeholder="https://assets.mysite.com/release.zip"
                    value={fulfillmentForm.download_url}
                    onChange={e => setFulfillmentForm(f => ({ ...f, download_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Live Interactive Demo URL</label>
                  <input
                    type="url"
                    placeholder="https://demo.app.com"
                    value={fulfillmentForm.live_preview_url}
                    onChange={e => setFulfillmentForm(f => ({ ...f, live_preview_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateFulfillmentMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {updateFulfillmentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Save & Update Fulfillment
                </button>
              </div>
            </form>
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
