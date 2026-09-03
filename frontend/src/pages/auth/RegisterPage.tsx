import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Loader2, Zap, CheckCircle, Shield, CreditCard, Sparkles,
  Building2, ArrowRight, Star, ExternalLink, AlertCircle
} from 'lucide-react';
import { authApi, saasPlansApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  const planFromUrl = searchParams.get('plan') || 'pro';
  const intervalFromUrl = (searchParams.get('interval') as 'monthly' | 'yearly') || 'monthly';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    register_as_reseller: true,
    org_name: '',
    saas_plan: planFromUrl,
    billing_interval: intervalFromUrl,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentPending, setPaymentPending] = useState<any | null>(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  // Pre-load Razorpay checkout script
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const planPrices: Record<string, { monthly: number; yearly: number; name: string; trial: boolean }> = {
    trial: { monthly: 0, yearly: 0, name: '14-Day Free Trial', trial: true },
    starter: { monthly: 999, yearly: 9990, name: 'Starter Tier', trial: false },
    pro: { monthly: 2999, yearly: 29990, name: 'Business Pro', trial: false },
    enterprise: { monthly: 7999, yearly: 79990, name: 'Enterprise Scale', trial: false },
  };

  const selectedPlanInfo = planPrices[form.saas_plan] || planPrices.pro;
  const currentPrice = form.billing_interval === 'yearly'
    ? selectedPlanInfo.yearly
    : selectedPlanInfo.monthly;

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    setForm(f => ({ ...f, [field]: target.type === 'checkbox' ? target.checked : target.value }));
  };

  const launchRazorpay = (authToken: string, amount: number, orgName: string) => {
    setRazorpayLoading(true);
    const rzpKey = 'rzp_test_mock_key'; // Default key

    const options = {
      key: rzpKey,
      amount: amount * 100, // in paise
      currency: 'INR',
      name: 'Resell SaaS Platform',
      description: `Subscription: ${selectedPlanInfo.name} (${form.billing_interval})`,
      image: 'https://resell.infiniforge.cloud/favicon.ico',
      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone || '9876543210',
      },
      theme: {
        color: '#4f46e5',
      },
      handler: function (response: any) {
        setRazorpayLoading(false);
        // Complete checkout and navigate
        navigate('/reseller');
      },
      modal: {
        ondismiss: function () {
          setRazorpayLoading(false);
        },
      },
    };

    if ((window as any).Razorpay) {
      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err) {
        setRazorpayLoading(false);
        navigate('/reseller');
      }
    } else {
      setRazorpayLoading(false);
      navigate('/reseller');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const res = await authApi.register(form);
      const token = res.data?.token;

      if (token) {
        localStorage.setItem('auth_token', token);
        if (res.data?.data) {
          localStorage.setItem('user', JSON.stringify(res.data.data));
        }
        await refreshUser();
      }

      // If user selected a paid plan and is a reseller
      if (form.register_as_reseller && !selectedPlanInfo.trial && currentPrice > 0) {
        setPaymentPending({
          token: token,
          amount: currentPrice,
          plan: selectedPlanInfo.name,
          org: form.org_name,
        });
        launchRazorpay(token, currentPrice, form.org_name);
      } else {
        // Free trial or regular user -> navigate directly to dashboard!
        if (form.register_as_reseller) {
          navigate('/reseller');
        } else {
          navigate('/customer');
        }
      }
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors ?? {};
      const flat: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]) => { flat[k] = (v as string[])[0]; });
      if (err?.response?.data?.message && Object.keys(flat).length === 0) {
        flat.general = err.response.data.message;
      }
      setErrors(flat);
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
            <CreditCard className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Complete Plan Activation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Organization <strong className="text-slate-800">{paymentPending.org}</strong> registered successfully.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Plan:</span>
              <span className="font-bold text-slate-900">{paymentPending.plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Billing Interval:</span>
              <span className="font-bold text-slate-900 capitalize">{form.billing_interval}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
              <span className="font-bold text-slate-800">Total Payable:</span>
              <span className="font-black text-indigo-600">₹{Number(paymentPending.amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => launchRazorpay(paymentPending.token, paymentPending.amount, paymentPending.org)}
              disabled={razorpayLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              {razorpayLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Pay ₹{Number(paymentPending.amount).toLocaleString('en-IN')} with Razorpay
            </button>

            <button
              type="button"
              onClick={() => navigate('/reseller')}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Skip Payment & Enter Dashboard (Trial Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-slate-900 text-xl tracking-tight">Resell Cloud</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Start reselling cloud services & digital products instantly.</p>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 font-normal">(for Razorpay & alerts)</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.password && <p className="text-[11px] text-red-600 mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={form.password_confirmation}
                  onChange={set('password_confirmation')}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Reseller Switch */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 border border-indigo-100 bg-indigo-50/40 rounded-2xl cursor-pointer hover:bg-indigo-50/70 transition-colors">
                <input
                  type="checkbox"
                  checked={form.register_as_reseller}
                  onChange={set('register_as_reseller')}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">Register as Reseller Organization</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Unlock wholesale catalogs, automated margin markups, and your own branded tenant portal.
                  </div>
                </div>
              </label>
            </div>

            {/* Reseller Organization & Plan Options */}
            {form.register_as_reseller && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Reseller Organization Name</label>
                  <input
                    type="text"
                    required={form.register_as_reseller}
                    value={form.org_name}
                    onChange={set('org_name')}
                    placeholder="e.g. Apex Digital Solutions"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  />
                  {errors.org_name && <p className="text-[11px] text-red-600 mt-1">{errors.org_name}</p>}
                </div>

                {/* Plan Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800">Select SaaS Monetization Plan</label>
                    <div className="flex items-center gap-1.5 bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, billing_interval: 'monthly' }))}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          form.billing_interval === 'monthly' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, billing_interval: 'yearly' }))}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          form.billing_interval === 'yearly' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Yearly (-17%)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'trial', name: '14-Day Free Trial', price: '₹0', sub: 'Zero risk' },
                      { id: 'starter', name: 'Starter Tier', price: form.billing_interval === 'yearly' ? '₹9,990/yr' : '₹999/mo', sub: 'Up to 100 users' },
                      { id: 'pro', name: 'Business Pro', price: form.billing_interval === 'yearly' ? '₹29,990/yr' : '₹2,999/mo', sub: 'Most Popular ⭐' },
                      { id: 'enterprise', name: 'Enterprise', price: form.billing_interval === 'yearly' ? '₹79,990/yr' : '₹7,999/mo', sub: 'Unlimited scale' },
                    ].map(p => {
                      const isSelected = form.saas_plan === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setForm(f => ({ ...f, saas_plan: p.id }))}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-slate-900 text-[11px] flex items-center justify-between">
                            <span>{p.name}</span>
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <div className="font-black text-indigo-600 text-xs mt-0.5">{p.price}</div>
                          <div className="text-[10px] text-slate-400">{p.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-4"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Creating Account & Initializing...' : (
                form.register_as_reseller && !selectedPlanInfo.trial
                  ? `Create Account & Pay ₹${Number(currentPrice).toLocaleString('en-IN')} with Razorpay`
                  : 'Create Account & Proceed to Dashboard'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
