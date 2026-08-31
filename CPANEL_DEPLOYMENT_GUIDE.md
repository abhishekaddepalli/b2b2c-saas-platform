# cPanel Web Hosting Deployment Guide & Web Installer

Complete step-by-step instructions for deploying the **Commercial B2B2C Multi-Tenant SaaS Platform** on any standard cPanel web hosting server using the graphical **Web Installer Wizard (`/install`)**.

---

## 1. Prerequisites for cPanel Hosting

- **PHP Version**: 8.2 or higher (Selectable in cPanel **Select PHP Version** or **MultiPHP Manager**).
- **Required Extensions**: `pdo_mysql` / `pdo_pgsql`, `openssl`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `curl`, `fileinfo`.
- **Database**: MySQL / MariaDB database created in cPanel.

---

## 2. Step 1: Create Database in cPanel

1. Log into your cPanel Control Panel.
2. Open **MySQL® Database Wizard**.
3. Create a new database name (e.g. `yourcpanel_saasdb`).
4. Create a new database user & strong password (e.g. `yourcpanel_dbuser` / `StrongPassword123!`).
5. Assign **ALL PRIVILEGES** to the database user.

---

## 3. Step 2: Upload Application Files

### Option A: Standard Deployment (Public HTML Root)
1. Compress all project files into a `.zip` file (excluding `node_modules`).
2. Open cPanel **File Manager** and navigate to `public_html/`.
3. Upload the `.zip` file and extract it.
4. Set folder permissions for `storage/` and `bootstrap/cache/` to `775` or `755` (Writable).

---

## 4. Step 3: Run Graphical Web Installer Wizard (`/install`)

1. Open your browser and navigate to:
   ```text
   https://your-domain.com/install
   ```
2. **Requirements Check Screen**:
   - The installer verifies PHP 8.2+, extensions, and folder permissions.
   - Click **Continue to Database**.
3. **Database Configuration Screen**:
   - **Driver**: Select `MySQL / MariaDB`.
   - **Host**: `localhost` (or `127.0.0.1`).
   - **Database Name**: Enter `yourcpanel_saasdb`.
   - **Username**: Enter `yourcpanel_dbuser`.
   - **Password**: Enter `StrongPassword123!`.
   - Click **Test Connection** $\rightarrow$ verifies connection.
4. **Super Admin Setup Screen**:
   - Enter Platform Brand Name, Super Admin Full Name, Email, Password, and Organization Name.
5. **Execute Installation**:
   - Click **Start Automatic Installation**.
   - The wizard runs migrations, seeds default roles/permissions, provisions Super Admin, generates `.env`, and creates the `storage/installed` lockfile.

---

## 5. Step 4: Configure Cron Job in cPanel Scheduler

1. Open cPanel **Cron Jobs**.
2. Set Common Settings to **Once Per Minute (`* * * * *`)**.
3. Enter Command:
   ```bash
   /usr/local/bin/php /home/username/public_html/artisan schedule:run >> /dev/null 2>&1
   ```
   *(Replace `/home/username/public_html/` with your actual cPanel document root path)*.
