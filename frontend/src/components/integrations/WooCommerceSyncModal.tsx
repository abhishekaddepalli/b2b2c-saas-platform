import React, { useState } from 'react';
import {
  ShoppingBag, Server, Sparkles, CheckCircle2, AlertCircle,
  Loader2, RefreshCw, X, ArrowRight, ExternalLink, Settings as SettingsIcon,
  Sliders, ShieldCheck, Database, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';

interface WooCommerceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultImportAs?: 'product' | 'service' | 'auto';
  categories?: Array<{ id: string; name: string }>;
  onSyncComplete?: () => void;
}

export default function WooCommerceSyncModal({
  isOpen,
  onClose,
  defaultImportAs = 'auto',
  categories = [],
  onSyncComplete,
}: WooCommerceSyncModalProps) {
  const [importAs, setImportAs] = useState<'product' | 'service' | 'auto'>(defaultImportAs);
  const [margin, setMargin] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [perPage, setPerPage] = useState<number>(50);

  // Testing & Sync states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; environment?: any } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    stats?: { total_fetched: number; imported: number; updated: number; failed: number };
    items?: Array<{ type: string; name: string; action: string }>;
    errors?: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await adminApi.woocommerceTest();
      setTestResult({
        success: true,
        message: res.data?.message || 'WooCommerce API connection verified!',
        environment: res.data?.environment,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.response?.data?.message || err?.message || 'Unable to connect to WooCommerce API. Check Settings.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const payload: any = {
        import_as: importAs,
        reseller_discount_percent: margin,
        overwrite_existing: overwriteExisting,
        per_page: perPage,
      };
      if (selectedCategory) {
        payload.category_id = selectedCategory;
      }

      const res = await adminApi.woocommerceSync(payload);
      setSyncResult(res.data);
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.response?.data?.message || err?.message || 'Catalog synchronization failed.',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                WooCommerce Catalog Sync
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  REST v3 API
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-click import and synchronize products, pricing, categories & media assets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Connection Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                WooCommerce Store Connection
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Verify credentials configured in{' '}
                <Link to="/admin/settings" className="text-indigo-400 underline hover:text-indigo-300 inline-flex items-center gap-1">
                  Settings <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || syncing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Test Connection</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div className="flex-1">
                <div className="font-semibold">{testResult.message}</div>
                {testResult.environment && (
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">
                    Store: {testResult.environment.site_title} • Currency: {testResult.environment.currency}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Result Summary */}
          {syncResult && (
            <div
              className={`p-4 rounded-2xl text-xs space-y-3 ${
                syncResult.success
                  ? 'bg-emerald-950/30 text-emerald-200 border border-emerald-800/50'
                  : 'bg-rose-950/30 text-rose-200 border border-rose-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {syncResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="font-bold text-sm">{syncResult.message}</span>
              </div>

              {syncResult.stats && (
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-800/30">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl text-center">
                    <div className="text-[10px] text-slate-400 uppercase">Fetched</div>
                    <div className="text-base font-black text-white">{syncResult.stats.total_fetched}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl text-center">
                    <div className="text-[10px] text-emerald-400 uppercase">Imported</div>
                    <div className="text-base font-black text-emerald-400">{syncResult.stats.imported}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl text-center">
                    <div className="text-[10px] text-blue-400 uppercase">Updated</div>
                    <div className="text-base font-black text-blue-400">{syncResult.stats.updated}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl text-center">
                    <div className="text-[10px] text-rose-400 uppercase">Failed</div>
                    <div className="text-base font-black text-rose-400">{syncResult.stats.failed}</div>
                  </div>
                </div>
              )}

              {syncResult.items && syncResult.items.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px] text-slate-300">
                  {syncResult.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-900/70 border border-slate-800">
                      <span className="truncate max-w-[280px] text-white font-medium">{item.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-300">
                          {item.type}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.action === 'created' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {item.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sync Configuration Form */}
          <div className="space-y-4">
            {/* Import Target Destination */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Target Catalog Destination
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setImportAs('auto')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    importAs === 'auto'
                      ? 'border-purple-500 bg-purple-950/40 text-white shadow-lg shadow-purple-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-400 mb-1" />
                  <div className="font-bold text-xs">Auto-Detect</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Smart routing based on subscriptions vs products</div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportAs('product')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    importAs === 'product'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-indigo-400 mb-1" />
                  <div className="font-bold text-xs">Products Catalog</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Digital, physical & software licenses</div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportAs('service')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    importAs === 'service'
                      ? 'border-violet-500 bg-violet-950/40 text-white shadow-lg shadow-violet-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Server className="w-4 h-4 text-violet-400 mb-1" />
                  <div className="font-bold text-xs">Services Catalog</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Recurring cloud & compute subscriptions</div>
                </button>
              </div>
            </div>

            {/* Reseller Wholesale Margin & Overwrite Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Reseller Wholesale Margin (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="15"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">% discount</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Wholesale price for resellers = Retail Price × (1 - {margin}%)
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Target Category Override (Optional)
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Auto-map WooCommerce Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Leave empty to automatically import original WooCommerce categories
                </p>
              </div>
            </div>

            {/* Overwrite Toggle & Per Page */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-slate-200">Overwrite Existing Items</div>
                  <div className="text-[10px] text-slate-500">Update pricing & descriptions if SKU or slug matches</div>
                </div>
              </label>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-200">Batch Per Page Limit</div>
                  <div className="text-[10px] text-slate-500">Number of products per batch</div>
                </div>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synchronizing WooCommerce Catalog...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Start Catalog Sync Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
