import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  ScrollText,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Tag,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GlobalCommandPalette from '../common/GlobalCommandPalette';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'System Health', to: '/admin/system-health', icon: Activity },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Services', to: '/admin/services', icon: Server },
  { label: 'Organizations', to: '/admin/organizations', icon: Building2 },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Orders', to: '/admin/orders', icon: ScrollText },
  { label: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCard },
  { label: 'Wallets', to: '/admin/wallets', icon: Wallet },
  { label: 'Offers', to: '/admin/offers', icon: Percent },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: ShieldCheck },
  { label: 'Automation Center', to: '/admin/automation', icon: Zap },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Global Command Palette */}
      <GlobalCommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-slate-900 text-white transition-all duration-200 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">SaaS Admin</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`text-slate-400 hover:text-white transition-colors ${collapsed ? 'hidden' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-800 p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {(user?.name || user?.email || 'A').trim().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{user?.name || user?.email || 'Admin'}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center text-slate-400 hover:text-white transition-colors py-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            )}

            {/* Global Command Search Trigger */}
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-500 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors w-72"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search platform records...</span>
              <kbd className="ml-auto bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono rounded text-slate-400 font-semibold shadow-xs">Ctrl+K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
            >
              View Marketplace
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
