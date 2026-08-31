import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Mail, MessageSquare, Bell, Smartphone, Send, Loader2, Check, Power, Code2 } from 'lucide-react';
import { adminApi } from '../../api';

const EVENT_TRIGGERS = [
  { id: 'welcome_message', name: 'Welcome Message' },
  { id: 'renewal_reminder', name: 'Renewal Reminder' },
  { id: 'low_wallet_alert', name: 'Low Wallet Alert' },
  { id: 'failed_payment_retry', name: 'Failed Payment Retry' },
  { id: 'expiry_notification', name: 'Expiry Notification' },
  { id: 'order_placed', name: 'Order Placed' },
  { id: 'invoice_generated', name: 'Invoice Generated' },
  { id: 'reseller_alert', name: 'Reseller Alert' },
];

const CHANNELS = [
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'sms', name: 'SMS', icon: Smartphone },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare },
  { id: 'in_app', name: 'In-App', icon: Bell },
];

const SUPPORTED_VARS = [
  '{{customer_name}}',
  '{{service_name}}',
  '{{amount}}',
  '{{renewal_date}}',
  '{{invoice_number}}',
  '{{platform_name}}',
];

export default function AdminAutomationPage() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState('renewal_reminder');
  const [selectedChannel, setSelectedChannel] = useState('email');

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['admin', 'automation-templates'],
    queryFn: () => adminApi.automationTemplates().then(r => r.data?.data),
  });

  const templates = Array.isArray(templatesData) ? templatesData : [];
  const currentTemplate = templates.find(
    (t: any) => t.event_trigger === selectedEvent && t.channel === selectedChannel
  );

  const [form, setForm] = useState({
    name: '',
    subject: '',
    template_body: '',
  });

  const [testResult, setTestResult] = useState<string | null>(null);

  // Sync form when template selection changes
  const activeName = currentTemplate?.name ?? `${selectedEvent.replace('_', ' ')} (${selectedChannel})`;
  const activeSubject = currentTemplate?.subject ?? '';
  const activeBody = currentTemplate?.template_body ?? '';

  const saveMutation = useMutation({
    mutationFn: (data: object) => adminApi.saveAutomationTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automation-templates'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleAutomationTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'automation-templates'] });
    },
  });

  const testTriggerMutation = useMutation({
    mutationFn: (event_trigger: string) => adminApi.testAutomationTrigger({ event_trigger }),
    onSuccess: (res: any) => {
      setTestResult(res.data?.message || 'Test notification sent!');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      event_trigger: selectedEvent,
      channel: selectedChannel,
      name: form.name || activeName,
      subject: form.subject || activeSubject,
      template_body: form.template_body || activeBody,
      supported_variables: SUPPORTED_VARS,
    });
  };

  const insertVariable = (varName: string) => {
    setForm(f => ({
      ...f,
      template_body: (f.template_body || activeBody) + ' ' + varName,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-600" /> Automation Center & Notification Workflows
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure multi-channel email, SMS, WhatsApp, and in-app automated notification triggers with dynamic template variables.
          </p>
        </div>
        <button
          type="button"
          disabled={testTriggerMutation.isPending}
          onClick={() => testTriggerMutation.mutate(selectedEvent)}
          className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          {testTriggerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Test Fire ({selectedEvent})
        </button>
      </div>

      {testResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{testResult}</span>
          <button onClick={() => setTestResult(null)} className="text-emerald-600 hover:text-emerald-900">Dismiss</button>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left: Event Triggers Selector */}
        <div className="col-span-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Event Triggers</div>
          {EVENT_TRIGGERS.map(evt => (
            <button
              key={evt.id}
              type="button"
              onClick={() => {
                setSelectedEvent(evt.id);
                setForm({ name: '', subject: '', template_body: '' });
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                selectedEvent === evt.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{evt.name}</span>
            </button>
          ))}
        </div>

        {/* Right: Channel & Template Editor */}
        <div className="col-span-9 space-y-6">
          {/* Channel Tabs */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setSelectedChannel(ch.id);
                    setForm({ name: '', subject: '', template_body: '' });
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    selectedChannel === ch.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* Template Configuration Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedEvent.replace('_', ' ').toUpperCase()} — {selectedChannel.toUpperCase()}
                </h2>
                <p className="text-xs text-slate-400">Configure template message content and variable mappings.</p>
              </div>

              {currentTemplate && (
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate(currentTemplate.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    currentTemplate.is_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {currentTemplate.is_enabled ? 'Enabled' : 'Disabled'}
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Template Title</label>
                <input
                  type="text"
                  value={form.name || activeName}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {selectedChannel === 'email' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject Line</label>
                  <input
                    type="text"
                    value={form.subject || activeSubject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Template Message Body</label>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Code2 className="w-3.5 h-3.5" /> Supported Variables:
                  </div>
                </div>

                {/* Variable Pills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SUPPORTED_VARS.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  value={form.template_body || activeBody}
                  onChange={e => setForm(f => ({ ...f, template_body: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-indigo-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Notification Template
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
