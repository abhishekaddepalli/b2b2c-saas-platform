// ─── Core Auth Types ──────────────────────────────────────────────────────────

export type PricingRole = 'admin' | 'reseller' | 'customer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'platform' | 'reseller';
  status: 'active' | 'suspended' | 'pending';
  primary_color: string;
  logo_path: string | null;
  wallet_enabled: boolean;
  currency: string;
  brand_name?: string;
  pricing_tier?: string;
  credit_limit?: number;
  min_wallet_balance?: number;
  wallet?: {
    id?: string;
    balance: number;
    available_balance: number;
    currency: string;
  };
  users?: {
    id: string;
    name: string;
    email: string;
  }[];
  metadata?: {
    margin_percentage?: number;
    saas_plan?: string;
    assigned_services?: string[];
    assigned_products?: string[];
    service_margins?: Record<string, number>;
  };
  created_at?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone: string | null;
  avatar_path: string | null;
  status: 'active' | 'suspended' | 'pending';
  email_verified: boolean;
  timezone: string;
  locale: string;
  roles: string[];
  permissions: string[];
  pricing_role: PricingRole;
  last_login_at: string | null;
  organization: Organization | null;
  created_at: string;
}

export type User = AuthUser;

// ─── Pricing Types (role-aware) ────────────────────────────────────────────────

export interface AdminPricing {
  cost_price: number;
  reseller_price: number;
  customer_price: number;
  platform_margin: number;
  reseller_margin: number;
  tax_rate: number;
  tax_label: string;
  tax_inclusive: boolean;
  currency: string;
}

export interface ResellerPricing {
  your_price: number;
  customer_price: number;
  your_profit: number;
  tax_rate: number;
  tax_label: string;
  tax_inclusive: boolean;
  currency: string;
}

export interface CustomerPricing {
  price: number;
  tax_rate: number;
  tax_label: string;
  tax_inclusive: boolean;
  currency: string;
}

export type Pricing = AdminPricing | ResellerPricing | CustomerPricing;

// ─── Catalog Types ────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_path: string | null;
  type: 'product' | 'service' | 'both';
  featured: boolean;
  sort_order: number;
}

export interface ProductImage {
  id: number;
  path: string;
  alt_text: string | null;
  is_primary: boolean;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  type: 'physical' | 'digital' | 'license' | 'hardware' | 'software' | 'other';
  status: 'draft' | 'active' | 'archived';
  visibility: 'public' | 'reseller_only' | 'hidden';
  featured: boolean;
  stock_quantity: number | null;
  tags: string[];
  category: Category | null;
  images: ProductImage[];
  pricing?: Pricing;
  created_at: string;
}

export interface ServicePlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[] | null;
  is_popular: boolean;
  sort_order: number;
  pricing?: Pricing;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  status: 'draft' | 'active' | 'archived';
  visibility: 'public' | 'reseller_only' | 'hidden';
  featured: boolean;
  billing_type: 'one_time' | 'recurring';
  billing_interval: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
  trial_days: number;
  category: Category | null;
  plans: ServicePlan[];
}

// ─── Order Types ──────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'payment_processing' | 'paid' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  final_price_at_purchase: number;
  cost_price_at_purchase: number;
  reseller_price_at_purchase: number;
  customer_price_at_purchase: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  currency: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  total_amount?: number;
  items: OrderItem[];
  placed_at: string;
  paid_at: string | null;
  created_at?: string;
}

// ─── Subscription Types ───────────────────────────────────────────────────────

export type SubscriptionStatus = 'trial' | 'active' | 'payment_failed' | 'grace_period' | 'suspended' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  amount: number;
  recurring_amount?: number;
  currency: string;
  billing_interval: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_at: string;
  auto_renew: boolean;
  service_plan: ServicePlan & { service?: Service };
  created_at?: string;
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────

export type TransactionType = 'credit' | 'debit' | 'refund' | 'reversal' | 'adjustment' | 'reservation' | 'release';

export interface WalletBalance {
  wallet_id: string;
  available_balance: number;
  reserved_balance: number;
  credit_limit: number;
  spendable: number;
  currency: string;
  status: 'active' | 'frozen' | 'suspended';
  last_transaction_at: string | null;
}

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

// ─── Admin Dashboard Types ────────────────────────────────────────────────────

export interface DashboardStats {
  organizations: number;
  total_users: number;
  customers: number;
  resellers: number;
  orders: {
    total: number;
    today: number;
    pending: number;
    this_month: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    grace_period: number;
    suspended: number;
  };
  revenue: {
    total_revenue: number;
    platform_profit: number;
    reseller_profit: number;
    today_revenue: number;
    month_revenue: number;
  };
  attention_required: {
    failed_payments: number;
    payment_failed_subs: number;
    expiring_subscriptions: number;
    suspended_subscriptions: number;
    low_wallet_orgs: number;
    pending_orgs: number;
  };
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
