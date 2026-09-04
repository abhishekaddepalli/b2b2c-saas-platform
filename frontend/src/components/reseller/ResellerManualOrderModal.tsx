import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, ShoppingBag, User, Package, Server,
  CheckCircle2, AlertCircle, Loader2, IndianRupee,
  Wallet, ShieldCheck, Plus, ArrowUpRight
} from 'lucide-react';
import { resellerApi, marketplaceApi } from '../../api';

interface ResellerManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResellerManualOrderModal({ isOpen, onClose, onSuccess }: ResellerManualOrderModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  const [catalogItemType, setCatalogItemType] = useState<'product' | 'service'>('product');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  const [wholesaleCost, setWholesaleCost] = useState(0);
  const [clientRetailPrice, setClientRetailPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'manual'>('wallet');
  const [clientNotes, setClientNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Customers
  const { data: customersData } = useQuery({
    queryKey: ['reseller', 'customers-modal'],
    queryFn: () => resellerApi.customers({ per_page: 50 }).then(r => r.data?.data ?? []),
    enabled: isOpen,
  });

  // Fetch Wallet Balance
  const { data: walletData } = useQuery({
    queryKey: ['reseller', 'wallet-modal'],
    queryFn: () => resellerApi.wallet().then(r => r.data?.data),
    enabled: isOpen,
  });

  // Fetch Products & Services
  const { data: productsData } = useQuery({
    queryKey: ['marketplace', 'products-reseller-modal'],
    queryFn: () => marketplaceApi.products({ per_page: 100 }).then(r => r.data?.data ?? []),
    enabled: isOpen,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['marketplace', 'services-reseller-modal'],
    queryFn: () => marketplaceApi.services({ per_page: 100 }).then(r => r.data?.data ?? []),
    enabled: isOpen,
  });

  const customers: any[] = customersData ?? [];
  const walletBalance = Number(walletData?.available_balance ?? 0);
  const products: any[] = productsData ?? [];
  const services: any[] = servicesData ?? [];

  if (!isOpen) return null;

  const handleSelectItem = (type: 'product' | 'service', id: string) => {
    setSelectedItemId(id);
    setCatalogItemType(type);

    if (type === 'product') {
      const p = products.find(prod => prod.id === id);
      if (p) {
        const retail = Number(p.pricing?.customer_price ?? p.retail_price ?? 999);
        const wholesale = Number(p.pricing?.your_price ?? p.reseller_price ?? Math.round(retail * 0.75));
        setWholesaleCost(wholesale);
        setClientRetailPrice(retail);
      }
    } else {
      const s = services.find(srv => srv.id === id);
      if (s) {
        const retail = Number(s.plans?.[0]?.price ?? s.price ?? 1999);
        const wholesale = Math.round(retail * 0.75);
        setWholesaleCost(wholesale);
        setClientRetailPrice(retail);
      }
    }
  };

  const totalWholesale = wholesaleCost * quantity;
  const totalRetail = clientRetailPrice * quantity;
  const totalProfit = Math.max(0, totalRetail - totalWholesale);
  const profitMarginPct = totalWholesale > 0 ? Math.round((totalProfit / totalWholesale) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedItemId) {
      setErrorMsg('Please select a product or service from the catalog.');
      return;
    }

    if (paymentMethod === 'wallet' && walletBalance < totalWholesale) {
      setErrorMsg(`Insufficient wallet balance. Required: ₹${totalWholesale.toLocaleString('en-IN')}, Available: ₹${walletBalance.toLocaleString('en-IN')}`);
      return;
    }

    try {
      setSubmitting(true);

      let customerId = selectedCustomerId;
      if (customerMode === 'new' && newCustomerEmail) {
        const res = await resellerApi.createCustomer({
          name: newCustomerName || newCustomerEmail.split('@')[0],
          email: newCustomerEmail,
        });
        customerId = res.data?.data?.id;
      }

      const payload: any = {
        items: [
          {
            product_id: catalogItemType === 'product' ? selectedItemId : undefined,
            service_id: catalogItemType === 'service' ? selectedItemId : undefined,
            quantity,
            interval: catalogItemType === 'service' ? interval : undefined,
            customer_price: clientRetailPrice,
            client_notes: clientNotes,
          }
        ],
        payment_method: paymentMethod,
        customer_id: customerId || undefined,
      };

      await resellerApi.createOrder(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to place client order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-violet-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Create Manual Client Order</h3>
              <p className="text-xs text-violet-300">Set custom client prices, calculate profit margins & debit wallet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-violet-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-violet-600" /> Bill & Assign to Client
              </span>
              <div className="flex text-[11px] font-semibold bg-slate-200 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-2 py-0.5 rounded-md ${customerMode === 'existing' ? 'bg-white text-violet-700 font-bold shadow-xs' : 'text-slate-600'}`}
                >
                  Existing Client
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-2 py-0.5 rounded-md ${customerMode === 'new' ? 'bg-white text-violet-700 font-bold shadow-xs' : 'text-slate-600'}`}
                >
                  + New Client
                </button>
              </div>
            </div>

            {customerMode === 'existing' ? (
              <div>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Reseller Organization Inventory (Self)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) {c.company ? `— ${c.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Client Full Name"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                />
                <input
                  type="email"
                  required
                  placeholder="Client Email Address"
                  value={newCustomerEmail}
                  onChange={e => setNewCustomerEmail(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Catalog Selection */}
          <div className="space-y-3">
            <label className="block font-bold text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-violet-600" /> Select Product or Service
            </label>
            <select
              value={selectedItemId ? `${catalogItemType}:${selectedItemId}` : ''}
              onChange={e => {
                const [t, id] = e.target.value.split(':');
                handleSelectItem(t as any, id);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold"
            >
              <option value="">-- Choose Item to Provision --</option>
              <optgroup label="Software & Products">
                {products.map(p => (
                  <option key={p.id} value={`product:${p.id}`}>
                    [Product] {p.name} — Wholesale Cost: ₹{p.pricing?.your_price ?? p.reseller_price ?? 749}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Recurring Cloud Services">
                {services.map(s => (
                  <option key={s.id} value={`service:${s.id}`}>
                    [Service] {s.name} — Wholesale Cost: ₹{Math.round((s.plans?.[0]?.price ?? 1999) * 0.75)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Quantity & Custom Pricing */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Unit Wholesale (Cost)</label>
              <div className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                ₹{wholesaleCost.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Client Bill Price (₹)</label>
              <input
                type="number"
                min={wholesaleCost}
                value={clientRetailPrice}
                onChange={e => setClientRetailPrice(parseFloat(e.target.value) || wholesaleCost)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-black text-indigo-600"
              />
            </div>
          </div>

          {/* Real-time Profit Card */}
          <div className="p-4 rounded-2xl bg-indigo-950 text-white space-y-2">
            <div className="flex justify-between text-indigo-300">
              <span>Total Wholesale Debit:</span>
              <span className="font-bold text-white">₹{totalWholesale.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Total Client Retail Invoice:</span>
              <span className="font-bold text-white">₹{totalRetail.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-indigo-900 text-emerald-400">
              <span>Net Reseller Profit:</span>
              <span className="flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>+₹{totalProfit.toLocaleString('en-IN')} ({profitMarginPct}% Margin)</span>
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800">Select Fulfillment Payment</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  paymentMethod === 'wallet'
                    ? 'border-violet-600 bg-violet-50 text-violet-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Wallet className="w-5 h-5 text-violet-600 shrink-0" />
                <div>
                  <div className="text-xs">Debit Reseller Wallet</div>
                  <div className="text-[10px] text-slate-500">Available: ₹{walletBalance.toLocaleString('en-IN')}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('manual')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  paymentMethod === 'manual'
                    ? 'border-violet-600 bg-violet-50 text-violet-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs">Client Paid Offline</div>
                  <div className="text-[10px] text-slate-500">Direct Wire / Cash</div>
                </div>
              </button>
            </div>
          </div>

          {/* Client Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Special Client Requirements / Notes</label>
            <input
              type="text"
              value={clientNotes}
              onChange={e => setClientNotes(e.target.value)}
              placeholder="e.g. Client needs 3 extra seats or specific branding"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Place Client Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
