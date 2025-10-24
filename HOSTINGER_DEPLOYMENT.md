# Hostinger VPS Deployment Guide

This guide will help you deploy your Customer Management application to Hostinger VPS.

## ⚠️ IMPORTANT: Authentication Change Required

**Replit Auth will NOT work on Hostinger.** You need to disable authentication or implement a different auth system.

## Prerequisites

- Hostinger VPS plan (Basic or higher)
- Domain name pointed to your VPS IP
- SSH access to your VPS
- Basic knowledge of Linux terminal

---

## Step 1: Connect to Your VPS

1. Open your terminal (Command Prompt/PowerShell on Windows, Terminal on Mac/Linux)
2. Connect via SSH:
```bash
ssh root@your-vps-ip-address
```
Enter your password when prompted.

---

## Step 2: Update System & Install Node.js

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v
npm -v
```

---

## Step 3: Install Required Software

```bash
# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx (Web Server)
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

---

## Step 4: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user (run these in PostgreSQL prompt)
CREATE DATABASE customer_management;
CREATE USER your_db_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE customer_management TO your_db_user;
\q
```

---

## Step 5: Configure Firewall

```bash
# Install and configure UFW firewall
sudo apt install ufw -y
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL
sudo ufw enable
```

---

## Step 6: Clone Your Application

### Option A: Upload files via SFTP
Use FileZilla or WinSCP to upload your project files to `/var/www/customer-management`

### Option B: Clone from GitHub
```bash
# Create directory
sudo mkdir -p /var/www/customer-management
cd /var/www/customer-management

# Clone your repository (you need to push your code to GitHub first)
git clone https://github.com/yourusername/your-repo.git .
```

---

## Step 7: Prepare Application Files

### 7.1 Create .env file

```bash
cd /var/www/customer-management
nano .env
```

Add the following content (replace with your values):
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://your_db_user:your_strong_password@localhost:5432/customer_management
SESSION_SECRET=your-super-secret-session-key-change-this-to-something-random
PGHOST=localhost
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_strong_password
PGDATABASE=customer_management
```

Press `Ctrl + X`, then `Y`, then `Enter` to save.

### 7.2 Install Dependencies

```bash
npm install --production=false
```

### 7.3 Build the Application

```bash
npm run build
```

---

## Step 8: Setup Database Tables

```bash
# Push database schema
npm run db:push
```

---

## Step 9: Start Application with PM2

Create PM2 ecosystem file:

```bash
nano ecosystem.config.cjs
```

Add this content:
```javascript
module.exports = {
  apps: [{
    name: 'customer-management',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

Save and exit (`Ctrl + X`, `Y`, `Enter`).

Start the application:
```bash
# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
```

Copy and run the command that PM2 outputs.

---

## Step 10: Configure Nginx

Remove default configuration:
```bash
sudo rm /etc/nginx/sites-enabled/default
```

Create new configuration:
```bash
sudo nano /etc/nginx/sites-available/customer-management
```

Add this content (replace `yourdomain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/customer-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 11: Setup SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to complete SSL setup.

---

## Step 12: Verify Installation

1. Visit your domain in a browser: `https://yourdomain.com`
2. You should see your application running!

---

## Useful PM2 Commands

```bash
# View running apps
pm2 list

# View logs
pm2 logs customer-management

# Restart app
pm2 restart customer-management

# Stop app
pm2 stop customer-management

# Monitor resources
pm2 monit
```

---

## Troubleshooting

### App not starting?
```bash
pm2 logs customer-management --lines 100
```

### Database connection error?
Check your DATABASE_URL in .env file and ensure PostgreSQL is running:
```bash
sudo systemctl status postgresql
```

### Nginx error?
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Check app is running:
```bash
curl http://localhost:5000
```

---

## Important Notes

1. **Replit Auth will NOT work** - The application currently uses Replit Auth which only works on Replit. You have two options:
   - Option A: Disable authentication (see instructions below)
   - Option B: Implement a different auth system (complex)

2. **To Disable Authentication Temporarily:**
   - I can help you remove the authentication requirement so the app works immediately
   - This is recommended for initial testing

3. **Database Backup:**
   - Regularly backup your database:
   ```bash
   pg_dump -U your_db_user customer_management > backup.sql
   ```

Would you like me to disable authentication so the app works on Hostinger?
