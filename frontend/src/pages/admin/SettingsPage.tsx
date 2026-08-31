import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Globe, Image, Layout, Loader2, Palette, Save, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../api';

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.settings().then(r => r.data),
  });

  const [form, setForm] = useState({
    platform_name: 'B2B2C Enterprise SaaS',
    support_email: 'support@saasplatform.com',
    currency: 'INR',
    default_tax_rate: '18',
    primary_color: '#6366f1',
    accent_color: '#8b5cf6',
    logo_url: '',
    favicon_url: '',
    custom_domain: 'saasplatform.com',
    enable_whitelabel_reseller: true,
    enable_razorpay: true,
    enable_phonepe: true,
    enable_cashfree: true,
    enable_stripe: true,
  });

  useEffect(() => {
    if (data?.data) {
      setForm(f => ({ ...f, ...data.data }));
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await adminApi.updateSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform & White-Label Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Global platform configuration, white-label reseller branding, currency & payment gateways</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Config */}
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-600" /> Platform Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform Name</label>
                  <input
                    type="text"
                    value={form.platform_name}
                    onChange={e => setForm(f => ({ ...f, platform_name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Support Email</label>
                  <input
                    type="email"
                    value={form.support_email}
                    onChange={e => setForm(f => ({ ...f, support_email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Base Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    value={form.default_tax_rate}
                    onChange={e => setForm(f => ({ ...f, default_tax_rate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* White-Label Branding Settings */}
            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4 text-violet-600" /> White-Label Branding Settings
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                      className="w-10 h-10 p-1 border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.primary_color}
                      onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accent_color}
                      onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                      className="w-10 h-10 p-1 border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.accent_color}
                      onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={form.logo_url}
                    onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Favicon URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/favicon.ico"
                    value={form.favicon_url}
                    onChange={e => setForm(f => ({ ...f, favicon_url: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enable_whitelabel_reseller}
                    onChange={e => setForm(f => ({ ...f, enable_whitelabel_reseller: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Allow Resellers to upload custom white-label logos & colors for end-customers</span>
                </label>
              </div>
            </div>

            {/* Payment Integrations */}
            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" /> Payment Gateway Integration Switches
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'enable_razorpay', label: 'Razorpay (India UPI / NetBanking / Cards)' },
                  { key: 'enable_phonepe', label: 'PhonePe (Direct UPI Intent)' },
                  { key: 'enable_cashfree', label: 'Cashfree (Auto Collect & Subscriptions)' },
                  { key: 'enable_stripe', label: 'Stripe (Global Credit & Debit Cards)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Platform Settings
              </button>
              {saved && (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <Check className="w-4 h-4" /> Saved successfully
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
