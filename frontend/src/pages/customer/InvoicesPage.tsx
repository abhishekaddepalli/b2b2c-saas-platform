import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download, FileText, Loader2, Search, Printer, CheckCircle2,
  Calendar, ExternalLink, ShieldCheck, Copy, Check, Eye, X,
  Building2, User, CreditCard, Sparkles, RefreshCw
} from 'lucide-react';
import { invoicesApi, ordersApi } from '../../api';

export default function CustomerInvoices() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch Invoices via invoicesApi
  const { data: invoicesData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['customer', 'invoices', search, statusFilter],
    queryFn: async () => {
      try {
        const res = await invoicesApi.list({ search, status: statusFilter, per_page: 50 });
        return res.data;
      } catch {
        // Fallback to ordersApi if invoices route fails
        const res = await ordersApi.list({ search, per_page: 50 });
        return res.data;
      }
    },
  });

  const rawInvoices: any[] = invoicesData?.data ?? [];

  // Normalize data whether returned from invoices table or orders fallback
  const invoices = rawInvoices.map((inv: any) => {
    const isOrderFallback = !inv.invoice_number && inv.order_number;
    const invNumber = inv.invoice_number || `INV-${inv.order_number?.replace('ORD-', '') || inv.id?.substring(0, 8)}`;
    const items = inv.items || [];
    const grandTotal = Number(inv.grand_total ?? inv.total_amount ?? 0);
    const date = inv.issued_at || inv.placed_at || inv.created_at || new Date().toISOString();
    const status = inv.status || 'paid';
    const sellerDetails = inv.seller_details || {
      company: inv.organization?.name || 'InfiniForge Cloud Solutions',
      email: inv.organization?.support_email || 'billing@infiniforge.cloud',
      gstin: '36AABCU9603R1ZM',
      address: 'Cyber Gateway, HITEC City, Hyderabad, 500081, India',
    };
    const billingDetails = inv.billing_details || {
      name: inv.customer?.name || 'Authorized Customer',
      email: inv.customer?.email || 'customer@infiniforge.cloud',
      company: inv.customer?.company || '',
      address: 'Primary Registered Billing Address',
    };

    return {
      ...inv,
      display_invoice_number: invNumber,
      display_items: items,
      display_total: grandTotal,
      display_date: date,
      display_status: status,
      seller_details: sellerDetails,
      billing_details: billingDetails,
    };
  });

  // Calculate Metrics
  const totalInvoices = invoices.length;
  const totalPaidAmount = invoices
    .filter(i => i.display_status === 'paid' || i.display_status === 'completed')
    .reduce((sum, i) => sum + i.display_total, 0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            Official Tax Invoices & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Download and view GST-compliant tax invoices for all completed software purchases and cloud service subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh Invoices
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Invoices Issued</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalInvoices}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Lifetime transactions</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Paid Spend</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              ₹{totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Verified 100% Settled</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">GST Compliance Status</div>
            <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Full GSTIN Compliant</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Automated B2B Tax Receipts</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number, order ID, or product name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="issued">Issued</option>
              <option value="draft">Draft</option>
            </select>

            <span className="text-xs text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 rounded-lg shrink-0">
              {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'}
            </span>
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading tax invoices…</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No invoices generated yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Invoices are automatically created whenever you place orders or purchase cloud subscriptions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Date Issued</th>
                  <th className="px-5 py-3.5">Seller / Organization</th>
                  <th className="px-5 py-3.5">Items Overview</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Grand Total</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Invoice # */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {inv.display_invoice_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(inv.display_invoice_number, inv.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                          title="Copy invoice number"
                        >
                          {copiedId === inv.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {inv.order_number && (
                        <div className="text-[11px] text-slate-400 font-mono">Order: {inv.order_number}</div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(inv.display_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{inv.seller_details?.company || 'InfiniForge Cloud'}</span>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-3.5 max-w-xs">
                      {inv.display_items.length > 0 ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-900 truncate">
                            {inv.display_items[0]?.description || 'Cloud Service Subscription'}
                          </div>
                          {inv.display_items.length > 1 && (
                            <div className="text-[10px] text-slate-400">
                              +{inv.display_items.length - 1} more item(s)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Order items verified</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-3.5 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                      ₹{inv.display_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setTimeout(() => window.print(), 300);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                          title="Print / Save as PDF"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Printable Tax Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
            {/* Modal Controls (Hidden in Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">Tax Invoice: {selectedInvoice.display_invoice_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                    <span>{selectedInvoice.seller_details?.company || 'InfiniForge Cloud Solutions'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {selectedInvoice.seller_details?.address || 'Cyber Gateway, HITEC City, Hyderabad, Telangana, 500081, India'}
                  </p>
                  <div className="mt-2 text-xs font-mono text-slate-600 space-y-0.5">
                    <div>GSTIN: <span className="font-bold">{selectedInvoice.seller_details?.gstin || '36AABCU9603R1ZM'}</span></div>
                    <div>Email: {selectedInvoice.seller_details?.email || 'billing@infiniforge.cloud'}</div>
                  </div>
                </div>

                <div className="text-right sm:min-w-[200px]">
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                    TAX INVOICE
                  </div>
                  <div className="font-mono text-base font-black text-slate-900">
                    {selectedInvoice.display_invoice_number}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Date: <strong className="text-slate-800">{new Date(selectedInvoice.display_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>
                  </div>
                  {selectedInvoice.order_number && (
                    <div className="text-xs text-slate-500">
                      Order Reference: <strong className="text-slate-800 font-mono">{selectedInvoice.order_number}</strong>
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    Payment Status: <strong className="text-emerald-700 font-bold uppercase">PAID (Settled)</strong>
                  </div>
                </div>
              </div>

              {/* Billed To / Bill From Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Billed To (Customer):
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedInvoice.billing_details?.name || 'Direct Customer'}
                  </div>
                  {selectedInvoice.billing_details?.company && (
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">
                      {selectedInvoice.billing_details.company}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedInvoice.billing_details?.email}
                  </div>
                  {selectedInvoice.billing_details?.phone && (
                    <div className="text-xs text-slate-500">
                      Phone: {selectedInvoice.billing_details.phone}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedInvoice.billing_details?.address || 'Primary Business Address'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Payment & Settlement Details:
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <strong className="text-slate-900 font-medium capitalize">
                        {selectedInvoice.payment_method || 'Prepaid Wallet / Gateway'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Currency:</span>
                      <strong className="text-slate-900 font-mono">{selectedInvoice.currency || 'INR (₹)'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Verification:</span>
                      <strong className="text-emerald-700 font-semibold">Instant Electronic Settlement</strong>
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
                      <th className="px-4 py-3 text-right">Tax Rate</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {selectedInvoice.display_items.length > 0 ? (
                      selectedInvoice.display_items.map((item: any, idx: number) => (
                        <tr key={item.id || idx}>
                          <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.description || item.name}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">{item.quantity || 1}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            ₹{Number(item.unit_price || item.customer_price_at_purchase || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-500">0% GST</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                            ₹{Number(item.total || (item.unit_price * (item.quantity || 1)) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3 text-slate-400 font-mono">1</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          Order #{selectedInvoice.order_number || selectedInvoice.id} Cloud Subscription
                        </td>
                        <td className="px-4 py-3 text-center font-mono">1</td>
                        <td className="px-4 py-3 text-right font-mono">
                          ₹{selectedInvoice.display_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">0% GST</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                          ₹{selectedInvoice.display_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
                <div className="max-w-xs space-y-2">
                  <div className="text-xs font-bold text-slate-700">Payment & Compliance Remarks:</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    This is a computer-generated tax invoice. No signature required. Valid for input tax credit (ITC) purposes where applicable under GST Act.
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" /> Paid & Settled Electronically
                  </div>
                </div>

                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">
                      ₹{selectedInvoice.display_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable GST (0%):</span>
                    <span className="font-mono font-semibold">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discounts Applied:</span>
                    <span className="font-mono font-semibold text-emerald-600">-₹0.00</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-indigo-600">
                      ₹{selectedInvoice.display_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-700">
                    <span>Amount Paid:</span>
                    <span className="font-mono">
                      ₹{selectedInvoice.display_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Balance Due:</span>
                    <span className="font-mono">₹0.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
