import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Building2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { adminApi } from '../../api';

interface AssignOrderModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignOrderModal({ order, isOpen, onClose, onSuccess }: AssignOrderModalProps) {
  const [selectedOrgId, setSelectedOrgId] = useState(order?.organization_id || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: orgsData } = useQuery({
    queryKey: ['admin', 'organizations-dropdown'],
    queryFn: () => adminApi.organizations({ per_page: 100 }).then(r => r.data?.data ?? []),
    enabled: isOpen,
  });

  const organizations: any[] = orgsData ?? [];

  if (!isOpen || !order) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) {
      setErrorMsg('Please select a reseller organization.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      await adminApi.assignOrder(order.id, selectedOrgId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to reassign order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-black">Assign Order to Reseller</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Order: {order.order_number}</div>
            <div className="text-slate-500">Customer: {order.customer?.name} ({order.customer?.email})</div>
            <div className="text-slate-500 font-semibold">Total: ₹{Number(order.grand_total || 0).toLocaleString('en-IN')}</div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Select Target Reseller Organization</label>
            <select
              value={selectedOrgId}
              onChange={e => setSelectedOrgId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Organization --</option>
              {organizations.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.slug || o.type || 'reseller'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
