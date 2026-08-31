# B2B2C Product & Service Marketplace SaaS Platform

A production-ready multi-tenant SaaS platform with role-aware pricing, atomic wallets, idempotent payment webhooks, and automatic subscription billing.

---

## Architecture

```
SUPER ADMIN
    ↓  (sets cost / reseller / customer pricing)
RESELLER / ORGANIZATION  (tenant — isolated data, wallet, profit)
    ↓  (buys at reseller price, resells at customer price)
CUSTOMER
```

**Stack:**
- Backend: Laravel 12, PHP 8.4, PostgreSQL, Redis, Sanctum, Spatie Permissions
- Frontend: React 18, TypeScript, Tailwind CSS, TanStack Query, React Router, Recharts
- Infrastructure: Docker, Nginx, Redis, PostgreSQL, Queue workers, Scheduler

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)

### 1. Backend setup

```bash
cd backend
cp .env.example .env

# Start all services
docker-compose up -d

# Generate app key
docker-compose exec app php artisan key:generate

# Run migrations
docker-compose exec app php artisan migrate

# Seed development data
docker-compose exec app php artisan db:seed

# Backend API available at: http://localhost:8000/api/v1
```

### 2. Frontend setup

```bash
cd frontend
npm install

# Copy and configure environment
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local

npm run dev
# Frontend available at: http://localhost:3000
```

---

## Demo Credentials (after seeding)

| Role        | Email                          | Password         |
|-------------|--------------------------------|------------------|
| Super Admin | admin@saasplatform.com         | Admin@1234       |
| Reseller 1  | ravi@techsolutions.com         | Reseller@1234    |
| Reseller 2  | priya@cloudventures.com        | Reseller@1234    |
| Reseller 3  | anil@digitaledge.com           | Reseller@1234    |
| Customer    | anjali@example.com             | Customer@1234    |

---

## Key Architectural Decisions

### Role-Aware Pricing
Pricing is computed **server-side** on every request — never trusted from the frontend.

| Role     | Sees                                              |
|----------|---------------------------------------------------|
| Admin    | cost_price, reseller_price, customer_price, margins |
| Reseller | your_price, customer_price, your_profit           |
| Customer | price only                                        |

The mapping is enforced in `PricingService` and applied in API Resources. Cost price never appears in reseller or customer responses.

### Tenant Isolation
Every model that belongs to a reseller org has `organization_id`. The `TenantScope` global Eloquent scope auto-applies `WHERE organization_id = ?` for all non-admin users. Super Admins bypass it via `withoutTenantScope()`. Policies provide defense-in-depth.

### Atomic Wallet
Every balance mutation runs inside `DB::transaction()` with `SELECT ... FOR UPDATE` row locking. Ledger rows (`wallet_transactions`) are immutable — corrections are new `reversal`/`refund` rows. Idempotency keys prevent double-credit on webhook replay.

### Idempotent Webhooks
```
receive → verify signature → INSERT webhook_events(event_id UNIQUE)
  → duplicate? → ack 200, stop
  → new? → run business logic inside DB transaction → mark processed
```

### Price Snapshots
`order_items` stores `cost_price_at_purchase`, `reseller_price_at_purchase`, `customer_price_at_purchase` at order time. Profit reports always read from these snapshots, never from live `prices` table — guaranteeing historical accuracy even when prices change.

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

All protected endpoints require: `Authorization: Bearer {token}`

### Auth
| Method | Endpoint                         | Description               |
|--------|----------------------------------|---------------------------|
| POST   | /auth/register                   | Create account            |
| POST   | /auth/login                      | Login, returns token      |
| POST   | /auth/logout                     | Invalidate current token  |
| GET    | /auth/me                         | Authenticated user info   |
| POST   | /auth/forgot-password            | Send reset link           |
| POST   | /auth/reset-password             | Reset password            |

### Marketplace (public + role-aware)
| Method | Endpoint                         | Description               |
|--------|----------------------------------|---------------------------|
| GET    | /marketplace                     | Homepage (banners, featured) |
| GET    | /marketplace/products            | Product listing           |
| GET    | /marketplace/products/{slug}     | Product detail            |
| GET    | /marketplace/services            | Service listing           |
| GET    | /marketplace/services/{slug}     | Service detail            |

### Reseller (`role:RESELLER`)
| Method | Endpoint                         | Description               |
|--------|----------------------------------|---------------------------|
| GET    | /reseller/wallet                 | Wallet balance            |
| GET    | /reseller/wallet/transactions    | Transaction ledger        |
| POST   | /reseller/wallet/recharge        | Initiate recharge         |
| GET    | /reseller/customers              | Customer list             |
| POST   | /reseller/customers              | Add customer              |
| GET    | /reseller/orders                 | Orders for org            |
| GET    | /reseller/profit                 | Profit breakdown          |

### Admin (`role:SUPER_ADMIN`)
| Method | Endpoint                         | Description               |
|--------|----------------------------------|---------------------------|
| GET    | /admin/dashboard                 | Platform KPIs             |
| GET/POST/PUT/DELETE | /admin/products       | Product CRUD              |
| GET/POST/PUT/DELETE | /admin/services       | Service CRUD              |
| GET    | /admin/wallets                   | All org wallets           |
| POST   | /admin/wallets/{orgId}/adjust    | Manual wallet adjustment  |
| GET    | /admin/profits                   | Platform profit records   |
| GET    | /admin/reports/revenue           | Revenue report            |
| GET    | /admin/audit-logs                | Audit trail               |

### Webhooks (no auth — signature verified internally)
| Method | Endpoint                         | Description               |
|--------|----------------------------------|---------------------------|
| POST   | /webhooks/razorpay               | Razorpay events           |
| POST   | /webhooks/phonepe                | PhonePe events            |

---

## Running Tests

```bash
docker-compose exec app php artisan test
# or with Pest directly:
docker-compose exec app ./vendor/bin/pest --coverage
```

Tests cover:
- Authentication (register, login, logout, token invalidation)
- RBAC (role access enforcement)
- Tenant isolation (cross-org data leakage prevention)
- Pricing visibility (cost never exposed to customer/reseller)
- Wallet operations (credit, debit, insufficient balance, idempotency, immutability)
- Pricing engine (fixed, percentage, tier)

---

## Build Phases

| Phase | Status      | Scope |
|-------|-------------|-------|
| 1     | ✅ Complete | Auth, RBAC, tenant isolation, pricing engine, wallet engine, base API, frontend shell |
| 2     | 🔄 Next     | Full marketplace, product/service CRUD, category management |
| 3     | ⏳ Pending  | Full order flow, checkout, reseller customer management |
| 4     | ⏳ Pending  | Subscriptions, auto-renewal, retry logic, grace periods |
| 5     | ⏳ Pending  | Payment gateway integration (Razorpay, PhonePe, Cashfree) |
| 6     | ⏳ Pending  | Offers, coupons, advertisements, reports |
| 7     | ⏳ Pending  | White label, support tickets, audit log viewer, settings UI |
| 8     | ⏳ Pending  | UI polish, performance, deployment hardening |

---

## Environment Variables

See `backend/.env.example` for the full list. Critical variables:

```env
# Database
DB_CONNECTION=pgsql
DB_DATABASE=saas_platform
DB_USERNAME=saas_user
DB_PASSWORD=secret

# Redis
REDIS_PASSWORD=redis_secret

# Payment Gateways (never commit these)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

**Never commit `.env`, API keys, or webhook secrets to git.**

---

## Git Workflow

```bash
git commit -m "feat(auth): registration, login, email verification, sanctum tokens"
git commit -m "feat(pricing): role-aware pricing service with tier and custom price support"
git commit -m "feat(wallet): atomic wallet engine with idempotency and immutable ledger"
git commit -m "feat(marketplace): product/service listing with role-filtered pricing"
git commit -m "feat(subscriptions): renewal scheduler, grace period, suspension state machine"
git commit -m "fix(wallet): prevent race condition on concurrent debit requests"
```

---

## Security Notes

1. **Backend is authoritative** — prices, roles, org IDs are never accepted from frontend input
2. **Webhook signatures verified** before any payload is processed
3. **Wallet mutations** use `SELECT FOR UPDATE` + DB transactions — no optimistic locking
4. **Idempotency keys** are unique-constrained at DB level, not just checked in application code
5. **Tenant scope** applies as Eloquent global scope — not just controller filters
6. **Audit log** records all pricing changes, wallet adjustments, and admin actions
