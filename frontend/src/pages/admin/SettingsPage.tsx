import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Save, CheckCircle, ShieldCheck, CreditCard,
  Building2, Palette, Globe, Layers, Key, Loader2,
  DollarSign, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';
import { adminApi } from '../../api';

export default function AdminSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'gateways' | 'branding' | 'general' | 'resellers'>('gateways');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.settings().then(r => r.data),
  });

  const [form, setForm] = useState<any>({
    platform_name: 'B2B2C Enterprise SaaS Platform',
    brand_title: 'Resell Cloud HQ',
    support_email: 'support@infiniforge.cloud',
    support_phone: '+91 9876543210',
    currency: 'INR',
    default_tax_rate: 18,
    primary_color: '#6366f1',
    accent_color: '#8b5cf6',
    logo_url: '',
    favicon_url: '',
    custom_domain: 'resell.infiniforge.cloud',

    enable_whitelabel_reseller: true,
    auto_approve_resellers: true,
    default_reseller_margin: 15,
    min_wallet_recharge: 500,
    max_credit_limit: 50000,

    enable_razorpay: true,
    razorpay_key_id: '',
    razorpay_key_secret: '',
    razorpay_webhook_secret: '',
    razorpay_mode: 'live',

    enable_stripe: true,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    stripe_mode: 'live',

    enable_phonepe: false,
    phonepe_merchant_id: '',
    phonepe_salt_key: '',
    phonepe_salt_index: '1',
    phonepe_mode: 'sandbox',

    enable_cashfree: false,
    cashfree_app_id: '',
    cashfree_secret_key: '',
    cashfree_mode: 'sandbox',

    enable_bank_transfer: true,
    bank_name: 'HDFC Bank',
    bank_account_name: 'Infiniforge Cloud Solutions',
    bank_account_number: '50200012345678',
    bank_ifsc: 'HDFC0001234',
    bank_branch: 'Corporate Banking Branch',
  });

  useEffect(() => {
    if (data?.data) {
      setForm((prev: any) => ({ ...prev, ...data.data }));
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => adminApi.updateSettings(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setSuccessMsg('Platform settings and payment gateway configurations saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to save settings.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    updateMutation.mutate(form);
  };

  const updateField = (field: string, val: any) => {
    setForm((f: any) => ({ ...f, [field]: val }));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-indigo-600" />
            Platform & Payment Gateway Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure payment gateways, white-label branding, currency, and reseller business rules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all shrink-0 disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Settings
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2">
        {[
          { id: 'gateways', label: 'Payment Gateways', icon: CreditCard },
          { id: 'branding', label: 'White-Label Branding', icon: Palette },
          { id: 'general', label: 'General & Currency', icon: Globe },
          { id: 'resellers', label: 'Reseller Governance', icon: Building2 },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TAB 1: PAYMENT GATEWAYS */}
          {activeTab === 'gateways' && (
            <div className="space-y-5">
              {/* Razorpay Gateway */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                      RZP
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Razorpay Payment Gateway</h3>
                      <p className="text-[11px] text-slate-500">UPI, NetBanking, Credit/Debit Cards, QR Code (INR)</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_razorpay}
                      onChange={e => updateField('enable_razorpay', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {form.enable_razorpay && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Razorpay Key ID *</label>
                      <input
                        type="text"
                        placeholder="rzp_live_..."
                        value={form.razorpay_key_id}
                        onChange={e => updateField('razorpay_key_id', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Razorpay Key Secret *</label>
                      <input
                        type="password"
                        placeholder="Secret key"
                        value={form.razorpay_key_secret}
                        onChange={e => updateField('razorpay_key_secret', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Webhook Secret (Optional)</label>
                      <input
                        type="text"
                        placeholder="Webhook secret"
                        value={form.razorpay_webhook_secret}
                        onChange={e => updateField('razorpay_webhook_secret', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Gateway Environment</label>
                      <select
                        value={form.razorpay_mode}
                        onChange={e => updateField('razorpay_mode', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="live">Live Production</option>
                        <option value="test">Test Sandbox</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Stripe Gateway */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-black text-sm">
                      STR
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Stripe International Gateway</h3>
                      <p className="text-[11px] text-slate-500">Global Credit Cards, Apple Pay, Google Pay (Multi-Currency)</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_stripe}
                      onChange={e => updateField('enable_stripe', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {form.enable_stripe && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Stripe Publishable Key *</label>
                      <input
                        type="text"
                        placeholder="pk_live_..."
                        value={form.stripe_publishable_key}
                        onChange={e => updateField('stripe_publishable_key', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Stripe Secret Key *</label>
                      <input
                        type="password"
                        placeholder="sk_live_..."
                        value={form.stripe_secret_key}
                        onChange={e => updateField('stripe_secret_key', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Webhook Signing Secret</label>
                      <input
                        type="text"
                        placeholder="whsec_..."
                        value={form.stripe_webhook_secret}
                        onChange={e => updateField('stripe_webhook_secret', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Environment Mode</label>
                      <select
                        value={form.stripe_mode}
                        onChange={e => updateField('stripe_mode', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="live">Live Production</option>
                        <option value="test">Test Sandbox</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Bank Transfer Wire */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                      NEFT
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Bank Wire / IMPS / RTGS Settlement</h3>
                      <p className="text-[11px] text-slate-500">Manual offline bank deposit instructions for wallet recharge</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_bank_transfer}
                      onChange={e => updateField('enable_bank_transfer', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {form.enable_bank_transfer && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={form.bank_name}
                        onChange={e => updateField('bank_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={form.bank_account_name}
                        onChange={e => updateField('bank_account_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={form.bank_account_number}
                        onChange={e => updateField('bank_account_number', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">IFSC / Routing Code</label>
                      <input
                        type="text"
                        value={form.bank_ifsc}
                        onChange={e => updateField('bank_ifsc', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Branch Details</label>
                      <input
                        type="text"
                        value={form.bank_branch}
                        onChange={e => updateField('bank_branch', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING */}
          {activeTab === 'branding' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                Master Brand Identity & Theming
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Platform Brand Title</label>
                  <input
                    type="text"
                    value={form.brand_title}
                    onChange={e => updateField('brand_title', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custom Domain</label>
                  <input
                    type="text"
                    value={form.custom_domain}
                    onChange={e => updateField('custom_domain', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={e => updateField('primary_color', e.target.value)}
                      className="w-9 h-9 p-1 border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.primary_color}
                      onChange={e => updateField('primary_color', e.target.value)}
                      className="w-32 px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accent_color}
                      onChange={e => updateField('accent_color', e.target.value)}
                      className="w-9 h-9 p-1 border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.accent_color}
                      onChange={e => updateField('accent_color', e.target.value)}
                      className="w-32 px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERAL */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                General Operations & Currency
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Platform Name</label>
                  <input
                    type="text"
                    value={form.platform_name}
                    onChange={e => updateField('platform_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={form.support_email}
                    onChange={e => updateField('support_email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Support Phone</label>
                  <input
                    type="text"
                    value={form.support_phone}
                    onChange={e => updateField('support_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Platform Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => updateField('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESELLERS */}
          {activeTab === 'resellers' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                Reseller Network Rules & Governance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Reseller Margin %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.default_reseller_margin}
                    onChange={e => updateField('default_reseller_margin', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Wallet Recharge (₹)</label>
                  <input
                    type="number"
                    min="100"
                    value={form.min_wallet_recharge}
                    onChange={e => updateField('min_wallet_recharge', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum Allowed Credit Overdraft (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_credit_limit}
                    onChange={e => updateField('max_credit_limit', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_whitelabel_reseller}
                      onChange={e => updateField('enable_whitelabel_reseller', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800">Enable White-Labeling for Reseller Portals</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Platform Configuration
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
