import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Code2,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Package,
  ScrollText,
  ShieldCheck,
  Store,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { resellerApi } from '../../api';
import type { WalletBalance } from '../../types';

const navItems = [
  { label: 'Dashboard', to: '/reseller', icon: LayoutDashboard, end: true },
  { label: 'Onboarding & KYC', to: '/reseller/onboarding', icon: ShieldCheck },
  { label: 'Customers', to: '/reseller/customers', icon: Users },
  { label: 'Orders', to: '/reseller/orders', icon: ScrollText },
  { label: 'Subscriptions', to: '/reseller/subscriptions', icon: CreditCard },
  { label: 'Services', to: '/reseller/services', icon: Package },
  { label: 'Wallet', to: '/reseller/wallet', icon: IndianRupee },
  { label: 'Profit', to: '/reseller/profit', icon: BarChart3 },
  { label: 'Developer & API Hub', to: '/reseller/developer', icon: Code2 },
  { label: 'Marketplace', to: '/app/marketplace', icon: Store },
];

export default function ResellerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: walletData } = useQuery({
    queryKey: ['reseller', 'wallet'],
    queryFn: () => resellerApi.wallet().then(r => r.data.data as WalletBalance),
    refetchInterval: 60_000,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col bg-white border-r border-slate-200 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-200">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-none">
              {user?.organization?.name ?? 'Reseller'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Reseller Portal</div>
          </div>
        </div>

        {/* Wallet quick-view */}
        {walletData && (
          <Link
            to="/reseller/wallet"
            className="mx-3 mt-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-3 text-white hover:opacity-90 transition-opacity"
          >
            <div className="text-xs text-violet-200 mb-1">Wallet Balance</div>
            <div className="text-lg font-bold">
              ₹{walletData.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-violet-200 mt-0.5">
              Credit: ₹{walletData.credit_limit.toLocaleString('en-IN')}
            </div>
          </Link>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {(user?.name || user?.email || 'R').trim().charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-900 truncate">{user?.name || user?.email || 'Reseller'}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email || ''}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
          <div className="flex-1" />
          <Link
            to="/app/marketplace"
            className="text-sm text-violet-600 hover:text-violet-700 font-medium px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors flex items-center gap-1.5"
          >
            <Store className="w-4 h-4" />
            Browse Marketplace
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
