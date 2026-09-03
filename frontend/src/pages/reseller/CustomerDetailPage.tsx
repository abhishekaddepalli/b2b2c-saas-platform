import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, ArrowLeft, Building, Mail, Phone, Calendar,
  ShoppingBag, CreditCard, Loader2, CheckCircle, ShieldAlert,
  IndianRupee, Plus, ExternalLink, Clock, Package
} from 'lucide-react';
import { resellerApi } from '../../api';

export default function ResellerCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'subscriptions' | 'info'>('orders');

  const { data: customerData, isLoading: loadingCustomer } = useQuery({
    queryKey: ['reseller', 'customer', id],
    queryFn: () => resellerApi.customer(id!).then(r => r.data?.data ?? r.data),
    enabled: !!id,
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['reseller', 'customer-orders', id],
    queryFn: () => resellerApi.customerOrders(id!).then(r => r.data?.data ?? r.data),
    enabled: !!id,
  });

  const { data: subsData, isLoading: loadingSubs } = useQuery({
    queryKey: ['reseller', 'customer-subs', id],
    queryFn: () => resellerApi.customerSubscriptions(id!).then(r => r.data?.data ?? r.data),
    enabled: !!id,
  });

  if (loadingCustomer) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const customer = customerData || {};
  const orders: any[] = Array.isArray(ordersData) ? ordersData : (ordersData?.data ?? []);
  const subscriptions: any[] = Array.isArray(subsData) ? subsData : (subsData?.data ?? []);

  const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount ?? o.grand_total ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link
          to="/reseller/customers"
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs text-slate-400 font-medium">Customer Directory / Profile</div>
          <h1 className="text-xl font-extrabold text-slate-900">{customer.name || 'Customer Account'}</h1>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {(customer.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                {customer.status || 'Active'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}</span>
              {customer.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}</span>}
              {customer.company && <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400" /> {customer.company}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Link
            to="/reseller"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Place Order for Client</span>
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Lifetime Spend</div>
          <div className="text-xl font-bold text-slate-900 mt-1">₹{totalSpent.toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Orders Placed</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{orders.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Active Subscriptions</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{subscriptions.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'orders' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Orders History ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'subscriptions' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Recurring Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'info' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Account Details & Notes
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && (
            <div>
              {loadingOrders ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No orders recorded for this customer yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="pb-3">Order Number</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-mono font-bold text-indigo-600">{o.order_number || o.id.substring(0, 8)}</td>
                          <td className="py-3">{o.items?.length || 1} Item(s)</td>
                          <td className="py-3 font-bold text-slate-900">₹{Number(o.total_amount ?? o.grand_total ?? 0).toLocaleString('en-IN')}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              {o.status || 'Paid'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">{new Date(o.placed_at || o.created_at || Date.now()).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div>
              {loadingSubs ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No active subscriptions for this customer.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="pb-3">Service / Plan</th>
                        <th className="pb-3">Interval</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Next Renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {subscriptions.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-bold text-slate-900">{s.service_plan?.name || s.name || 'Cloud Service'}</td>
                          <td className="py-3 capitalize">{s.billing_interval || 'Monthly'}</td>
                          <td className="py-3 font-bold text-slate-900">₹{Number(s.amount || 0).toLocaleString('en-IN')}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                              {s.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">{new Date(s.next_billing_at || Date.now()).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-bold text-slate-900 text-sm">Account Overview</div>
                <div className="text-slate-600">Name: <strong className="text-slate-800">{customer.name}</strong></div>
                <div className="text-slate-600">Email: <strong className="text-slate-800">{customer.email}</strong></div>
                <div className="text-slate-600">Phone: <strong className="text-slate-800">{customer.phone || 'N/A'}</strong></div>
                <div className="text-slate-600">Company: <strong className="text-slate-800">{customer.company || 'N/A'}</strong></div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="font-bold text-slate-900 text-sm">Account Notes</div>
                <p className="text-slate-600 leading-relaxed italic">
                  {customer.notes || 'No custom notes provided for this account.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
