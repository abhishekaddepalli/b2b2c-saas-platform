import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check, CheckCircle2, AlertCircle, FileText, Building, ShieldCheck,
  Send, Loader2, ArrowRight, UploadCloud, FileCheck, Eye, Sparkles,
  Award, RefreshCw, IndianRupee
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

  const [uploadNames, setUploadNames] = useState<{ [key: string]: string }>({
    pan: '',
    gstin: '',
    bank: '',
  });

  useEffect(() => {
    if (org) {
      setForm(f => ({
        ...f,
        brand_name: org.brand_name ?? org.name ?? '',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller', 'onboarding'] });
      setActiveStep(2);
    },
  });

  const kycMutation = useMutation({
    mutationFn: (data: object) => resellerApi.submitKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller', 'onboarding'] });
      setActiveStep(3);
    },
  });

  const termsMutation = useMutation({
    mutationFn: () => resellerApi.acceptTerms(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller', 'onboarding'] });
      setActiveStep(4);
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => resellerApi.submitOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller', 'onboarding'] });
    },
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

  const handleSimulatedFileUpload = (field: 'pan_card_url' | 'gstin_certificate_url' | 'bank_proof_url', nameKey: 'pan' | 'gstin' | 'bank', file: File) => {
    const fakeUrl = `https://storage.resellcloud.in/kyc/${field}_${Date.now()}_${file.name}`;
    setForm(f => ({ ...f, [field]: fakeUrl }));
    setUploadNames(prev => ({ ...prev, [nameKey]: file.name }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">Reseller Partner Onboarding & KYC</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Indian business compliance, GST verification, and wholesale tier authorization.
              </p>
            </div>
          </div>
        </div>

        <span
          className={`self-start sm:self-center text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider border ${
            onboardingStatus === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : onboardingStatus === 'under_review' || onboardingStatus === 'submitted'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : onboardingStatus === 'rejected'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          ● Status: {onboardingStatus.replace('_', ' ')}
        </span>
      </div>

      {onboardingStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-xs uppercase tracking-wider">Application Needs Revision</div>
            <div className="text-xs text-red-700 mt-1">{data?.rejection_reason || 'Please update your KYC documents or business details and resubmit for verification.'}</div>
          </div>
        </div>
      )}

      {/* Progress Steps Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { step: 1, title: '1. Business Profile', icon: Building, done: checklist.business_profile },
          { step: 2, title: '2. KYC Documents', icon: UploadCloud, done: checklist.kyc_documents },
          { step: 3, title: '3. Partner Agreement', icon: FileText, done: checklist.terms_accepted },
          { step: 4, title: '4. Status & Review', icon: Award, done: checklist.approved || onboardingStatus === 'approved' },
        ].map(s => (
          <button
            key={s.step}
            type="button"
            onClick={() => setActiveStep(s.step)}
            className={`p-4 rounded-2xl text-left border transition-all ${
              activeStep === s.step
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : s.done
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <s.icon className={`w-4 h-4 ${activeStep === s.step ? 'text-white' : s.done ? 'text-emerald-600' : 'text-slate-400'}`} />
              {s.done && <CheckCircle2 className={`w-4 h-4 ${activeStep === s.step ? 'text-white' : 'text-emerald-600'}`} />}
            </div>
            <div className="text-xs font-black">{s.title}</div>
          </button>
        ))}
      </div>

      {/* Step Content Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        {/* Step 1: Business Profile */}
        {activeStep === 1 && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" /> Business Profile & Indian Tax Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your legal enterprise details as registered with GST & Income Tax Department.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand / Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={form.brand_name}
                  onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
                  placeholder="e.g. Acme Cloud Solutions Pvt Ltd"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN Number (15 Digits)</label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="22AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2.5 font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PAN Card Number (10 Digits) *</label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  placeholder="ABCDE1234F"
                  value={form.pan}
                  onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2.5 font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Support / Contact Email *</label>
                <input
                  type="email"
                  required
                  placeholder="support@company.com"
                  value={form.support_email}
                  onChange={e => setForm(f => ({ ...f, support_email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Support Phone (+91) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={form.support_phone}
                  onChange={e => setForm(f => ({ ...f, support_phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="500081"
                  value={form.pincode}
                  onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Registered Business Office Address *</label>
                <textarea
                  rows={2}
                  required
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Unit No, Tech Park / Commercial Complex, City, State"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={profileMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save & Continue to KYC</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 2: KYC Documents */}
        {activeStep === 2 && (
          <form onSubmit={handleSaveKyc} className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" /> KYC Verification Documents
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload or link your authorized verification files (PDF, PNG, JPG under 10MB).</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* PAN Document */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">1. PAN Card Document (Company / Proprietor) *</label>
                  {form.pan_card_url && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Attached</span>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleSimulatedFileUpload('pan_card_url', 'pan', f);
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <input
                    type="text"
                    placeholder="Or enter direct document URL"
                    value={form.pan_card_url}
                    onChange={e => setForm(f => ({ ...f, pan_card_url: e.target.value }))}
                    className="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* GSTIN Certificate */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">2. GSTIN Registration Certificate (Form REG-06)</label>
                  {form.gstin_certificate_url && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Attached</span>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleSimulatedFileUpload('gstin_certificate_url', 'gstin', f);
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <input
                    type="text"
                    placeholder="Or enter direct document URL"
                    value={form.gstin_certificate_url}
                    onChange={e => setForm(f => ({ ...f, gstin_certificate_url: e.target.value }))}
                    className="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Bank Proof */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">3. Cancelled Cheque / Bank Statement Header *</label>
                  {form.bank_proof_url && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Attached</span>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleSimulatedFileUpload('bank_proof_url', 'bank', f);
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <input
                    type="text"
                    placeholder="Or enter direct document URL"
                    value={form.bank_proof_url}
                    onChange={e => setForm(f => ({ ...f, bank_proof_url: e.target.value }))}
                    className="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                ← Back to Profile
              </button>
              <button
                type="submit"
                disabled={kycMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {kycMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save KYC & Proceed</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Terms & Agreement */}
        {activeStep === 3 && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Reseller Partner Master Services Agreement
              </h2>
              <p className="text-slate-500 mt-0.5">Please review the partner agreement terms before submission.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-600 space-y-2.5 max-h-56 overflow-y-auto leading-relaxed">
              <p><strong>1. Confidentiality of Wholesale Pricing:</strong> The Reseller Partner agrees to maintain confidential pricing structures and concealed platform wholesale rates at all times.</p>
              <p><strong>2. Wallet Settlement Protocol:</strong> Wallet pre-funding must satisfy minimum balance thresholds configured by platform administration. Customer recurring renewals will be debited atomically against reseller wallet balances.</p>
              <p><strong>3. White-labeling Rights:</strong> Resellers may brand software deliverables with their corporate name and domain under their active SaaS license tier.</p>
              <p><strong>4. Compliance & Anti-Fraud:</strong> Fraudulent activity, chargeback manipulation, or tenant isolation violations will result in immediate account termination.</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-slate-500">
                {checklist.terms_accepted ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Terms Accepted
                  </span>
                ) : (
                  'Click to formally accept partner terms.'
                )}
              </div>
              <button
                type="button"
                disabled={termsMutation.isPending || checklist.terms_accepted}
                onClick={() => termsMutation.mutate()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl disabled:opacity-60 shadow-md transition-all flex items-center gap-2"
              >
                {termsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{checklist.terms_accepted ? 'Agreement Accepted' : 'Accept Terms & Conditions'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Status & Review */}
        {activeStep === 4 && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Final Submission & Verification Review
              </h2>
              <p className="text-slate-500 mt-0.5">Track your partner verification progress and wholesale distribution access.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700">1. Business Profile & Tax Coordinates</span>
                {checklist.business_profile ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Completed</span>
                ) : (
                  <span className="text-amber-600 font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Pending</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700">2. Verification KYC Documents</span>
                {checklist.kyc_documents ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Attached</span>
                ) : (
                  <span className="text-amber-600 font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Pending</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700">3. Partner Agreement Acceptance</span>
                {checklist.terms_accepted ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Accepted</span>
                ) : (
                  <span className="text-amber-600 font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Pending</span>
                )}
              </div>
            </div>

            {onboardingStatus === 'approved' ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>Verified Partner Account — Wholesale Activated!</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your organization is fully verified. You can order digital licenses, assign services to clients, and manage recurring margins.
                </p>
                <div className="pt-2">
                  <Link
                    to="/reseller/marketplace"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
                  >
                    <span>Browse Wholesale Marketplace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">
                  {onboardingStatus === 'under_review' ? 'Our compliance team is verifying your documents.' : 'Submit your profile for administrative verification.'}
                </span>
                <button
                  type="button"
                  disabled={submitMutation.isPending || onboardingStatus === 'approved' || onboardingStatus === 'under_review'}
                  onClick={() => submitMutation.mutate()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>
                    {onboardingStatus === 'under_review' ? 'Submitted — Under Review' : 'Submit Application for Review'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
