# How to Deploy from GitHub to cPanel (Complete Step-by-Step Guide)

This guide walks you through pushing your repository to GitHub and deploying it to **cPanel** using two methods:
1. **Method A: cPanel Git™ Version Control** (Manual 1-Click Pull inside cPanel).
2. **Method B: Automated GitHub Actions** (Deploys automatically whenever you `git push`).

---

## 📌 Step 1: Push Code to your GitHub Repository

First, create a repository on GitHub (e.g. `https://github.com/your-username/b2b2c-saas-platform.git`) and push your code:

```bash
# In your project folder:
git init
git add .
git commit -m "Initial commercial release v1.0.0"

# Link your GitHub repository
git remote add origin https://github.com/your-username/b2b2c-saas-platform.git
git branch -M main
git push -u origin main
```

---

## 🛠️ Method A: Deploy using cPanel Git™ Version Control (Easiest)

### Step A.1: Create MySQL Database in cPanel
1. Log into your **cPanel**.
2. Go to **MySQL® Database Wizard**.
3. Create a database name: `yourcpanel_saasdb`.
4. Create a database user & password: `yourcpanel_user` / `StrongPassword123!`.
5. Assign **ALL PRIVILEGES** to the user.

### Step A.2: Clone GitHub Repo inside cPanel
1. In cPanel, search for **Git™ Version Control**.
2. Click **Create** button.
3. Turn **OFF** "Create a New Repository" (Toggle to *Clone a Repository*).
4. Fill in:
   - **Clone URL**: `https://github.com/your-username/b2b2c-saas-platform.git`
   - **Repository Path**: `public_html` (or `repositories/b2b2c-saas-platform`)
   - **Repository Name**: `b2b2c-saas-platform`
5. Click **Create**.

### Step A.3: Set Folder Permissions
In cPanel **File Manager**:
- Ensure `backend/storage` and `backend/bootstrap/cache` permissions are set to **`775`** or **`755`** (Writable).

### Step A.4: Run Web Installer Wizard
Open your browser and navigate to:
```text
https://yourdomain.com/install
```
Follow the 5-step installer wizard:
1. Requirements check.
2. Enter Database Host (`localhost`), Database Name (`yourcpanel_saasdb`), Username (`yourcpanel_user`), Password (`StrongPassword123!`).
3. Click **Test Connection**.
4. Enter Super Admin Name, Email, Password, and Organization Name.
5. Click **Start Automatic Installation**.

---

## 🚀 Method B: Automated Deployment using GitHub Actions (CI/CD)

Whenever you push to GitHub, GitHub Actions will automatically compile your React frontend, install Laravel backend dependencies, and upload everything to your cPanel host via FTP/SFTP.

### Step B.1: Get FTP Credentials from cPanel
1. In cPanel, go to **FTP Accounts**.
2. Create an FTP account pointing to `public_html/`.
3. Note your FTP Server host (e.g. `ftp.yourdomain.com` or server IP), FTP Username, and FTP Password.

### Step B.2: Add Secrets in GitHub Repository
1. Go to your GitHub Repository $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Click **New repository secret** and add the following 3 secrets:
   - `CPANEL_FTP_SERVER`: `ftp.yourdomain.com` (or IP address)
   - `CPANEL_FTP_USERNAME`: `ftpuser@yourdomain.com`
   - `CPANEL_FTP_PASSWORD`: `YourFTPPassword`

### Step B.3: Trigger Automated Deployment
Simply push your changes to GitHub:
```bash
git add .
git commit -m "Deploy latest changes"
git push origin main
```
GitHub Actions will automatically run `.github/workflows/deploy-cpanel.yml` and deploy to cPanel in ~2 minutes!

---

## ⏰ Step 3: Setup cPanel Cron Job for Recurring Tasks

To enable automated subscription renewals, email/whatsapp notifications, and queue workers:

1. In cPanel, search for **Cron Jobs**.
2. Select Common Setting: **Once Per Minute (`* * * * *`)**.
3. Command:
   ```bash
   /usr/local/bin/php /home/yourusername/public_html/backend/artisan schedule:run >> /dev/null 2>&1
   ```
4. Click **Add New Cron Job**.

---

## 📁 Summary Checklist

- [x] Code pushed to GitHub (`main` branch)
- [x] MySQL database created in cPanel
- [x] Repository cloned or deployed via FTP Action
- [x] Web Installer executed at `https://yourdomain.com/install`
- [x] Cron job configured (`* * * * *`)
