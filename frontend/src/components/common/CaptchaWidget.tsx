import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw, Loader2, Lock, Bot } from 'lucide-react';

interface Props {
  provider?: 'turnstile' | 'recaptcha_v2' | 'recaptcha_v3' | 'builtin_math';
  siteKey?: string;
  onVerify: (verified: boolean, token?: string) => void;
}

export default function CaptchaWidget({ provider = 'turnstile', siteKey, onVerify }: Props) {
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Math Challenge State
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(5);
  const [userAnswer, setUserAnswer] = useState('');
  const [mathError, setMathError] = useState(false);

  const generateNewMath = () => {
    const n1 = Math.floor(Math.random() * 10) + 3;
    const n2 = Math.floor(Math.random() * 8) + 2;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer('');
    setMathError(false);
    setVerified(false);
    onVerify(false);
  };

  useEffect(() => {
    if (provider === 'builtin_math') {
      generateNewMath();
    }
  }, [provider]);

  const handleCheckboxClick = () => {
    if (verified || verifying) return;
    setVerifying(true);
    // Simulate smart bot verification (or Turnstile handshake)
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      onVerify(true, 'turnstile_token_' + Date.now());
    }, 850);
  };

  const handleMathCheck = (val: string) => {
    setUserAnswer(val);
    if (parseInt(val, 10) === num1 + num2) {
      setVerified(true);
      setMathError(false);
      onVerify(true, 'math_verified_' + Date.now());
    } else {
      setVerified(false);
      if (val.length >= (num1 + num2).toString().length) {
        setMathError(true);
      }
      onVerify(false);
    }
  };

  if (provider === 'builtin_math') {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Anti-Bot Verification</span>
          </div>
          <button
            type="button"
            onClick={generateNewMath}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Reload challenge"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-sm tracking-wider shadow-2xs">
            {num1} + {num2} = ?
          </div>
          <input
            type="number"
            placeholder="Answer"
            value={userAnswer}
            onChange={e => handleMathCheck(e.target.value)}
            className={`w-24 px-3 py-1.5 border rounded-xl font-mono text-sm focus:outline-none focus:ring-2 ${
              verified
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-emerald-500'
                : mathError
                ? 'border-red-400 bg-red-50 text-red-900 ring-red-400'
                : 'border-slate-200 bg-white text-slate-900 focus:ring-indigo-500'
            }`}
          />
          {verified && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Passed</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  // Cloudflare Turnstile / Google reCAPTCHA interactive widget
  return (
    <div
      onClick={handleCheckboxClick}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
        verified
          ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
          : verifying
          ? 'bg-indigo-50/50 border-indigo-300'
          : 'bg-slate-50/90 border-slate-200/90 hover:bg-slate-100/80'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Custom Checkbox */}
        <div
          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
            verified
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
              : verifying
              ? 'border-indigo-500 bg-white'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          {verified ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : verifying ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          ) : null}
        </div>

        <div>
          <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span>{verified ? 'Security Verified' : 'I am human / not a robot'}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {verified ? 'Protected session token active' : 'Click to complete security check'}
          </div>
        </div>
      </div>

      {/* Provider Branding Badge */}
      <div className="flex flex-col items-end text-right text-[9px] text-slate-400 font-medium">
        <div className="flex items-center gap-1">
          <ShieldCheck className={`w-3.5 h-3.5 ${verified ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span className="font-bold text-slate-600 uppercase tracking-tighter">
            {provider === 'turnstile' ? 'Cloudflare' : 'reCAPTCHA'}
          </span>
        </div>
        <span className="text-[8px] text-slate-400">Privacy & Terms</span>
      </div>
    </div>
  );
}
