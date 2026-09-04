import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X, ShoppingBag, Trash2, Plus, Minus, ArrowRight,
  ShieldCheck, Zap, Sparkles, CheckCircle2, Loader2,
  IndianRupee, Tag, User, CreditCard, Wallet, AlertCircle
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { resellerApi, ordersApi } from '../../api';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
    couponCode,
    applyCoupon,
    removeCoupon,
    couponDiscountPct,
  } = useCart();

  const { isAuthenticated, isReseller, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'gateway' | 'manual'>('wallet');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  // Fetch reseller customers if reseller
  const { data: customersData } = useQuery({
    queryKey: ['reseller', 'customers-dropdown'],
    queryFn: () => resellerApi.customers({ per_page: 50 }).then(r => r.data?.data ?? []),
    enabled: isReseller(),
  });

  // Fetch reseller wallet balance if reseller
  const { data: walletData } = useQuery({
    queryKey: ['reseller', 'wallet-balance'],
    queryFn: () => resellerApi.wallet().then(r => r.data?.data),
    enabled: isReseller(),
  });

  const customers: any[] = customersData ?? [];
  const walletBalance = Number(walletData?.available_balance ?? 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!inputCoupon.trim()) return;
    const success = applyCoupon(inputCoupon);
    if (success) {
      setInputCoupon('');
    } else {
      setCouponError('Invalid coupon code. Try LAUNCH20 for 20% off!');
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      closeCart();
      navigate('/login?redirect=/marketplace');
      return;
    }

    if (items.length === 0) return;

    try {
      setIsCheckingOut(true);
      const orderItemsPayload = items.map(item => ({
        product_id: item.type !== 'service' ? item.itemId : undefined,
        service_id: item.type === 'service' ? item.itemId : undefined,
        quantity: item.quantity,
        interval: item.interval,
        unit_price: item.price,
      }));

      if (isReseller()) {
        const payload: any = {
          items: orderItemsPayload,
          payment_method: paymentMethod,
        };
        if (selectedCustomerId) {
          payload.customer_id = selectedCustomerId;
        }
        await resellerApi.createOrder(payload);
        qc.invalidateQueries({ queryKey: ['reseller', 'orders'] });
        qc.invalidateQueries({ queryKey: ['reseller', 'wallet'] });
      } else {
        await ordersApi.create({
          items: orderItemsPayload,
          payment_method: paymentMethod,
        });
        qc.invalidateQueries({ queryKey: ['customer', 'orders'] });
      }

      setCheckoutSuccess(`Order placed successfully! ${itemCount} item(s) processed.`);
      clearCart();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Checkout failed. Please verify wallet balance or payment method.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  Shopping Cart
                  <span className="text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Enterprise checkout & instant provisioning</p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCart}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Screen */}
          {checkoutSuccess ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">Order Confirmed!</h3>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                {checkoutSuccess} Your licenses and provisioning records have been activated.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutSuccess(null);
                    closeCart();
                    if (isReseller()) navigate('/reseller/orders');
                    else navigate('/app/orders');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  View in Orders
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutSuccess(null);
                    closeCart();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/60 text-slate-500 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-white">Your Cart is Empty</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Browse our marketplace to explore products, software licenses, physical gear, and recurring cloud services.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate('/marketplace');
                }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Browse Marketplace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Cart Items List */
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex gap-3 hover:border-slate-700 transition-colors"
                >
                  {/* Thumbnail / Icon */}
                  <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={item.type === 'service' ? `/services/${item.slug}` : `/products/${item.slug}`}
                        onClick={closeCart}
                        className="text-xs font-bold text-white hover:text-indigo-400 line-clamp-1 transition-colors"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.type}
                      </span>
                      {item.interval && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                          {item.interval}
                        </span>
                      )}
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-slate-800 rounded-lg bg-slate-900 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-white">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="text-[10px] text-slate-500 line-through">
                            ₹{(item.originalPrice * item.quantity).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Coupon Code Section */}
              <div className="pt-2">
                {couponCode ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{couponCode} ({couponDiscountPct}% OFF applied)</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[10px] font-extrabold text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={inputCoupon}
                        onChange={e => setInputCoupon(e.target.value)}
                        placeholder="Coupon code (e.g. LAUNCH20)"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] text-rose-400">{couponError}</p>}
                  </form>
                )}
              </div>

              {/* Reseller Client Assignment (Only for Reseller) */}
              {isReseller() && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Assign Order to Customer:</span>
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Reseller Organization Inventory (Self)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email}) {c.company ? `— ${c.company}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Footer / Checkout */}
          {items.length > 0 && !checkoutSuccess && (
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 space-y-3.5">
              {/* Calculations */}
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-white font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({couponDiscountPct}%):</span>
                    <span>-₹{discountTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated GST (18%):</span>
                  <span className="text-white font-semibold">₹{taxTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                  <span>Grand Total:</span>
                  <span className="text-base text-emerald-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Method Picker */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {isReseller() ? (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === 'wallet'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <div className="text-[11px] leading-tight">Wallet Balance</div>
                      <div className="text-[10px] text-slate-400">₹{walletBalance.toLocaleString('en-IN')}</div>
                    </div>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setPaymentMethod('gateway')}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'gateway' || (!isReseller() && paymentMethod === 'wallet')
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  <div>
                    <div className="text-[11px] leading-tight">Pay Online / UPI</div>
                    <div className="text-[10px] text-slate-400">Cards, NetBanking</div>
                  </div>
                </button>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                )}
                <span>
                  {isAuthenticated
                    ? `Proceed to Pay ₹${grandTotal.toLocaleString('en-IN')}`
                    : 'Sign In & Checkout'}
                </span>
              </button>

              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
                <span>🔒 256-bit SSL Security</span>
                <span>•</span>
                <span>⚡ Instant Automated Delivery</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
