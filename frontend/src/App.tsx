import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import ResellerLayout from './components/layout/ResellerLayout';
import CustomerLayout from './components/layout/CustomerLayout';
import PublicLayout from './components/layout/PublicLayout';
import ImpersonationBanner from './components/common/ImpersonationBanner';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import PricingPage from './pages/PricingPage';

// Public pages
import LandingPage from './pages/public/LandingPage';
import MarketplacePage from './pages/public/MarketplacePage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import ServiceDetailPage from './pages/public/ServiceDetailPage';

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminProducts from './pages/admin/ProductsPage';
import AdminServices from './pages/admin/ServicesPage';
import AdminOrganizations from './pages/admin/OrganizationsPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminOrders from './pages/admin/OrdersPage';
import AdminSubscriptions from './pages/admin/SubscriptionsPage';
import AdminWallets from './pages/admin/WalletsPage';
import AdminOffers from './pages/admin/OffersPage';
import AdminReports from './pages/admin/ReportsPage';
import AdminSettings from './pages/admin/SettingsPage';
import AdminAuditLogs from './pages/admin/AuditLogsPage';
import AdminAutomation from './pages/admin/AutomationPage';
import SystemHealthPage from './pages/admin/SystemHealthPage';
import AdminCms from './pages/admin/CmsPage';
import InstallerPage from './pages/InstallerPage';

// Reseller pages
import ResellerDashboard from './pages/reseller/DashboardPage';
import ResellerCustomers from './pages/reseller/CustomersPage';
import ResellerCustomerDetail from './pages/reseller/CustomerDetailPage';
import ResellerOrders from './pages/reseller/OrdersPage';
import ResellerWallet from './pages/reseller/WalletPage';
import ResellerProfit from './pages/reseller/ProfitPage';
import ResellerSubscriptions from './pages/reseller/SubscriptionsPage';
import ResellerOnboarding from './pages/reseller/OnboardingPage';

import ResellerDeveloper from './pages/reseller/DeveloperPage';

// Customer pages
import CustomerDashboard from './pages/customer/DashboardPage';
import CustomerOrders from './pages/customer/OrdersPage';
import CustomerSubscriptions from './pages/customer/SubscriptionsPage';
import CustomerInvoices from './pages/customer/InvoicesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Route Guards ──────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { hasRole, isLoading, isAuthenticated, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasRole(role) && !user?.roles?.includes('SUPER_ADMIN')) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function RedirectByRole() {
  const { isSuperAdmin, isReseller } = useAuth();
  if (isSuperAdmin()) return <Navigate to="/admin" replace />;
  if (isReseller()) return <Navigate to="/reseller" replace />;
  return <Navigate to="/app/dashboard" replace />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ImpersonationBanner />
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/services/:slug" element={<ServiceDetailPage />} />
            </Route>

            {/* Auth */}
            <Route path="/install" element={<InstallerPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Role redirect */}
            <Route path="/app" element={<RequireAuth><RedirectByRole /></RequireAuth>} />

            {/* Admin */}
            <Route path="/admin" element={
              <RequireAuth>
                <RequireRole role="SUPER_ADMIN">
                  <AdminLayout />
                </RequireRole>
              </RequireAuth>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="organizations" element={<AdminOrganizations />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="wallets" element={<AdminWallets />} />
              <Route path="offers" element={<AdminOffers />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="automation" element={<AdminAutomation />} />
              <Route path="system-health" element={<SystemHealthPage />} />
              <Route path="cms" element={<AdminCms />} />
            </Route>

            {/* Reseller */}
            <Route path="/reseller" element={
              <RequireAuth>
                <RequireRole role="RESELLER">
                  <ResellerLayout />
                </RequireRole>
              </RequireAuth>
            }>
              <Route index element={<ResellerDashboard />} />
              <Route path="customers" element={<ResellerCustomers />} />
              <Route path="customers/:id" element={<ResellerCustomerDetail />} />
              <Route path="orders" element={<ResellerOrders />} />
              <Route path="wallet" element={<ResellerWallet />} />
              <Route path="profit" element={<ResellerProfit />} />
              <Route path="subscriptions" element={<ResellerSubscriptions />} />
              <Route path="onboarding" element={<ResellerOnboarding />} />
              <Route path="developer" element={<ResellerDeveloper />} />
            </Route>

            {/* Customer */}
            <Route path="/app" element={
              <RequireAuth>
                <CustomerLayout />
              </RequireAuth>
            }>
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="orders" element={<CustomerOrders />} />
              <Route path="subscriptions" element={<CustomerSubscriptions />} />
              <Route path="invoices" element={<CustomerInvoices />} />
              <Route path="marketplace" element={<MarketplacePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
