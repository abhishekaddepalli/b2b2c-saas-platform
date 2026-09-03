import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Save, CheckCircle, ShieldCheck, CreditCard,
  Building2, Palette, Globe, Layers, Key, Loader2,
  IndianRupee, Sparkles, AlertCircle, RefreshCw, Bell,
  Mail, MessageSquare, Send, Bot, Cpu, Cloud, Radio,
  Webhook, Zap, ShieldAlert
} from 'lucide-react';
import { adminApi } from '../../api';

export default function AdminSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'gateways' | 'branding' | 'general' | 'resellers' | 'alerts' | 'integrations'>('gateways');
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

    // Alerts & Notification Rules
    alert_email_enabled: true,
    alert_email_recipient: 'abhishek123.as42@gmail.com',
    alert_low_wallet_threshold: 1000,
    alert_on_new_order: true,
    alert_on_failed_payment: true,
    alert_on_new_reseller: true,
    alert_on_system_error: true,

    // SMTP Configuration
    enable_smtp: false,
    smtp_host: 'smtp.mailgun.org',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    smtp_from_address: 'notifications@infiniforge.cloud',
    smtp_from_name: 'SaaS Platform Alerts',

    // Instant Messaging Channels
    enable_whatsapp: false,
    whatsapp_phone_number_id: '',
    whatsapp_access_token: '',
    enable_telegram: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    enable_slack: false,
    slack_webhook_url: '',

    // Ecosystem & 3rd-Party Integrations
    enable_openai: false,
    openai_api_key: '',
    openai_model: 'gpt-4o-mini',
    enable_ga4: false,
    ga4_measurement_id: '',
    enable_sentry: false,
    sentry_dsn: '',
    enable_cloudflare: false,
    cloudflare_zone_id: '',
    cloudflare_api_token: '',
    enable_google_oauth: false,
    google_client_id: '',
    google_client_secret: '',
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
          { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
          { id: 'integrations', label: 'Ecosystem & AI Integrations', icon: Zap },
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

          {/* TAB 5: ALERTS & NOTIFICATIONS */}
          {activeTab === 'alerts' && (
            <div className="space-y-5 text-xs">
              {/* Alert Triggers Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Real-Time Platform Alert Triggers</h3>
                    <p className="text-slate-500 text-[11px]">Specify administrative email targets and threshold alerts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary Notification Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={form.alert_email_recipient}
                        onChange={e => updateField('alert_email_recipient', e.target.value)}
                        placeholder="admin@yourdomain.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Low Reseller Wallet Alert Threshold (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min="100"
                        value={form.alert_low_wallet_threshold}
                        onChange={e => updateField('alert_low_wallet_threshold', parseFloat(e.target.value) || 0)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-amber-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={form.alert_on_new_order}
                      onChange={e => updateField('alert_on_new_order', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800 text-[11px]">New Order & Checkout</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={form.alert_on_failed_payment}
                      onChange={e => updateField('alert_on_failed_payment', e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="font-semibold text-slate-800 text-[11px]">Failed Payment Alerts</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={form.alert_on_new_reseller}
                      onChange={e => updateField('alert_on_new_reseller', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800 text-[11px]">New Reseller Registration</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={form.alert_on_system_error}
                      onChange={e => updateField('alert_on_system_error', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800 text-[11px]">Server / Runtime Exceptions</span>
                  </label>
                </div>
              </div>

              {/* SMTP Gateway Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">SMTP Email Dispatch Server</h3>
                      <p className="text-slate-500 text-[11px]">Outgoing mail relay for verification, order receipts, and admin pings.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_smtp}
                      onChange={e => updateField('enable_smtp', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={form.smtp_host}
                      onChange={e => updateField('smtp_host', e.target.value)}
                      placeholder="smtp.mailgun.org"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SMTP Port</label>
                    <input
                      type="number"
                      value={form.smtp_port}
                      onChange={e => updateField('smtp_port', parseInt(e.target.value) || 587)}
                      placeholder="587"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Encryption</label>
                    <select
                      value={form.smtp_encryption}
                      onChange={e => updateField('smtp_encryption', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="null">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SMTP Username</label>
                    <input
                      type="text"
                      value={form.smtp_username}
                      onChange={e => updateField('smtp_username', e.target.value)}
                      placeholder="postmaster@yourdomain.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SMTP Password</label>
                    <input
                      type="password"
                      value={form.smtp_password}
                      onChange={e => updateField('smtp_password', e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">From Email Address</label>
                    <input
                      type="email"
                      value={form.smtp_from_address}
                      onChange={e => updateField('smtp_from_address', e.target.value)}
                      placeholder="notifications@infiniforge.cloud"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Chat & Webhook Alert Channels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* WhatsApp */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Business</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enable_whatsapp}
                      onChange={e => updateField('enable_whatsapp', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Phone Number ID</label>
                    <input
                      type="text"
                      value={form.whatsapp_phone_number_id}
                      onChange={e => updateField('whatsapp_phone_number_id', e.target.value)}
                      placeholder="1098234857234"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Permanent Access Token</label>
                    <input
                      type="password"
                      value={form.whatsapp_access_token}
                      onChange={e => updateField('whatsapp_access_token', e.target.value)}
                      placeholder="EAAG..."
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sky-600 font-bold">
                      <Send className="w-4 h-4" />
                      <span>Telegram Admin Bot</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enable_telegram}
                      onChange={e => updateField('enable_telegram', e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Bot API Token</label>
                    <input
                      type="password"
                      value={form.telegram_bot_token}
                      onChange={e => updateField('telegram_bot_token', e.target.value)}
                      placeholder="123456:ABC-DEF..."
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Target Chat / Group ID</label>
                    <input
                      type="text"
                      value={form.telegram_chat_id}
                      onChange={e => updateField('telegram_chat_id', e.target.value)}
                      placeholder="-10012345678"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Slack */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-600 font-bold">
                      <Webhook className="w-4 h-4" />
                      <span>Slack Incoming Webhook</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enable_slack}
                      onChange={e => updateField('enable_slack', e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Webhook Endpoint URL</label>
                    <input
                      type="password"
                      value={form.slack_webhook_url}
                      onChange={e => updateField('slack_webhook_url', e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Streams live orders and high-priority wallet adjustments to your internal ops channel.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ECOSYSTEM & AI INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-5 text-xs">
              {/* OpenAI / AI Automation */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        OpenAI & Generative AI Engine
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">Smart SaaS</span>
                      </h3>
                      <p className="text-slate-500 text-[11px]">Powers automatic product descriptions, margin intelligence, and customer service bots.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_openai}
                      onChange={e => updateField('enable_openai', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">OpenAI API Secret Key</label>
                    <input
                      type="password"
                      value={form.openai_api_key}
                      onChange={e => updateField('openai_api_key', e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">AI Model Engine</label>
                    <select
                      value={form.openai_model}
                      onChange={e => updateField('openai_model', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-Efficient)</option>
                      <option value="gpt-4o">GPT-4o (State-of-the-Art Reasoning)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cloudflare & Edge Protection */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Cloudflare DNS & Edge Cache</h3>
                      <p className="text-slate-500 text-[11px]">Instant automated edge cache purging and DDoS sync across custom reseller domains.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_cloudflare}
                      onChange={e => updateField('enable_cloudflare', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Zone ID</label>
                    <input
                      type="text"
                      value={form.cloudflare_zone_id}
                      onChange={e => updateField('cloudflare_zone_id', e.target.value)}
                      placeholder="e.g. 023e105f4ecef8ad9ca31a8372d0c353"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">API Bearer Token</label>
                    <input
                      type="password"
                      value={form.cloudflare_api_token}
                      onChange={e => updateField('cloudflare_api_token', e.target.value)}
                      placeholder="Cloudflare API Token with Cache Purge permissions"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Google Ecosystem: Analytics & OAuth SSO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* GA4 */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Radio className="w-4 h-4 text-orange-500" />
                      <span>Google Analytics 4</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enable_ga4}
                      onChange={e => updateField('enable_ga4', e.target.checked)}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">GA4 Measurement ID</label>
                    <input
                      type="text"
                      value={form.ga4_measurement_id}
                      onChange={e => updateField('ga4_measurement_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Google SSO */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <span>Google OAuth 2.0 / SSO</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enable_google_oauth}
                      onChange={e => updateField('enable_google_oauth', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Client ID</label>
                    <input
                      type="text"
                      value={form.google_client_id}
                      onChange={e => updateField('google_client_id', e.target.value)}
                      placeholder="apps.googleusercontent.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sentry Monitoring */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Sentry Error & APM Telemetry</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.enable_sentry}
                    onChange={e => updateField('enable_sentry', e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Client DSN URL</label>
                  <input
                    type="password"
                    value={form.sentry_dsn}
                    onChange={e => updateField('sentry_dsn', e.target.value)}
                    placeholder="https://key@o0.ingest.sentry.io/0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
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
