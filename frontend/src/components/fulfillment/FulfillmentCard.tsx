import { useState } from 'react';
import {
  Key, Download, Truck, Globe, ExternalLink, Copy,
  Check, Clock, ShieldCheck, User, Lock, AlertCircle,
  Package, Server, Eye, Sparkles, Layers
} from 'lucide-react';

interface Props {
  item: any;
  isAdmin?: boolean;
  onEditClick?: () => void;
}

export default function FulfillmentCard({ item, isAdmin, onEditClick }: Props) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);

  const meta = typeof item?.metadata === 'object' && item?.metadata !== null
    ? item.metadata
    : (typeof item?.metadata === 'string' ? JSON.parse(item.metadata || '{}') : {});

  const productType = meta.product_type || item.product_type || (item.billing_interval ? 'service' : 'software_license');

  // Copy helpers
  const copyToClipboard = (text: string, type: 'key' | 'pass' | 'user') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'pass') {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    } else if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    }
  };

  // Expiry Bar Calculation
  const expiresAt = meta.expires_at || item.current_period_end;
  const activatedAt = meta.activated_at || item.current_period_start || item.created_at;

  let daysRemaining: number | null = null;
  let progressPct = 100;
  let isExpired = false;

  if (expiresAt) {
    const end = new Date(expiresAt).getTime();
    const start = activatedAt ? new Date(activatedAt).getTime() : Date.now() - 30 * 86400000;
    const now = Date.now();
    const totalDuration = Math.max(1, end - start);
    const timeLeft = end - now;

    daysRemaining = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 0) {
      isExpired = true;
      progressPct = 0;
      daysRemaining = 0;
    } else {
      progressPct = Math.min(100, Math.max(5, Math.round((timeLeft / totalDuration) * 100)));
    }
  }

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            {productType === 'software_license' ? (
              <Key className="w-4 h-4" />
            ) : productType === 'physical' ? (
              <Truck className="w-4 h-4" />
            ) : productType === 'service' ? (
              <Server className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
              {productType === 'software_license' ? 'Software License & Access' : productType === 'physical' ? 'Physical Shippable Asset' : productType === 'service' ? 'Cloud Service & Bundled Suite' : 'Digital Asset Download'}
            </span>
            <h4 className="font-bold text-white text-xs sm:text-sm">{item.name || 'Purchased Asset'}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {meta.live_preview_url && (
            <a
              href={meta.live_preview_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-[11px] border border-indigo-500/30 transition-all"
            >
              <Eye className="w-3 h-3" />
              <span>Live Preview</span>
            </a>
          )}

          {isAdmin && onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors"
            >
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* 1. SOFTWARE LICENSE KEY & LOGIN CREDENTIALS */}
      {(productType === 'software_license' || meta.license_key || meta.software_url) && (
        <div className="space-y-3.5">
          {/* License Key Box */}
          {meta.license_key && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/40 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Activated License Key:</span>
                <span className="font-mono font-black text-sm text-indigo-300 tracking-wider select-all">
                  {meta.license_key}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(meta.license_key, 'key')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>
          )}

          {/* Login Credentials & Software URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {meta.software_url && (
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Software Portal / Download:</span>
                  <a
                    href={meta.software_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                  >
                    <span>{meta.software_url.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {meta.login_username && (
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Login Username:</span>
                  <span className="font-mono font-bold text-slate-200 select-all">{meta.login_username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(meta.login_username, 'user')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy username"
                >
                  {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {meta.login_password && (
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Password / Temp Code:</span>
                  <span className="font-mono font-bold text-slate-200 select-all">{meta.login_password}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(meta.login_password, 'pass')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy password"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {meta.max_devices && (
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Activation Limit:</span>
                <span className="font-semibold text-slate-200">{meta.max_devices}</span>
              </div>
            )}
          </div>

          {meta.access_instructions && (
            <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-300">
              <strong className="text-slate-200">Setup Guide: </strong>
              <span>{meta.access_instructions}</span>
            </div>
          )}

          {/* Expiry Time Bar */}
          {expiresAt && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Validity & License Expiry:</span>
                </span>
                <span className={`font-mono font-bold ${isExpired ? 'text-red-400' : daysRemaining && daysRemaining < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isExpired ? 'Expired' : `${daysRemaining} Days Remaining`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExpired ? 'bg-red-500' : progressPct < 20 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Activated: {new Date(activatedAt).toLocaleDateString('en-IN')}</span>
                <span>Term Ends: {new Date(expiresAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PHYSICAL SHIPPABLE PRODUCT */}
      {productType === 'physical' && (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Courier Delivery Status:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
              {meta.shipping_status || 'In Transit'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Courier Partner:</span>
              <span className="font-bold text-slate-200">{meta.courier || 'BlueDart Express'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Estimated Arrival:</span>
              <span className="font-bold text-slate-200">{meta.estimated_delivery || '3-4 Business Days'}</span>
            </div>
          </div>

          {meta.tracking_number && (
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Tracking Number:</span>
                <span className="font-mono font-bold text-indigo-300">{meta.tracking_number}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(meta.tracking_number, 'key')}
                className="text-slate-400 hover:text-white p-1"
                title="Copy tracking number"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. DIGITAL DOWNLOADABLE PRODUCT */}
      {productType === 'digital' && (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">File Release: <strong className="text-slate-200">{meta.file_version || 'v1.0.0'}</strong></span>
            <span className="text-slate-400">Size: <strong className="text-slate-200">{meta.file_size || 'Compressed ZIP'}</strong></span>
          </div>

          {meta.download_url ? (
            <a
              href={meta.download_url}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Digital Asset File</span>
            </a>
          ) : (
            <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 text-center">
              Asset download link ready upon verified confirmation.
            </div>
          )}
        </div>
      )}

      {/* 4. RECURRING CLOUD SERVICE & BUNDLED APPLICATIONS */}
      {productType === 'service' && (
        <div className="space-y-3">
          {/* Bundled Apps Pills if present */}
          {Array.isArray(meta.bundled_apps) && meta.bundled_apps.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Included Bundled Applications:</span>
              <div className="flex flex-wrap gap-1.5">
                {meta.bundled_apps.map((app: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[10px] font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>{app}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Access Portal Details */}
          {(meta.portal_url || meta.access_url || meta.username) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(meta.portal_url || meta.access_url) && (
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Cloud Portal URL:</span>
                  <a
                    href={meta.portal_url || meta.access_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-indigo-400 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{(meta.portal_url || meta.access_url).replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {meta.username && (
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Username / Tenant ID:</span>
                    <span className="font-mono font-bold text-slate-200">{meta.username}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(meta.username, 'user')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {meta.password && (
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Password:</span>
                    <span className="font-mono font-bold text-slate-200">{meta.password}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(meta.password, 'pass')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Expiry Bar */}
          {expiresAt && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Next Renewal Cycle:</span>
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {daysRemaining} Days Left ({new Date(expiresAt).toLocaleDateString('en-IN')})
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
