import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Sparkles, Shield, Zap, ArrowRight, Star } from 'lucide-react';
import { saasPlansApi } from '../api';

function fmt(n: number) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);

  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['saas-plans'],
    queryFn: () => saasPlansApi.list().then(r => r.data?.data),
  });

  const { data: currentSubData, isLoading: loadingSub } = useQuery({
    queryKey: ['saas-plans', 'current'],
    queryFn: () => saasPlansApi.current().then(r => r.data?.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: ({ planId, billingInterval }: { planId: string; billingInterval: string }) =>
      saasPlansApi.subscribe({ plan_id: planId, billing_interval: billingInterval }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-plans', 'current'] });
    },
    onSettled: () => setSubmittingPlanId(null),
  });

  const handleSelectPlan = (planId: string) => {
    setSubmittingPlanId(planId);
    subscribeMutation.mutate({ planId, billingInterval: interval });
  };

  const plans = Array.isArray(plansData) ? plansData : [];
  const currentPlanId = currentSubData?.saas_plan_id;

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Flexible SaaS Monetization Plans
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Choose the Perfect Scale for Your SaaS Network
          </h1>
          <p className="text-lg text-slate-600">
            Configure reseller quotas, customer limits, white-label branding, and dedicated infrastructure APIs.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="pt-6 flex justify-center items-center gap-3">
            <span className={`text-sm font-semibold ${interval === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly Billing</span>
            <button
              type="button"
              onClick={() => setInterval(i => (i === 'monthly' ? 'yearly' : 'monthly'))}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  interval === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${interval === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Yearly Billing <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">Save 17%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        {loadingPlans ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan: any) => {
              const isCurrent = currentPlanId === plan.id;
              const isPopular = plan.slug === 'business';
              const price = interval === 'yearly' ? plan.yearly_price / 12 : plan.monthly_price;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-white rounded-3xl p-8 border transition-all duration-200 shadow-sm hover:shadow-xl ${
                    isPopular ? 'border-2 border-indigo-600 ring-4 ring-indigo-50 shadow-indigo-100' : 'border-slate-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{plan.short_description}</p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">{fmt(price)}</span>
                      <span className="text-xs text-slate-500 font-medium">/ month</span>
                    </div>
                    {interval === 'yearly' && plan.yearly_price > 0 && (
                      <div className="text-xs text-emerald-600 font-medium mt-1">
                        Billed annually ({fmt(plan.yearly_price)}/yr)
                      </div>
                    )}
                  </div>

                  {/* Limits summary */}
                  <div className="space-y-3 mb-8 flex-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quotas & Access</div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Reseller Limit: {plan.reseller_limit === -1 ? 'Unlimited' : plan.reseller_limit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Customer Limit: {plan.customer_limit === -1 ? 'Unlimited' : plan.customer_limit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Catalog Items: {plan.products_limit === -1 ? 'Unlimited' : plan.products_limit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>White-Label Branding: {plan.white_label_available ? 'Included' : 'Not Included'}</span>
                    </div>

                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        {plan.features.map((feat: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                            <Zap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent || submittingPlanId === plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : isPopular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {submittingPlanId === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      'Current Active Plan'
                    ) : (
                      <>
                        Subscribe to {plan.name} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
