import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key,
  Webhook,
  Code2,
  Activity,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  Terminal,
  Zap,
  Lock,
} from 'lucide-react';
import { resellerApi } from '../../api';

const PERMISSION_OPTIONS = [
  { id: 'products:read', label: 'Products: Read Catalog & Pricing' },
  { id: 'orders:write', label: 'Orders: Create & Process Orders' },
  { id: 'customers:manage', label: 'Customers: Manage Customer Records' },
  { id: 'subscriptions:read', label: 'Subscriptions: View Active Subscriptions' },
  { id: 'wallet:read', label: 'Wallet: View Balance & Transactions' },
  { id: 'invoices:read', label: 'Invoices: View & Download Invoices' },
];

const WEBHOOK_EVENTS = [
  { id: 'order.created', label: 'order.created — When customer places order' },
  { id: 'order.paid', label: 'order.paid — When order payment completes' },
  { id: 'subscription.renewed', label: 'subscription.renewed — On successful recurring renewal' },
  { id: 'wallet.debited', label: 'wallet.debited — On wallet debit activity' },
];

export default function ResellerDeveloperPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs' | 'telemetry'>('keys');
  const [copiedKey, setCopiedKey] = useState('');

  // Forms state
  const [keyName, setKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['products:read', 'orders:write']);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.created', 'order.paid']);

  // Queries
  const { data: keysData, isLoading: loadingKeys } = useQuery({
    queryKey: ['reseller', 'api-keys'],
    queryFn: () => resellerApi.apiKeys().then(r => r.data?.data),
  });

  const { data: webhooksData, isLoading: loadingWebhooks } = useQuery({
    queryKey: ['reseller', 'webhooks'],
    queryFn: () => resellerApi.webhooks().then(r => r.data?.data),
  });

  const { data: usageData } = useQuery({
    queryKey: ['reseller', 'api-usage'],
    queryFn: () => resellerApi.apiUsage().then(r => r.data),
  });

  // Mutations
  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; permissions: string[] }) => resellerApi.createApiKey(data),
    onSuccess: (res) => {
      setGeneratedSecret(res.data?.data?.raw_secret_key);
      setKeyName('');
      queryClient.invalidateQueries({ queryKey: ['reseller', 'api-keys'] });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => resellerApi.revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller', 'api-keys'] });
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: (data: { target_url: string; events: string[] }) => resellerApi.createWebhook(data),
    onSuccess: () => {
      setWebhookUrl('');
      queryClient.invalidateQueries({ queryKey: ['reseller', 'webhooks'] });
    },
  });

  const keys = Array.isArray(keysData) ? keysData : [];
  const webhooks = Array.isArray(webhooksData) ? webhooksData : [];
  const logs = usageData?.data ?? [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Developer & API Integration Hub</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          API keys, webhook subscriptions, rate limits, and integration documentation for reseller partners.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold text-slate-500">
        {[
          { id: 'keys', label: 'API Keys', icon: Key },
          { id: 'webhooks', label: 'Webhook Subscriptions', icon: Webhook },
          { id: 'docs', label: 'API Documentation', icon: BookOpen },
          { id: 'telemetry', label: 'Usage & Telemetry', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                isActive ? 'border-violet-600 text-violet-600' : 'border-transparent hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          {/* New Secret Key Alert */}
          {generatedSecret && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-emerald-800 font-bold text-sm">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> New Secret API Key Generated!
                </span>
                <button onClick={() => setGeneratedSecret(null)} className="text-xs text-emerald-600 hover:underline">Close</button>
              </div>
              <p className="text-xs text-emerald-700">
                Save this secret key securely. It will <strong>never be displayed again</strong>!
              </p>
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-emerald-200 font-mono text-sm font-bold text-slate-900 justify-between">
                <span>{generatedSecret}</span>
                <button onClick={() => copyToClipboard(generatedSecret)} className="text-xs text-indigo-600 flex items-center gap-1 font-sans">
                  {copiedKey === generatedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />} Copy
                </button>
              </div>
            </div>
          )}

          {/* Generate Key Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-600" /> Generate API Secret Key
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Name / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Production Billing Integration"
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Permissions Scope</label>
                <div className="space-y-1 max-h-36 overflow-y-auto border border-slate-100 p-2 rounded-xl">
                  {PERMISSION_OPTIONS.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                        className="rounded text-violet-600"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!keyName || createKeyMutation.isPending}
              onClick={() => createKeyMutation.mutate({ name: keyName, permissions: selectedPermissions })}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              Generate Live API Key
            </button>
          </div>

          {/* Keys List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
              Active Organization API Keys ({keys.length})
            </div>
            <div className="divide-y divide-slate-100">
              {keys.map((k: any) => (
                <div key={k.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {k.name}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${k.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {k.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-500">{k.key}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Limit: {k.rate_limit_per_minute} req/min</span>
                      <span>•</span>
                      <span>Permissions: {(k.permissions || []).join(', ')}</span>
                    </div>
                  </div>

                  {k.is_active && (
                    <button
                      type="button"
                      onClick={() => revokeKeyMutation.mutate(k.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Revoke Key
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          {/* New Webhook Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-600" /> Subscribe Webhook Endpoint
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://your-api.com/webhooks/saas-events"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscribed Events</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-100 p-3 rounded-xl">
                  {WEBHOOK_EVENTS.map(ev => (
                    <label key={ev.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        className="rounded text-violet-600"
                      />
                      {ev.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!webhookUrl || createWebhookMutation.isPending}
              onClick={() => createWebhookMutation.mutate({ target_url: webhookUrl, events: selectedEvents })}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              Register Webhook Subscription
            </button>
          </div>

          {/* Webhooks List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
              Active Webhook Endpoints ({webhooks.length})
            </div>
            <div className="divide-y divide-slate-100">
              {webhooks.map((w: any) => (
                <div key={w.id} className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm font-mono">{w.target_url}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700">{w.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">Signing Secret: {w.secret}</div>
                  <div className="text-xs text-slate-500">Subscribed: {(w.events || []).join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-violet-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Reseller REST API Documentation</h2>
          </div>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2">
            <div>// Authentication Header</div>
            <div className="text-emerald-400">Authorization: Bearer sk_live_your_secret_key_here</div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Available Endpoints</h3>
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded">GET</span>
                <code className="font-bold text-slate-800">/api/v1/reseller/services</code>
                <span className="text-slate-500">— Retrieve assigned services and partner prices</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded">POST</span>
                <code className="font-bold text-slate-800">/api/v1/reseller/orders</code>
                <span className="text-slate-500">— Create order & auto-debit organization wallet</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="bg-violet-100 text-violet-800 font-bold px-2 py-1 rounded">GET</span>
                <code className="font-bold text-slate-800">/api/v1/reseller/wallet</code>
                <span className="text-slate-500">— Fetch organization available wallet balance</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
