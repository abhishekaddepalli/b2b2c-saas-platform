import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Save, CheckCircle, ShieldCheck, CreditCard,
  Building2, Palette, Globe, Layers, Key, Loader2,
  IndianRupee, Sparkles, AlertCircle, RefreshCw, Bell,
  Mail, MessageSquare, Send, Bot, Cpu, Cloud, Radio,
  Webhook, Zap, ShieldAlert, Lock, Copy, Check,
  ShoppingBag, Phone, Sliders, ExternalLink, ArrowRight
} from 'lucide-react';
import { adminApi } from '../../api';
import WooCommerceSyncModal from '../../components/integrations/WooCommerceSyncModal';

export default function AdminSettings() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'gateways' | 'woocommerce' | 'twilio' | 'support_chat' | 'auth_security' | 'alerts' | 'integrations' | 'branding' | 'general' | 'resellers'
  >('gateways');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // WooCommerce Sync Modal & Test state
  const [showWcSyncModal, setShowWcSyncModal] = useState(false);
  const [wcTesting, setWcTesting] = useState(false);
  const [wcTestFeedback, setWcTestFeedback] = useState<{ success: boolean; message: string; env?: any } | null>(null);

  // Twilio Test state
  const [twilioTesting, setTwilioTesting] = useState(false);
  const [twilioTestChannel, setTwilioTestChannel] = useState<'sms' | 'whatsapp'>('whatsapp');
  const [twilioTestRecipient, setTwilioTestRecipient] = useState('+919876543210');
  const [twilioTestMessage, setTwilioTestMessage] = useState('Hello from Infiniforge Cloud! Twilio integration is working! 🚀');
  const [twilioTestFeedback, setTwilioTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

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

    // Social Auth Integrations
    enable_google_oauth: true,
    google_client_id: '',
    google_client_secret: '',
    google_redirect_uri: 'https://resell.infiniforge.cloud/api/v1/auth/callback/google',

    enable_facebook_oauth: true,
    facebook_app_id: '',
    facebook_app_secret: '',
    facebook_redirect_uri: 'https://resell.infiniforge.cloud/api/v1/auth/callback/facebook',

    enable_github_oauth: true,
    github_client_id: '',
    github_client_secret: '',
    github_redirect_uri: 'https://resell.infiniforge.cloud/api/v1/auth/callback/github',

    enable_microsoft_oauth: false,
    microsoft_client_id: '',
    microsoft_client_secret: '',
    microsoft_tenant_id: 'common',
    microsoft_redirect_uri: 'https://resell.infiniforge.cloud/api/v1/auth/callback/microsoft',

    // Anti-Bot & CAPTCHA Shield
    enable_captcha: true,
    captcha_provider: 'turnstile',
    captcha_site_key: '',
    captcha_secret_key: '',
    captcha_on_login: true,
    captcha_on_register: true,
    captcha_on_forgot_password: true,

    // WooCommerce Integration
    enable_woocommerce: false,
    woocommerce_store_url: '',
    woocommerce_consumer_key: '',
    woocommerce_consumer_secret: '',
    woocommerce_webhook_secret: '',
    woocommerce_default_import_type: 'auto',
    woocommerce_reseller_margin: 15,

    // Twilio SMS & WhatsApp Dispatcher
    enable_twilio: false,
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    twilio_whatsapp_number: '',
    twilio_alert_orders_sms: true,
    twilio_alert_orders_whatsapp: true,
    twilio_alert_credentials_sms: true,
    twilio_alert_credentials_whatsapp: true,
    twilio_alert_otp_sms: false,

    // Live Chat Widget & Support Desk
    enable_chat_widget: true,
    chat_widget_title: 'Infiniforge Live Support',
    chat_widget_subtitle: 'Typically replies in under 5 minutes',
    chat_widget_greeting: 'Hello! 👋 How can our cloud architecture team assist you today?',
    chat_widget_primary_color: '#6366f1',
    chat_widget_position: 'bottom_right',
    chat_widget_whatsapp_number: '+919876543210',
    chat_widget_agent_name: 'Alex (Cloud Specialist)',
    chat_widget_agent_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    support_hours: '24/7 Mon - Sun',
    support_sla_hours: '2 Hours',
    support_ticketing_enabled: true,
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
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2 overflow-x-auto pb-1">
        {[
          { id: 'gateways', label: 'Payment Gateways', icon: CreditCard },
          { id: 'woocommerce', label: 'WooCommerce Sync', icon: ShoppingBag },
          { id: 'twilio', label: 'Twilio SMS & WhatsApp', icon: Phone },
          { id: 'support_chat', label: 'Live Chat & Support', icon: MessageSquare },
          { id: 'auth_security', label: 'Social Auth & CAPTCHA', icon: ShieldCheck },
          { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
          { id: 'integrations', label: 'Ecosystem & AI', icon: Zap },
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

          {/* TAB 2: WOOCOMMERCE SYNC INTEGRATION */}
          {activeTab === 'woocommerce' && (
            <div className="space-y-5 text-xs">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        WooCommerce REST API Integration
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                          v3 REST
                        </span>
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Synchronize WordPress / WooCommerce products, categories, digital items & SaaS services.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.enable_woocommerce}
                        onChange={e => updateField('enable_woocommerce', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="ml-2.5 font-bold text-slate-700 text-xs">
                        {form.enable_woocommerce ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* API Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Store URL</label>
                    <input
                      type="url"
                      value={form.woocommerce_store_url}
                      onChange={e => updateField('woocommerce_store_url', e.target.value)}
                      placeholder="https://your-wordpress-store.com"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Full URL of your WordPress installation with WooCommerce installed.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Consumer Key</label>
                    <input
                      type="password"
                      value={form.woocommerce_consumer_key}
                      onChange={e => updateField('woocommerce_consumer_key', e.target.value)}
                      placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Consumer Secret</label>
                    <input
                      type="password"
                      value={form.woocommerce_consumer_secret}
                      onChange={e => updateField('woocommerce_consumer_secret', e.target.value)}
                      placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Webhook Secret (Optional)</label>
                    <input
                      type="password"
                      value={form.woocommerce_webhook_secret}
                      onChange={e => updateField('woocommerce_webhook_secret', e.target.value)}
                      placeholder="webhook_secret_key"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default Wholesale Reseller Margin (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={form.woocommerce_reseller_margin}
                      onChange={e => updateField('woocommerce_reseller_margin', Number(e.target.value))}
                      placeholder="15"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Default Import Classification</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'auto', title: 'Auto-Detect', desc: 'Subscriptions/hosting → Services; others → Products' },
                        { id: 'product', title: 'Products Catalog', desc: 'Always import as digital/physical goods' },
                        { id: 'service', title: 'Services Catalog', desc: 'Always import as recurring cloud services' },
                      ].map(mode => (
                        <label
                          key={mode.id}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            form.woocommerce_default_import_type === mode.id
                              ? 'border-purple-600 bg-purple-50/50 text-purple-900 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="wc_import_type"
                            value={mode.id}
                            checked={form.woocommerce_default_import_type === mode.id}
                            onChange={() => updateField('woocommerce_default_import_type', mode.id)}
                            className="sr-only"
                          />
                          <div className="font-bold">{mode.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connection Feedback */}
                {wcTestFeedback && (
                  <div
                    className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in ${
                      wcTestFeedback.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {wcTestFeedback.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{wcTestFeedback.message}</div>
                      {wcTestFeedback.env && (
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Host: {wcTestFeedback.env.site_title} • API: {wcTestFeedback.env.wc_version} • Currency: {wcTestFeedback.env.currency}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Live Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setWcTesting(true);
                        setWcTestFeedback(null);
                        const res = await adminApi.woocommerceTest({
                          store_url: form.woocommerce_store_url,
                          consumer_key: form.woocommerce_consumer_key,
                          consumer_secret: form.woocommerce_consumer_secret,
                        });
                        setWcTestFeedback({
                          success: true,
                          message: res.data?.message || 'WooCommerce API connection successful!',
                          env: res.data?.environment,
                        });
                      } catch (err: any) {
                        setWcTestFeedback({
                          success: false,
                          message: err?.response?.data?.message || err?.message || 'WooCommerce connection test failed.',
                        });
                      } finally {
                        setWcTesting(false);
                      }
                    }}
                    disabled={wcTesting || !form.woocommerce_store_url}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition-colors disabled:opacity-50"
                  >
                    {wcTesting ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Test WooCommerce Connection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWcSyncModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md shadow-purple-600/20"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Launch 1-Click Catalog Sync Modal</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TWILIO SMS & WHATSAPP */}
          {activeTab === 'twilio' && (
            <div className="space-y-5 text-xs">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        Twilio Communications Dispatcher
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          SMS & WhatsApp Business API
                        </span>
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Dispatch instant automated order alerts, provisioning credentials, and OTP codes.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_twilio}
                      onChange={e => updateField('enable_twilio', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    <span className="ml-2.5 font-bold text-slate-700 text-xs">
                      {form.enable_twilio ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Twilio Account SID</label>
                    <input
                      type="password"
                      value={form.twilio_account_sid}
                      onChange={e => updateField('twilio_account_sid', e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Twilio Auth Token</label>
                    <input
                      type="password"
                      value={form.twilio_auth_token}
                      onChange={e => updateField('twilio_auth_token', e.target.value)}
                      placeholder="Your Twilio Auth Token"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Twilio Sender Phone Number (SMS)</label>
                    <input
                      type="text"
                      value={form.twilio_phone_number}
                      onChange={e => updateField('twilio_phone_number', e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Twilio WhatsApp Sender Number</label>
                    <input
                      type="text"
                      value={form.twilio_whatsapp_number}
                      onChange={e => updateField('twilio_whatsapp_number', e.target.value)}
                      placeholder="+14155238886 or whatsapp:+14155238886"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50/50 hover:bg-white focus:bg-white"
                    />
                  </div>
                </div>

                {/* Notification Triggers */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">Automated Notification Rules</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.twilio_alert_orders_sms}
                        onChange={e => updateField('twilio_alert_orders_sms', e.target.checked)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="font-semibold text-slate-700">Dispatch SMS on New Order / Purchase</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.twilio_alert_orders_whatsapp}
                        onChange={e => updateField('twilio_alert_orders_whatsapp', e.target.checked)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="font-semibold text-slate-700">Dispatch WhatsApp on New Order / Purchase</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.twilio_alert_credentials_sms}
                        onChange={e => updateField('twilio_alert_credentials_sms', e.target.checked)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="font-semibold text-slate-700">Send License Keys & Access via SMS</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.twilio_alert_credentials_whatsapp}
                        onChange={e => updateField('twilio_alert_credentials_whatsapp', e.target.checked)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="font-semibold text-slate-700">Send License Keys & Access via WhatsApp</span>
                    </label>
                  </div>
                </div>

                {/* Live Test Dispatcher */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-xs flex items-center gap-2">
                      <Send className="w-4 h-4 text-red-400" />
                      Live Interactive Dispatch Test
                    </h4>
                    <span className="text-[10px] text-slate-400">Trigger test payload directly from console</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Channel</label>
                      <select
                        value={twilioTestChannel}
                        onChange={e => setTwilioTestChannel(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="whatsapp">Twilio WhatsApp</option>
                        <option value="sms">Twilio Programmable SMS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Recipient Phone (+ Country Code)</label>
                      <input
                        type="text"
                        value={twilioTestRecipient}
                        onChange={e => setTwilioTestRecipient(e.target.value)}
                        placeholder="+919876543210"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">Action</label>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setTwilioTesting(true);
                            setTwilioTestFeedback(null);
                            const res = await adminApi.twilioTest({
                              channel: twilioTestChannel,
                              recipient: twilioTestRecipient,
                              message: twilioTestMessage,
                              account_sid: form.twilio_account_sid,
                              auth_token: form.twilio_auth_token,
                              phone_number: form.twilio_phone_number,
                              whatsapp_number: form.twilio_whatsapp_number,
                            });
                            setTwilioTestFeedback({
                              success: true,
                              message: res.data?.message || 'Test message dispatched successfully!',
                            });
                          } catch (err: any) {
                            setTwilioTestFeedback({
                              success: false,
                              message: err?.response?.data?.message || err?.message || 'Twilio test dispatch failed.',
                            });
                          } finally {
                            setTwilioTesting(false);
                          }
                        }}
                        disabled={twilioTesting || !twilioTestRecipient}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {twilioTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Send Test Dispatch</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Message Preview</label>
                    <input
                      type="text"
                      value={twilioTestMessage}
                      onChange={e => setTwilioTestMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {twilioTestFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        twilioTestFeedback.success
                          ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {twilioTestFeedback.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{twilioTestFeedback.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE CHAT WIDGET & SUPPORT DESK */}
          {activeTab === 'support_chat' && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Settings */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">
                            Global Live Chat Widget & Support Desk
                          </h3>
                          <p className="text-slate-500 text-xs">
                            Embeddable client floating widget, WhatsApp handoff & multi-channel ticketing.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.enable_chat_widget}
                          onChange={e => updateField('enable_chat_widget', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-2.5 font-bold text-slate-700 text-xs">
                          {form.enable_chat_widget ? 'Active' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    {/* Widget Text & Branding */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Widget Header Title</label>
                        <input
                          type="text"
                          value={form.chat_widget_title}
                          onChange={e => updateField('chat_widget_title', e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Status Subtitle</label>
                        <input
                          type="text"
                          value={form.chat_widget_subtitle}
                          onChange={e => updateField('chat_widget_subtitle', e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Automated Greeting Message</label>
                        <textarea
                          rows={2}
                          value={form.chat_widget_greeting}
                          onChange={e => updateField('chat_widget_greeting', e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Support WhatsApp Number</label>
                        <input
                          type="text"
                          value={form.chat_widget_whatsapp_number}
                          onChange={e => updateField('chat_widget_whatsapp_number', e.target.value)}
                          placeholder="+919876543210"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Primary Brand Accent Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={form.chat_widget_primary_color}
                            onChange={e => updateField('chat_widget_primary_color', e.target.value)}
                            className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={form.chat_widget_primary_color}
                            onChange={e => updateField('chat_widget_primary_color', e.target.value)}
                            className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Corner Placement</label>
                        <select
                          value={form.chat_widget_position}
                          onChange={e => updateField('chat_widget_position', e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                        >
                          <option value="bottom_right">Bottom Right (Standard)</option>
                          <option value="bottom_left">Bottom Left</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Support Operating Hours</label>
                        <input
                          type="text"
                          value={form.support_hours}
                          onChange={e => updateField('support_hours', e.target.value)}
                          placeholder="24/7 Mon - Sun"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">SLA Target Time</label>
                        <input
                          type="text"
                          value={form.support_sla_hours}
                          onChange={e => updateField('support_sla_hours', e.target.value)}
                          placeholder="2 Hours"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Agent Name & Title</label>
                        <input
                          type="text"
                          value={form.chat_widget_agent_name}
                          onChange={e => updateField('chat_widget_agent_name', e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Agent Avatar Image URL</label>
                        <input
                          type="url"
                          value={form.chat_widget_agent_avatar}
                          onChange={e => updateField('chat_widget_agent_avatar', e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Reseller White-label Embed Snippet */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                          White-Label Embed Snippet (External Websites & Portals)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const snippet = `<script src="https://resell.infiniforge.cloud/assets/live-chat.js" data-tenant="infiniforge" async></script>`;
                            navigator.clipboard.writeText(snippet);
                            setCopiedScript(true);
                            setTimeout(() => setCopiedScript(false), 2500);
                          }}
                          className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script Tag'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto select-all">
                        {`<script src="https://resell.infiniforge.cloud/assets/live-chat.js" data-tenant="infiniforge" async></script>`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Live Interactive Preview */}
                <div className="space-y-3">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Live Interactive Preview
                  </h4>
                  <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between h-[480px]">
                    {/* Header */}
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={form.chat_widget_agent_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt="Agent"
                          className="w-8 h-8 rounded-full object-cover border border-indigo-500"
                        />
                        <div>
                          <div className="font-bold text-xs text-white">{form.chat_widget_title || 'Live Support'}</div>
                          <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {form.chat_widget_subtitle || 'Online'}
                          </div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>

                    {/* Chat Bubble Stream */}
                    <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                      <div className="flex items-end gap-2">
                        <img
                          src={form.chat_widget_agent_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt="Agent"
                          className="w-5 h-5 rounded-full object-cover shrink-0 mb-1"
                        />
                        <div className="bg-slate-800/90 text-slate-100 rounded-2xl rounded-bl-xs p-3 text-xs border border-slate-700/60 max-w-[85%]">
                          {form.chat_widget_greeting || 'Hello! How can we help?'}
                        </div>
                      </div>

                      <div className="flex items-end justify-end">
                        <div
                          style={{ backgroundColor: form.chat_widget_primary_color || '#6366f1' }}
                          className="text-white rounded-2xl rounded-br-xs p-3 text-xs max-w-[80%]"
                        >
                          I have a question about the cloud reseller discount.
                        </div>
                      </div>
                    </div>

                    {/* Quick Channels & Input Preview */}
                    <div className="space-y-2">
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">WhatsApp: {form.chat_widget_whatsapp_number}</span>
                        <span className="text-emerald-400 font-bold">Direct Handoff</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs flex items-center justify-between">
                        <span>Type your inquiry...</span>
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BRANDING */}
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

          {/* TAB: SOCIAL AUTH & ANTI-BOT CAPTCHA */}
          {activeTab === 'auth_security' && (
            <div className="space-y-6 text-xs">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-500/30 shadow-lg space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Social Auth (SSO) & Bot Defense Security</h2>
                    <p className="text-xs text-indigo-200">
                      Configure Google, Facebook, GitHub & Microsoft single sign-on alongside intelligent anti-bot CAPTCHA challenges.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. GOOGLE OAUTH */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        Google OAuth 2.0 & One-Tap SSO
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Popular</span>
                      </h3>
                      <p className="text-slate-500 text-[11px]">Enables "Continue with Google" one-click registration and login.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_google_oauth}
                      onChange={e => updateField('enable_google_oauth', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Google Client ID</label>
                    <input
                      type="text"
                      value={form.google_client_id}
                      onChange={e => updateField('google_client_id', e.target.value)}
                      placeholder="123456789-xxxxxx.apps.googleusercontent.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Google Client Secret</label>
                    <input
                      type="password"
                      value={form.google_client_secret}
                      onChange={e => updateField('google_client_secret', e.target.value)}
                      placeholder="GOCSPX-xxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block font-semibold text-slate-700 mb-1">Authorized Redirect URI (Add to Google Cloud Console)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={form.google_redirect_uri || 'https://resell.infiniforge.cloud/api/v1/auth/callback/google'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(form.google_redirect_uri || 'https://resell.infiniforge.cloud/api/v1/auth/callback/google');
                          setSuccessMsg('Google Redirect URI copied to clipboard!');
                          setTimeout(() => setSuccessMsg(''), 3000);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shrink-0 transition-colors cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. FACEBOOK LOGIN */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        Facebook Login & Meta Graph API
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Social</span>
                      </h3>
                      <p className="text-slate-500 text-[11px]">Allows users and resellers to authenticate using their Facebook credentials.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_facebook_oauth}
                      onChange={e => updateField('enable_facebook_oauth', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Facebook App ID</label>
                    <input
                      type="text"
                      value={form.facebook_app_id}
                      onChange={e => updateField('facebook_app_id', e.target.value)}
                      placeholder="e.g. 102938475610293"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Facebook App Secret</label>
                    <input
                      type="password"
                      value={form.facebook_app_secret}
                      onChange={e => updateField('facebook_app_secret', e.target.value)}
                      placeholder="32-character secret key"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. GITHUB & MICROSOFT OAUTH */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* GitHub */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <svg className="w-4 h-4" fill="#24292F" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>GitHub OAuth</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enable_github_oauth}
                      onChange={e => updateField('enable_github_oauth', e.target.checked)}
                      className="rounded border-slate-300 text-slate-800 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Client ID</label>
                    <input
                      type="text"
                      value={form.github_client_id}
                      onChange={e => updateField('github_client_id', e.target.value)}
                      placeholder="Iv1..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Client Secret</label>
                    <input
                      type="password"
                      value={form.github_client_secret}
                      onChange={e => updateField('github_client_secret', e.target.value)}
                      placeholder="ghs_..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Microsoft Azure AD */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <svg className="w-4 h-4" viewBox="0 0 23 23">
                        <path fill="#f35325" d="M1 1h10v10H1z"/>
                        <path fill="#81bc06" d="M12 1h10v10H12z"/>
                        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                        <path fill="#ffba08" d="M12 12h10v10H12z"/>
                      </svg>
                      <span>Microsoft Azure AD</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.enable_microsoft_oauth}
                      onChange={e => updateField('enable_microsoft_oauth', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Application (Client) ID</label>
                    <input
                      type="text"
                      value={form.microsoft_client_id}
                      onChange={e => updateField('microsoft_client_id', e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Client Secret</label>
                    <input
                      type="password"
                      value={form.microsoft_client_secret}
                      onChange={e => updateField('microsoft_client_secret', e.target.value)}
                      placeholder="Secret key"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 4. ANTI-BOT CAPTCHA PROTECTION */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        Intelligent Anti-Bot Defense & CAPTCHA Shield
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">Bot Defense</span>
                      </h3>
                      <p className="text-slate-500 text-[11px]">Prevents automated credential-stuffing, brute-force spam, and fake registration scripts.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enable_captcha}
                      onChange={e => updateField('enable_captcha', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1">CAPTCHA Provider</label>
                    <select
                      value={form.captcha_provider}
                      onChange={e => updateField('captcha_provider', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="turnstile">Cloudflare Turnstile (Smart / Privacy)</option>
                      <option value="recaptcha_v2">Google reCAPTCHA v2 (Checkbox)</option>
                      <option value="recaptcha_v3">Google reCAPTCHA v3 (Invisible Score)</option>
                      <option value="builtin_math">Built-in Interactive Math Challenge (No Keys)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1">Public Site Key</label>
                    <input
                      type="text"
                      value={form.captcha_site_key}
                      onChange={e => updateField('captcha_site_key', e.target.value)}
                      placeholder="0x4AAAAAA..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block font-semibold text-slate-700 mb-1">Secret Key</label>
                    <input
                      type="password"
                      value={form.captcha_secret_key}
                      onChange={e => updateField('captcha_secret_key', e.target.value)}
                      placeholder="0x4AAAAAA..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Scope Enforcements */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="font-bold text-slate-700 block">Enforcement Scope:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.captcha_on_login}
                        onChange={e => updateField('captcha_on_login', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-700">Protect Sign-In (Login)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.captcha_on_register}
                        onChange={e => updateField('captcha_on_register', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-700">Protect Registration (Signup)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.captcha_on_forgot_password}
                        onChange={e => updateField('captcha_on_forgot_password', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-700">Protect Password Reset</span>
                    </label>
                  </div>
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

      {/* WooCommerce Sync Modal */}
      <WooCommerceSyncModal
        isOpen={showWcSyncModal}
        onClose={() => setShowWcSyncModal(false)}
        defaultImportAs={form.woocommerce_default_import_type || 'auto'}
      />
    </div>
  );
}
