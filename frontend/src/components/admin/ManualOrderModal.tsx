import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, Plus, Trash2, ShoppingBag, User, Building2,
  Package, Server, CheckCircle2, AlertCircle, Loader2,
  IndianRupee, Tag, ShieldCheck, Key, Truck, Download
} from 'lucide-react';
import { adminApi } from '../../api';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItemRow {
  catalogType: 'product' | 'service';
  catalogId: string;
  name: string;
  sku: string;
  type: 'physical' | 'digital' | 'software' | 'license' | 'service';
  quantity: number;
  unit_price: number;
  cost_price: number;
  reseller_price: number;
}

export default function ManualOrderModal({ isOpen, onClose, onSuccess }: ManualOrderModalProps) {
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [orderStatus, setOrderStatus] = useState('completed');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Items State
  const [items, setItems] = useState<OrderItemRow[]>([
    {
      catalogType: 'product',
      catalogId: '',
      name: '',
      sku: '',
      type: 'license',
      quantity: 1,
      unit_price: 999,
      cost_price: 699,
      reseller_price: 849,
    }
  ]);

  // Queries
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users-dropdown'],
    queryFn: () => adminApi.users({ per_page: 100 }).then(r => r.data?.data ?? []),
    enabled: isOpen,
  });

  const { data: orgsData } = useQuery({
    queryKey: ['admin', 'organizations-dropdown'],
    queryFn: () => adminApi.organizations({ per_page: 100 }).then(r => r.data?.data ?? []),
    enabled: isOpen,
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin', 'products-dropdown'],
    queryFn: () => adminApi.products({ per_page: 100 }).then(r => r.data?.data ?? []),
    enabled: isOpen,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['admin', 'services-dropdown'],
    queryFn: () => adminApi.services({ per_page: 100 }).then(r => r.data?.data ?? []),
    enabled: isOpen,
  });

  const users: any[] = usersData ?? [];
  const organizations: any[] = orgsData ?? [];
  const products: any[] = productsData ?? [];
  const services: any[] = servicesData ?? [];

  if (!isOpen) return null;

  const handleSelectItem = (index: number, val: string) => {
    if (!val) return;
    const [catType, id] = val.split(':');
    const updated = [...items];

    if (catType === 'product') {
      const p = products.find(prod => prod.id === id);
      if (p) {
        updated[index] = {
          catalogType: 'product',
          catalogId: p.id,
          name: p.name,
          sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
          type: (p.type as any) || 'license',
          quantity: 1,
          unit_price: Number(p.customer_price ?? p.price ?? 999),
          cost_price: Number(p.cost_price ?? 699),
          reseller_price: Number(p.reseller_price ?? 849),
        };
      }
    } else {
      const s = services.find(srv => srv.id === id);
      if (s) {
        const sPrice = Number(s.plans?.[0]?.price ?? s.price ?? 1999);
        updated[index] = {
          catalogType: 'service',
          catalogId: s.id,
          name: s.name,
          sku: `SRV-${s.id.slice(0, 6)}`,
          type: 'service',
          quantity: 1,
          unit_price: sPrice,
          cost_price: Math.round(sPrice * 0.5),
          reseller_price: Math.round(sPrice * 0.75),
        };
      }
    }
    setItems(updated);
  };

  const handleUpdateItemField = (index: number, field: keyof OrderItemRow, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        catalogType: 'product',
        catalogId: '',
        name: '',
        sku: '',
        type: 'license',
        quantity: 1,
        unit_price: 999,
        cost_price: 699,
        reseller_price: 849,
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.unit_price || 0) * (it.quantity || 1)), 0);
  const taxTotal = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + taxTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (items.some(it => !it.name.trim())) {
      setErrorMsg('Please ensure all items have a valid name.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        organization_id: selectedOrgId || undefined,
        status: orderStatus,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        admin_notes: adminNotes,
        items: items.map(it => ({
          product_id: it.catalogType === 'product' && it.catalogId ? it.catalogId : undefined,
          service_id: it.catalogType === 'service' && it.catalogId ? it.catalogId : undefined,
          name: it.name,
          sku: it.sku,
          type: it.type,
          quantity: it.quantity,
          unit_price: it.unit_price,
          cost_price: it.cost_price,
          reseller_price: it.reseller_price,
        })),
      };

      if (customerMode === 'existing') {
        payload.customer_id = selectedCustomerId || undefined;
      } else {
        payload.new_customer_name = newCustomerName;
        payload.new_customer_email = newCustomerEmail;
      }

      await adminApi.createOrder(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to create manual order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Create Manual Enterprise Order</h3>
              <p className="text-xs text-slate-400">Direct contract provisioning, custom pricing & reseller assignment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer & Reseller Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" /> Customer Account
                </span>
                <div className="flex text-[11px] font-semibold bg-slate-200 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-2 py-0.5 rounded-md ${customerMode === 'existing' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600'}`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-2 py-0.5 rounded-md ${customerMode === 'new' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600'}`}
                  >
                    + New
                  </button>
                </div>
              </div>

              {customerMode === 'existing' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Select Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Platform Default / System Admin</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      value={newCustomerName}
                      onChange={e => setNewCustomerName(e.target.value)}
                      placeholder="e.g. Aditi Sharma"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer Email</label>
                    <input
                      type="email"
                      required
                      value={newCustomerEmail}
                      onChange={e => setNewCustomerEmail(e.target.value)}
                      placeholder="aditi@example.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Reseller Assignment */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-violet-600" /> Reseller Assignment
              </span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assign to Organization</label>
                <select
                  value={selectedOrgId}
                  onChange={e => setSelectedOrgId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Direct Platform HQ (No Reseller)</option>
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.type || 'reseller'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Assigning to a reseller calculates automated profit splits and credits their ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Order Items Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-600" /> Order Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Quick Pick Catalog Item</label>
                      <select
                        onChange={e => handleSelectItem(idx, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="">-- Choose from Catalog or Enter Custom Below --</option>
                        <optgroup label="Products">
                          {products.map(p => (
                            <option key={p.id} value={`product:${p.id}`}>
                              [Product] {p.name} (₹{p.customer_price ?? p.price ?? 999})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Services">
                          {services.map(s => (
                            <option key={s.id} value={`service:${s.id}`}>
                              [Service] {s.name} (₹{s.plans?.[0]?.price ?? s.price ?? 1999})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer mt-3"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Item Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Item Name</label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={e => handleUpdateItemField(idx, 'name', e.target.value)}
                        placeholder="e.g. Enterprise License"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">SKU Code</label>
                      <input
                        type="text"
                        value={item.sku}
                        onChange={e => handleUpdateItemField(idx, 'sku', e.target.value)}
                        placeholder="SKU-123"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Classification</label>
                      <select
                        value={item.type}
                        onChange={e => handleUpdateItemField(idx, 'type', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="license">Software License</option>
                        <option value="physical">Physical Product</option>
                        <option value="digital">Digital Download</option>
                        <option value="service">Cloud Service</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => handleUpdateItemField(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Retail Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={item.unit_price}
                        onChange={e => handleUpdateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Reseller Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={item.reseller_price}
                        onChange={e => handleUpdateItemField(idx, 'reseller_price', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Cost Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={item.cost_price}
                        onChange={e => handleUpdateItemField(idx, 'cost_price', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Status & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Order Status</label>
              <select
                value={orderStatus}
                onChange={e => setOrderStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
              >
                <option value="completed">Completed & Provisioned</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid / Invoiced</option>
                <option value="partially_paid">Partially Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
              >
                <option value="manual">Manual Bank Wire / Offline</option>
                <option value="wallet">Reseller Wallet Debit</option>
                <option value="gateway">Online Payment Gateway</option>
                <option value="cash">Direct Cash</option>
              </select>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Internal Order Notes</label>
            <input
              type="text"
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="e.g. Enterprise SLA agreement signed on 04 Sept 2026."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          {/* Price Calculation Summary */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="text-white font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated GST (18%):</span>
              <span className="text-white font-bold">₹{taxTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="text-emerald-400 text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Create Order & Provision</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
