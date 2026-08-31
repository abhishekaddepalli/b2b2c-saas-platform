import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, AlertCircle, FileText, Building, ShieldCheck, Send, Loader2, ArrowRight, UploadCloud } from 'lucide-react';
import { resellerApi } from '../../api';

export default function ResellerOnboardingPage() {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reseller', 'onboarding'],
    queryFn: () => resellerApi.onboarding().then(r => r.data?.data),
  });

  const org = data?.organization ?? {};
  const checklist = data?.checklist ?? { business_profile: false, kyc_documents: false, terms_accepted: false, submitted: false, approved: false };
  const onboardingStatus = data?.onboarding_status ?? 'draft';

  const [form, setForm] = useState({
    brand_name: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    support_email: '',
    support_phone: '',
    pan_card_url: '',
    gstin_certificate_url: '',
    bank_proof_url: '',
  });

  useEffect(() => {
    if (org) {
      setForm(f => ({
        ...f,
        brand_name: org.brand_name ?? '',
        gstin: org.gstin ?? '',
        pan: org.pan ?? '',
        address: org.address ?? '',
        city: org.city ?? '',
        state: org.state ?? '',
        pincode: org.pincode ?? '',
        support_email: org.support_email ?? '',
        support_phone: org.support_phone ?? '',
        pan_card_url: org.kyc_documents?.pan_card_url ?? '',
        gstin_certificate_url: org.kyc_documents?.gstin_certificate_url ?? '',
        bank_proof_url: org.kyc_documents?.bank_proof_url ?? '',
      }));
    }
  }, [org]);

  const profileMutation = useMutation({
    mutationFn: (data: object) => resellerApi.updateProfile(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reseller', 'onboarding'] }),
  });

  const kycMutation = useMutation({
    mutationFn: (data: object) => resellerApi.submitKyc(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reseller', 'onboarding'] }),
  });

  const termsMutation = useMutation({
    mutationFn: () => resellerApi.acceptTerms(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reseller', 'onboarding'] }),
  });

  const submitMutation = useMutation({
    mutationFn: () => resellerApi.submitOnboarding(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reseller', 'onboarding'] }),
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(form);
  };

  const handleSaveKyc = (e: React.FormEvent) => {
    e.preventDefault();
    kycMutation.mutate({
      pan_card_url: form.pan_card_url,
      gstin_certificate_url: form.gstin_certificate_url,
      bank_proof_url: form.bank_proof_url,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Reseller Partner Onboarding</h1>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                onboardingStatus === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : onboardingStatus === 'under_review' || onboardingStatus === 'submitted'
                  ? 'bg-amber-100 text-amber-800'
                  : onboardingStatus === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Status: {onboardingStatus.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Complete your business profile, submit KYC documents, and accept partner terms for review.</p>
        </div>
      </div>

      {onboardingStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Application Needs Revision</div>
            <div className="text-xs text-red-700 mt-1">{data?.rejection_reason || 'Please update your KYC documents or business details and resubmit.'}</div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { step: 1, title: '1. Business Profile', icon: Building, done: checklist.business_profile },
          { step: 2, title: '2. KYC Documents', icon: UploadCloud, done: checklist.kyc_documents },
          { step: 3, title: '3. Terms & Agreement', icon: FileText, done: checklist.terms_accepted },
          { step: 4, title: '4. Status & Review', icon: ShieldCheck, done: checklist.approved },
        ].map(s => (
          <button
            key={s.step}
            type="button"
            onClick={() => setActiveStep(s.step)}
            className={`p-4 rounded-xl text-left border transition-all ${
              activeStep === s.step
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                : s.done
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <s.icon className={`w-4 h-4 ${activeStep === s.step ? 'text-white' : s.done ? 'text-emerald-600' : 'text-slate-400'}`} />
              {s.done && <CheckCircle2 className={`w-4 h-4 ${activeStep === s.step ? 'text-white' : 'text-emerald-600'}`} />}
            </div>
            <div className="text-xs font-bold">{s.title}</div>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        {activeStep === 1 && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" /> Organization & Tax Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={form.brand_name}
                  onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={form.pan}
                  onChange={e => setForm(f => ({ ...f, pan: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={form.support_email}
                  onChange={e => setForm(f => ({ ...f, support_email: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Registered Address</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={profileMutation.isPending}
                className="bg-indigo-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          </form>
        )}

        {activeStep === 2 && (
          <form onSubmit={handleSaveKyc} className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-600" /> KYC Verification Document URLs
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card Image / PDF URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/kyc/pan.pdf"
                  value={form.pan_card_url}
                  onChange={e => setForm(f => ({ ...f, pan_card_url: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Certificate URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/kyc/gst.pdf"
                  value={form.gstin_certificate_url}
                  onChange={e => setForm(f => ({ ...f, gstin_certificate_url: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cancelled Cheque / Bank Statement URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/kyc/bank.pdf"
                  value={form.bank_proof_url}
                  onChange={e => setForm(f => ({ ...f, bank_proof_url: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={kycMutation.isPending}
                className="bg-indigo-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                {kycMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save KYC Documents
              </button>
            </div>
          </form>
        )}

        {activeStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Reseller Partner Terms & Conditions
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2 max-h-48 overflow-y-auto">
              <p>1. The Reseller Partner agrees to maintain confidential pricing structures and concealed platform cost tiers.</p>
              <p>2. Wallet pre-funding must satisfy minimum balance thresholds configured by platform administration.</p>
              <p>3. End-customer subscriptions renewed on schedule will be debited atomically against reseller wallet balances.</p>
              <p>4. Fraudulent activity or tenant isolation breaches result in immediate account suspension.</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {checklist.terms_accepted ? (
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Accepted on {new Date(org.terms_accepted_at).toLocaleDateString()}
                  </span>
                ) : (
                  'Review terms before accepting.'
                )}
              </div>
              <button
                type="button"
                disabled={termsMutation.isPending || checklist.terms_accepted}
                onClick={() => termsMutation.mutate()}
                className="bg-indigo-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {termsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {checklist.terms_accepted ? 'Terms Accepted' : 'Accept Terms & Conditions'}
              </button>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Final Submission & Approval Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium">
                <span>1. Business Profile Completed</span>
                {checklist.business_profile ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium">
                <span>2. KYC Documents Provided</span>
                {checklist.kyc_documents ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium">
                <span>3. Partner Terms Accepted</span>
                {checklist.terms_accepted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                disabled={submitMutation.isPending || onboardingStatus === 'approved' || onboardingStatus === 'under_review'}
                onClick={() => submitMutation.mutate()}
                className="bg-emerald-600 text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {onboardingStatus === 'approved'
                  ? 'Application Approved & Verified'
                  : onboardingStatus === 'under_review'
                  ? 'Submitted — Under Review'
                  : 'Submit Application for Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
