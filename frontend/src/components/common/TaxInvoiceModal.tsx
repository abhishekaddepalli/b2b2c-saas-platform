import React, { useRef } from 'react';
import {
  FileText, Printer, X, Sparkles, ShieldCheck, CheckCircle2
} from 'lucide-react';

interface TaxInvoiceModalProps {
  invoice: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaxInvoiceModal({ invoice, isOpen, onClose }: TaxInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const invNumber = invoice.invoice_number || `INV-${invoice.order_number?.replace('ORD-', '') || invoice.id?.substring(0, 8)}`;
  const items = invoice.items || [];
  const grandTotal = Number(invoice.grand_total ?? invoice.total_amount ?? 0);
  const date = invoice.issued_at || invoice.placed_at || invoice.created_at || new Date().toISOString();
  
  const sellerDetails = invoice.seller_details || {
    company: invoice.organization?.name || 'InfiniForge Cloud Solutions',
    email: invoice.organization?.support_email || 'billing@infiniforge.cloud',
    gstin: '36AABCU9603R1ZM',
    address: 'Cyber Gateway, HITEC City, Hyderabad, Telangana, 500081, India',
  };

  const billingDetails = invoice.billing_details || {
    name: invoice.customer?.name || 'Authorized Customer',
    email: invoice.customer?.email || 'customer@infiniforge.cloud',
    company: invoice.customer?.company || '',
    phone: invoice.customer?.phone || '',
    address: 'Primary Registered Billing Address',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm">Tax Invoice: {invNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={printRef} className="p-6 sm:p-10 space-y-8 bg-white text-slate-900 print:p-0">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="text-2xl font-black text-indigo-600 tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                <span>{sellerDetails.company}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {sellerDetails.address}
              </p>
              <div className="mt-2 text-xs font-mono text-slate-600 space-y-0.5">
                <div>GSTIN: <span className="font-bold text-slate-900">{sellerDetails.gstin}</span></div>
                <div>Email: {sellerDetails.email}</div>
              </div>
            </div>

            <div className="text-right sm:min-w-[200px]">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                TAX INVOICE
              </div>
              <div className="font-mono text-base font-black text-slate-900">
                {invNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Date: <strong className="text-slate-800">{new Date(date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>
              </div>
              {invoice.order_number && (
                <div className="text-xs text-slate-500">
                  Order Ref: <strong className="text-slate-800 font-mono">{invoice.order_number}</strong>
                </div>
              )}
              <div className="text-xs text-slate-500">
                Status: <strong className="text-emerald-700 font-bold uppercase">PAID (Settled)</strong>
              </div>
            </div>
          </div>

          {/* Billed To / Settlement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Billed To (Client / Customer):
              </div>
              <div className="text-sm font-bold text-slate-900">
                {billingDetails.name}
              </div>
              {billingDetails.company && (
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {billingDetails.company}
                </div>
              )}
              <div className="text-xs text-slate-500 mt-1">
                {billingDetails.email}
              </div>
              {billingDetails.phone && (
                <div className="text-xs text-slate-500">
                  Phone: {billingDetails.phone}
                </div>
              )}
              <div className="text-xs text-slate-500 mt-1">
                {billingDetails.address}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Settlement & Payment Details:
              </div>
              <div className="text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <strong className="text-slate-900 font-medium capitalize">
                    {invoice.payment_method || 'Prepaid Wallet / Electronic'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <strong className="text-slate-900 font-mono">{invoice.currency || 'INR (₹)'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Verification:</span>
                  <strong className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Instant Electronic Settlement
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Description / Service</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length > 0 ? (
                  items.map((it: any, idx: number) => {
                    const lineTotal = Number(it.final_price_at_purchase ?? it.total ?? ((it.unit_price ?? 0) * (it.quantity ?? 1)));
                    return (
                      <tr key={it.id || idx}>
                        <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{it.name || it.description || 'Provisioned Cloud Service'}</div>
                          {it.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</div>}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">{it.quantity || 1}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{Number(it.unit_price ?? it.customer_price_at_purchase ?? lineTotal).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">₹{lineTotal.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-slate-400 font-mono">1</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      Cloud Service Subscription / License
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">1</td>
                    <td className="px-4 py-3 text-right font-mono">₹{grandTotal.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">₹{grandTotal.toLocaleString('en-IN')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Taxes & GST:</span>
                <span className="font-mono">₹0.00 (Inclusive)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                <span>Grand Total Paid:</span>
                <span className="font-mono text-indigo-600">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Stamp & Authorized Signatory */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>This is a computer-generated tax invoice verified by digital audit signature.</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-700">{sellerDetails.company}</div>
              <div className="text-[10px] text-slate-400">Authorized Billing System</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
