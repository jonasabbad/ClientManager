# Database Migration Guide

## Export Data from Replit

If you have existing client data on Replit that you want to move to Hostinger, follow these steps:

### Step 1: Export from Replit Database

On Replit, you can export your database in two ways:

#### Option A: Using the Database Tab
1. Go to the "Database" tab in Replit
2. Click on "Export" or "Backup"
3. Download the SQL dump file

#### Option B: Using pg_dump Command
Run this in your Replit shell:
```bash
pg_dump $DATABASE_URL > backup.sql
```

This creates a file called `backup.sql` with all your data.

---

### Step 2: Download the Backup File

If you used Option B:
1. The `backup.sql` file is now in your Replit workspace
2. Download it to your computer:
   - Click on the file in the Files panel
   - Click the three dots (⋮)
   - Select "Download"

---

### Step 3: Upload to Hostinger VPS

Upload the backup file to your Hostinger VPS:

```bash
# From your local computer, upload via SCP
scp backup.sql root@your-vps-ip:/var/www/customer-management/
```

Or use FileZilla/WinSCP to upload the file.

---

### Step 4: Import to Hostinger Database

SSH into your VPS and run:

```bash
cd /var/www/customer-management

# Import the database
psql -U your_db_user -d customer_management < backup.sql
```

Enter your database password when prompted.

---

### Step 5: Verify Data

Check if the data was imported:

```bash
psql -U your_db_user -d customer_management

# In the PostgreSQL prompt:
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM activities;
SELECT COUNT(*) FROM service_codes;
\q
```

---

## Alternative: Fresh Start

If you don't have important data to migrate, you can start fresh:

1. Just run `npm run db:push` on your VPS
2. The database tables will be created empty
3. Start adding clients in your deployed app

---

## Troubleshooting

### Import Error: "relation already exists"
This means tables already exist. Drop them first:

```bash
psql -U your_db_user -d customer_management

DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS service_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
\q

# Then import again
psql -U your_db_user -d customer_management < backup.sql
```

### Permission Error
Make sure you're using the correct database user:
```bash
psql -U your_db_user -d customer_management < backup.sql
```
