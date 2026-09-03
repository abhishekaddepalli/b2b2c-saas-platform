import { Link, Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function PublicLayout() {
  const { isAuthenticated, isSuperAdmin, isReseller } = useAuth();

  const dashboardPath = isSuperAdmin() ? '/admin' : isReseller() ? '/reseller' : '/app/dashboard';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-slate-100 sticky top-0 z-30 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">SaaS Platform</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <Link to="/marketplace" className="hover:text-slate-900 transition-colors">Marketplace</Link>
            <Link to="/#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
            <Link to="/#about" className="hover:text-slate-900 transition-colors">About</Link>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-sm text-slate-900">SaaS Platform</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                One marketplace. Every service. Every customer.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">Platform</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link to="/marketplace" className="block hover:text-slate-700">Marketplace</Link>
                <Link to="/#pricing" className="block hover:text-slate-700">Pricing</Link>
                <Link to="/register" className="block hover:text-slate-700">Start selling</Link>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">Company</div>
              <div className="space-y-2 text-sm text-slate-500">
                <Link to="/#about" className="block hover:text-slate-700">About</Link>
                <Link to="/#contact" className="block hover:text-slate-700">Contact</Link>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">Legal</div>
              <div className="space-y-2 text-sm text-slate-500">
                <a href="#" className="block hover:text-slate-700">Privacy Policy</a>
                <a href="#" className="block hover:text-slate-700">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} SaaS Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
