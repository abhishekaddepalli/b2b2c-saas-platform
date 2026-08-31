# Production Deployment & Operations Guide

This guide details the complete production deployment architecture, environment configuration, container orchestration, background queue workers, cron scheduler setup, database backup procedures, SSL certificates, Nginx reverse proxy, log rotation, and operational runbooks for the **B2B2C Multi-Tenant SaaS Platform**.

---

## 1. System Requirements & Architecture Stack

### Infrastructure Stack
- **OS**: Ubuntu 22.04 LTS / Debian 12 / Enterprise Linux 9
- **Container Runtime**: Docker 24.0+ & Docker Compose v2.20+
- **Application Server**: PHP 8.3-FPM + Nginx 1.25 (Alpine containerized)
- **Database Engine**: PostgreSQL 16 (Pessimistic Row Locking Enabled)
- **Cache & Queue Server**: Redis 7.2 Alpine (`volatile-lru` eviction policy)
- **Frontend Stack**: React 18 + Vite 5 + TypeScript 5 (Static SPA served via Nginx or Cloudfront CDN)

---

## 2. Environment Configuration (`.env`)

Copy `backend/.env.example` to `backend/.env` on the server and configure production values:

```bash
# Application Mode
APP_NAME="B2B2C SaaS Platform"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database Connection (PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=saas_platform
DB_USERNAME=saas_user
DB_PASSWORD=YOUR_STRONG_PRODUCTION_DB_PASSWORD

# Redis Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=redis
REDIS_PASSWORD=YOUR_STRONG_REDIS_PASSWORD
REDIS_PORT=6379

# Payment Gateway Credentials (Production Keys)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_RAZORPAY_WEBHOOK_SECRET

PHONEPE_MERCHANT_ID=YOUR_PHONEPE_MID
PHONEPE_SALT_KEY=YOUR_PHONEPE_SALT
PHONEPE_SALT_INDEX=1

CASHFREE_APP_ID=YOUR_CASHFREE_APP_ID
CASHFREE_SECRET_KEY=YOUR_CASHFREE_SECRET

STRIPE_KEY=pk_live_xxxxxxxx
STRIPE_SECRET=sk_live_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

---

## 3. Production Deployment Commands

### 3.1 Step 1: Docker Containers Launch
```bash
# Spin up production services in detached mode
docker compose up -d --build
```

### 3.2 Step 2: Database Migration & Seeding (Initial Setup Only)
```bash
# Execute production migrations
docker compose exec app php artisan migrate --force

# Seed essential roles, permissions, and super admin
docker compose exec app php artisan db:seed --class=RolesAndPermissionsSeeder --force
docker compose exec app php artisan db:seed --class=OrganizationSeeder --force
docker compose exec app php artisan db:seed --class=UserSeeder --force
```

### 3.3 Step 3: Storage Symlink & Caching
```bash
docker compose exec app php artisan storage:link
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
docker compose exec app php artisan event:cache
```

### 3.4 Step 4: Frontend Static Compilation
```bash
cd frontend
npm ci
npm run build
# Deploy 'dist/' folder to web server or S3/Cloudfront CDN
```

---

## 4. Background Queue Worker Setup

The platform uses Redis queues for asynchronous order fulfillment, notifications, and billing renewals.

### Supervisor Configuration (`/etc/supervisor/conf.d/saas-worker.conf`)
```ini
[program:saas-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=docker compose -f /var/www/saas-platform/docker-compose.yml exec -T app php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=root
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/saas-queue-worker.log
```

Reload Supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start saas-queue-worker:*
```

---

## 5. Cron Scheduler Setup (Subscription Renewals & Reminders)

To run subscription auto-renewals, retry attempts, grace period expirations, and renewal reminders automatically, add the Laravel scheduler to system crontab:

```bash
# Edit crontab
sudo crontab -e
```

Add line:
```cron
* * * * * cd /var/www/saas-platform && docker compose exec -T app php artisan schedule:run >> /dev/null 2>&1
```

Scheduled Jobs Triggered Automatically:
- **`RenewSubscriptionsJob`**: Daily at 00:00 (Processes renewals, trials, and grace period transitions).
- **`SendSubscriptionRemindersJob`**: Daily at 08:00 (Dispatches 7d, 3d, 1d, 0d renewal reminders).

---

## 6. PostgreSQL Database Backup & Recovery

### 6.1 Automated Daily Database Backup Script (`/usr/local/bin/backup-saas-db.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/saas_platform"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="saas_db_${TIMESTAMP}.sql.gz"

mkdir -p ${BACKUP_DIR}

docker compose -f /var/www/saas-platform/docker-compose.yml exec -T postgres pg_dump -U saas_user saas_platform | gzip > ${BACKUP_DIR}/${FILENAME}

# Retain backups for 30 days
find ${BACKUP_DIR} -type f -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_DIR}/${FILENAME}"
```

Add backup cron job (Every night at 02:00 AM):
```cron
0 2 * * * /bin/bash /usr/local/bin/backup-saas-db.sh >> /var/log/saas-db-backup.log 2>&1
```

---

## 7. Nginx Reverse Proxy & SSL Setup

### 7.1 Nginx Server Block (`/etc/nginx/sites-available/saas-platform.conf`)
```nginx
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### 7.2 Certbot SSL Certificate Renewal
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com -d yourdomain.com
```

---

## 8. Log Rotation Strategy (`/etc/logrotate.d/saas-platform`)

```text
/var/log/saas-*.log /var/www/saas-platform/backend/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

---

## 9. Health & Performance Monitoring

1. **API Health Endpoint**: `GET /api/v1/marketplace/categories` $\rightarrow$ `200 OK`
2. **Automated Test Execution**:
   ```bash
   docker compose exec app ./vendor/bin/pest
   ```
   Must return **37 passing tests (191 assertions)**.
3. **Queue Health**: `docker compose exec app php artisan queue:failed` $\rightarrow$ No failed jobs.
