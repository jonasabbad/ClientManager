# Simple Hostinger Deployment Guide - Step by Step

Follow these steps exactly in order. Don't skip any step!

---

## PART 1: PREPARE YOUR FILES

### Step 1: Download Project from Replit
1. In Replit, click the three dots (⋮) next to "Files"
2. Click "Download as zip"
3. Extract the zip file on your computer
4. **Delete these folders if they exist:**
   - `node_modules/`
   - `dist/`
   - `.replit` file

---

## PART 2: CONNECT TO YOUR VPS

### Step 2: Get Your VPS IP Address
1. Log into Hostinger
2. Go to "VPS" section
3. Find your VPS IP address (example: 123.45.67.89)
4. Get your root password (you should have received this by email)

### Step 3: Connect via SSH
1. Open Terminal (Mac/Linux) or Command Prompt (Windows)
2. Type this command (replace with YOUR IP):
```bash
ssh root@123.45.67.89
```
3. Type `yes` when asked
4. Enter your VPS password
5. You're now inside your VPS!

---

## PART 3: INSTALL SOFTWARE

### Step 4: Update System
Copy and paste this command:
```bash
apt update && apt upgrade -y
```
Wait for it to finish (2-3 minutes).

### Step 5: Install Node.js
Copy and paste these commands one by one:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```
```bash
apt-get install -y nodejs
```
```bash
node -v
```
You should see: v18.x.x

### Step 6: Install PM2
```bash
npm install -g pm2
```

### Step 7: Install PostgreSQL
```bash
apt install postgresql postgresql-contrib -y
```
```bash
systemctl start postgresql
systemctl enable postgresql
```

### Step 8: Install Nginx
```bash
apt install nginx -y
```

### Step 9: Setup Firewall
```bash
apt install ufw -y
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```
Type `y` when asked.

---

## PART 4: SETUP DATABASE

### Step 10: Create Database
```bash
sudo -u postgres psql
```

You'll see `postgres=#` prompt. Type these commands:
```sql
CREATE DATABASE customer_management;
```
```sql
CREATE USER dbuser WITH PASSWORD 'YourStrongPassword123';
```
```sql
GRANT ALL PRIVILEGES ON DATABASE customer_management TO dbuser;
```
```sql
\q
```

**Remember your password!** You'll need it in Step 13.

---

## PART 5: UPLOAD YOUR FILES

### Step 11: Upload Files to VPS

**Option A: Using FileZilla (Recommended)**
1. Download FileZilla from: https://filezilla-project.org/
2. Open FileZilla
3. Fill in at the top:
   - Host: `sftp://123.45.67.89` (your VPS IP)
   - Username: `root`
   - Password: your VPS password
   - Port: `22`
4. Click "Quickconnect"
5. On the right side (Remote site), navigate to: `/var/www/`
6. Right-click and create folder: `customer-management`
7. Enter that folder
8. On the left side (Local site), navigate to your extracted project folder
9. Select ALL files and drag them to the right side
10. Wait for upload to complete (5-10 minutes)

**Option B: Using SCP (Advanced)**
From your local computer terminal:
```bash
scp -r /path/to/your/project root@123.45.67.89:/var/www/customer-management
```

---

## PART 6: CONFIGURE YOUR APP

### Step 12: Go to Your App Folder
In your VPS SSH terminal:
```bash
cd /var/www/customer-management
```

### Step 13: Create .env File
```bash
nano .env
```

Copy and paste this (CHANGE the password to what you used in Step 10):
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://dbuser:YourStrongPassword123@localhost:5432/customer_management
PGHOST=localhost
PGPORT=5432
PGUSER=dbuser
PGPASSWORD=YourStrongPassword123
PGDATABASE=customer_management
SESSION_SECRET=change-this-to-any-random-long-string-12345
```

Press `Ctrl + X`, then `Y`, then `Enter` to save.

### Step 14: Install Dependencies
```bash
npm install
```
Wait 3-5 minutes.

### Step 15: Build the App
```bash
npm run build
```
Wait 1-2 minutes.

### Step 16: Setup Database Tables
```bash
npm run db:push
```

---

## PART 7: START YOUR APP

### Step 17: Start with PM2
```bash
pm2 start ecosystem.config.cjs
```

Check if it's running:
```bash
pm2 list
```

You should see "online" status.

Check if app responds:
```bash
curl http://localhost:5000
```

You should see HTML code.

### Step 18: Save PM2 Config
```bash
pm2 save
pm2 startup systemd
```

Copy the command it shows and run it.

---

## PART 8: CONFIGURE NGINX

### Step 19: Create Nginx Config
```bash
nano /etc/nginx/sites-available/customer-management
```

Copy and paste this (REPLACE `yourdomain.com` with YOUR domain):
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

**If you don't have a domain yet**, use your IP address:
```nginx
server {
    listen 80;
    server_name 123.45.67.89;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Press `Ctrl + X`, then `Y`, then `Enter`.

### Step 20: Enable Site
```bash
ln -s /etc/nginx/sites-available/customer-management /etc/nginx/sites-enabled/
```

### Step 21: Test and Restart Nginx
```bash
nginx -t
```

Should say "test is successful".

```bash
systemctl restart nginx
```

---

## PART 9: TEST YOUR WEBSITE

### Step 22: Visit Your Website
Open your browser and go to:
- If you have a domain: `http://yourdomain.com`
- If using IP: `http://123.45.67.89`

You should see your Customer Management app! 🎉

---

## PART 10: ADD SSL (HTTPS) - OPTIONAL

**Only do this if you have a domain name**

### Step 23: Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### Step 24: Get SSL Certificate
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose option 2 (redirect HTTP to HTTPS)

Now visit: `https://yourdomain.com` 🔒

---

## 🎯 DONE!

Your app is now live on Hostinger!

---

## Common Commands You'll Need

**View app logs:**
```bash
pm2 logs customer-management
```

**Restart app:**
```bash
pm2 restart customer-management
```

**Stop app:**
```bash
pm2 stop customer-management
```

**View all running apps:**
```bash
pm2 list
```

**Restart Nginx:**
```bash
systemctl restart nginx
```

**View Nginx errors:**
```bash
tail -50 /var/log/nginx/error.log
```

---

## If Something Goes Wrong

1. **App won't start?**
   ```bash
   pm2 logs customer-management
   ```

2. **Database error?**
   Check your .env file password matches Step 10

3. **403 Forbidden?**
   ```bash
   chmod -R 755 /var/www/customer-management
   chown -R www-data:www-data /var/www/customer-management
   systemctl restart nginx
   ```

4. **Can't connect to VPS?**
   Check your IP and password in Hostinger dashboard

---

Need help? Tell me which step number you're stuck on!
