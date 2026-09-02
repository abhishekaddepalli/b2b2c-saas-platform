import axios, { AxiosError, type AxiosResponse } from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }
  return '/api/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false,
});

// Attach Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: object) => api.post('/auth/register', data),
  login: (data: object) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: object) => api.post('/auth/reset-password', data),
  changePassword: (data: object) => api.post('/auth/change-password', data),
  resendVerification: () => api.post('/auth/resend-verification'),
};

// ─── Marketplace ──────────────────────────────────────────────────────────────

export const marketplaceApi = {
  home: () => api.get('/marketplace'),
  products: (params?: object) => api.get('/marketplace/products', { params }),
  product: (slug: string) => api.get(`/marketplace/products/${slug}`),
  services: (params?: object) => api.get('/marketplace/services', { params }),
  service: (slug: string) => api.get(`/marketplace/services/${slug}`),

  // Recommendations, Wishlist, and Reviews
  recommendations: () => api.get('/marketplace/recommendations'),
  wishlist: () => api.get('/marketplace/wishlist'),
  toggleWishlist: (data: object) => api.post('/marketplace/wishlist/toggle', data),
  reviews: (id: string, params?: object) => api.get(`/marketplace/items/${id}/reviews`, { params }),
  storeReview: (id: string, data: object) => api.post(`/marketplace/items/${id}/reviews`, data),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  list: (params?: object) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: object) => api.post('/orders', data),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptionsApi = {
  list: (params?: object) => api.get('/subscriptions', { params }),
  get: (id: string) => api.get(`/subscriptions/${id}`),
  cancel: (id: string) => api.post(`/subscriptions/${id}/cancel`),
};

// ─── Reseller ─────────────────────────────────────────────────────────────────

export const resellerApi = {
  dashboard: () => api.get('/reseller/dashboard'),
  wallet: () => api.get('/reseller/wallet'),
  walletTransactions: (params?: object) => api.get('/reseller/wallet/transactions', { params }),
  rechargeWallet: (data: object) => api.post('/reseller/wallet/recharge', data),
  customers: (params?: object) => api.get('/reseller/customers', { params }),
  customer: (id: string) => api.get(`/reseller/customers/${id}`),
  createCustomer: (data: object) => api.post('/reseller/customers', data),
  updateCustomer: (id: string, data: object) => api.put(`/reseller/customers/${id}`, data),
  customerOrders: (id: string) => api.get(`/reseller/customers/${id}/orders`),
  customerSubscriptions: (id: string) => api.get(`/reseller/customers/${id}/subscriptions`),
  orders: (params?: object) => api.get('/reseller/orders', { params }),
  createOrder: (data: object) => api.post('/reseller/orders', data),
  profit: (params?: object) => api.get('/reseller/profit', { params }),
  profitChart: () => api.get('/reseller/profit/chart'),
  services: (params?: object) => api.get('/reseller/services', { params }),
  subscriptions: (params?: object) => api.get('/reseller/subscriptions', { params }),

  // Onboarding & KYC
  onboarding: () => api.get('/reseller/onboarding'),
  updateProfile: (data: object) => api.post('/reseller/onboarding/profile', data),
  submitKyc: (data: object) => api.post('/reseller/onboarding/kyc', data),
  acceptTerms: () => api.post('/reseller/onboarding/terms'),
  submitOnboarding: () => api.post('/reseller/onboarding/submit'),

  // API SaaS & Webhook Integrations
  apiKeys: () => api.get('/reseller/api-keys'),
  createApiKey: (data: object) => api.post('/reseller/api-keys', data),
  revokeApiKey: (id: string) => api.post(`/reseller/api-keys/${id}/revoke`),
  webhooks: () => api.get('/reseller/webhooks'),
  createWebhook: (data: object) => api.post('/reseller/webhooks', data),
  apiUsage: (params?: object) => api.get('/reseller/api-usage', { params }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  revenueChart: () => api.get('/admin/dashboard/revenue-chart'),

  // Products
  products: (params?: object) => api.get('/admin/products', { params }),
  createProduct: (data: object) => api.post('/admin/products', data),
  updateProduct: (id: string, data: object) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  updateProductStatus: (id: string, status: string) => api.post(`/admin/products/${id}/status`, { status }),

  // Services
  services: (params?: object) => api.get('/admin/services', { params }),
  createService: (data: object) => api.post('/admin/services', data),

  // Categories
  categories: (params?: object) => api.get('/admin/categories', { params }),
  createCategory: (data: object) => api.post('/admin/categories', data),

  // Organizations & Onboarding Approval
  organizations: (params?: object) => api.get('/admin/organizations', { params }),
  organization: (id: string) => api.get(`/admin/organizations/${id}`),
  updateOrgStatus: (id: string, status: string) => api.post(`/admin/organizations/${id}/status`, { status }),
  approveOrg: (id: string, data?: object) => api.post(`/admin/organizations/${id}/approve`, data),
  rejectOrg: (id: string, data: object) => api.post(`/admin/organizations/${id}/reject`, data),

  // Users
  users: (params?: object) => api.get('/admin/users', { params }),

  // Wallet management
  wallets: (params?: object) => api.get('/admin/wallets', { params }),
  adjustWallet: (orgId: string, data: object) => api.post(`/admin/wallets/${orgId}/adjust`, data),
  walletAdjust: (orgId: string, data: object) => api.post(`/admin/wallets/${orgId}/adjust`, data),

  // Orders / Subscriptions
  orders: (params?: object) => api.get('/admin/orders', { params }),
  subscriptions: (params?: object) => api.get('/admin/subscriptions', { params }),
  suspendSubscription: (id: string) => api.post(`/admin/subscriptions/${id}/suspend`),
  reactivateSubscription: (id: string) => api.post(`/admin/subscriptions/${id}/reactivate`),

  // Reports
  profits: (params?: object) => api.get('/admin/profits', { params }),
  profitSummary: () => api.get('/admin/profits/summary'),
  reportsRevenue: (params?: object) => api.get('/admin/reports/revenue', { params }),
  reportsResellers: (params?: object) => api.get('/admin/reports/resellers', { params }),
  reportsSubscriptions: (params?: object) => api.get('/admin/reports/subscriptions', { params }),
  reportsProfitability: () => api.get('/admin/reports/profitability'),
  exportReportsCsv: () => api.get('/admin/reports/export-csv', { responseType: 'blob' }),
  reports: {
    revenue: (params?: object) => api.get('/admin/reports/revenue', { params }),
    resellers: (params?: object) => api.get('/admin/reports/resellers', { params }),
    subscriptions: (params?: object) => api.get('/admin/reports/subscriptions', { params }),
  },

  // Settings
  settings: () => api.get('/admin/settings'),
  updateSettings: (data: object) => api.put('/admin/settings', data),

  // Audit logs
  auditLogs: (params?: object) => api.get('/admin/audit-logs', { params }),

  // Offers / Coupons / Ads
  offers: (params?: object) => api.get('/admin/offers', { params }),
  createOffer: (data: object) => api.post('/admin/offers', data),
  coupons: (params?: object) => api.get('/admin/coupons', { params }),
  createCoupon: (data: object) => api.post('/admin/coupons', data),
  advertisements: (params?: object) => api.get('/admin/advertisements', { params }),
  createAd: (data: object) => api.post('/admin/advertisements', data),

  // SaaS Monetization Plans
  saasPlans: (params?: object) => api.get('/admin/saas-plans', { params }),
  createSaasPlan: (data: object) => api.post('/admin/saas-plans', data),
  updateSaasPlan: (id: string, data: object) => api.put(`/admin/saas-plans/${id}`, data),

  // Automation Center
  automationTemplates: () => api.get('/admin/automation/templates'),
  saveAutomationTemplate: (data: object) => api.post('/admin/automation/templates', data),
  toggleAutomationTemplate: (id: string) => api.post(`/admin/automation/templates/${id}/toggle`),
  testAutomationTrigger: (data: object) => api.post('/admin/automation/test-trigger', data),

  // Platform Control Center & Observability
  controlCenterHealth: () => api.get('/admin/control-center/health'),
  systemHealth: () => api.get('/admin/system-health'),
  globalSearch: (q: string) => api.get('/admin/control-center/search', { params: { q } }),
  controlCenterAnnouncements: () => api.get('/admin/control-center/announcements'),
  createAnnouncement: (data: object) => api.post('/admin/control-center/announcements', data),
};

export const saasPlansApi = {
  list: () => api.get('/saas-plans'),
  current: () => api.get('/saas-plans/current'),
  subscribe: (data: object) => api.post('/saas-plans/subscribe', data),
  cancel: (data?: object) => api.post('/saas-plans/cancel', data),
};

export const installerApi = {
  status: () => api.get('/install_api.php?action=status'),
  requirements: () => api.get('/install_api.php?action=requirements'),
  testDb: (data: object) => api.post('/install_api.php?action=test-db', data),
  execute: (data: object) => api.post('/install_api.php?action=execute', data),
};
