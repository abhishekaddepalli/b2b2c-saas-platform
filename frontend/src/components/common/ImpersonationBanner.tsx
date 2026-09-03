import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeftCircle, Loader2, Building2, User, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ImpersonationBanner() {
  const { isImpersonating, impersonator, user, stopImpersonating } = useAuth();
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  if (!isImpersonating || !impersonator) {
    return null;
  }

  const handleExit = async () => {
    try {
      setIsLeaving(true);
      await stopImpersonating();
      navigate('/admin/users');
    } catch (err) {
      console.error('Error stopping impersonation', err);
    } finally {
      setIsLeaving(false);
    }
  };

  const targetRole = user?.roles?.[0] ?? 'User';
  const orgName = user?.organization?.name;

  return (
    <div className="sticky top-0 z-[9999] bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl border-b border-amber-300/30 px-4 py-2 sm:py-2.5 animate-in slide-in-from-top duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs">
        {/* Left: Info */}
        <div className="flex items-center gap-2.5 flex-wrap text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 border border-amber-300/40 text-amber-100 font-black uppercase text-[10px] tracking-wider shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Super Admin Impersonation</span>
          </div>

          <div className="text-amber-50">
            <span>Viewing session as </span>
            <strong className="text-white font-bold underline decoration-amber-300">{user?.name}</strong>
            <span className="opacity-80"> ({user?.email})</span>
            {orgName && (
              <span className="hidden md:inline text-amber-200 font-medium">
                {' '}• Org: <strong>{orgName}</strong>
              </span>
            )}
            <span className="hidden sm:inline bg-black/20 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ml-1.5">
              {targetRole}
            </span>
          </div>
        </div>

        {/* Right: Exit Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExit}
            disabled={isLeaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-900 font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isLeaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            ) : (
              <ArrowLeftCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Exit Impersonation & Return to Super Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
